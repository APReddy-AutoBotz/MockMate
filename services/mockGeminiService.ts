
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SessionContext, FinalReport, InterviewTurn, InterviewPlan, SessionControls, UserProfile, JDInsights } from '../types';
import { PERSONAS_CONFIG } from '../personas.config';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractJson = (text: string) => {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let parsed = null;
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            parsed = JSON.parse(text);
        }
        return parsed;
    } catch (e) {
        console.error("JSON extraction failed:", e);
        return null;
    }
};

const getUserProfile = (): UserProfile | null => {
    const stored = localStorage.getItem('mockmate_user_profile');
    return stored ? JSON.parse(stored) : null;
};

/**
 * Calibrates the interview intent and selects the most logical panel of experts.
 */
export const calibrateIntent = async (intentText: string): Promise<{ recommendedPanelIDs: string[], recommendedRole: string }> => {
    // We create a summary of available personas so the model understands who they are.
    const personaRegistry = PERSONAS_CONFIG.map(p => ({
        id: p.id,
        name: p.name,
        title: p.title,
        focus: p.focus,
        domains: p.domain
    }));

    const prompt = `Act as an Elite Tech Headhunter and Talent Strategist. 
    CANDIDATE GOAL: "${intentText}"

    AVAILABLE INTERVIEWER POOL:
    ${JSON.stringify(personaRegistry, null, 2)}

    TASK:
    1. Determine the official, standardized Job Title for the goal (e.g. "RPA Business Analyst").
    2. Select EXACTLY 3 interviewers from the pool that make the MOST sense for this specific role.
    3. STRATEGY RULES:
       - Match the DOMAINS (e.g., if Tech/Business, DO NOT pick 'Healthcare' personas).
       - Aim for diversity: Usually 1 Technical/Domain lead, 1 PM/Manager, and 1 Talent/HR specialist.
       - NEVER pick a 'Clinical Supervisor' for a corporate/tech role.

    Return JSON: { "recommendedPanelIDs": string[], "recommendedRole": string }`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendedPanelIDs: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "IDs of the 3 most relevant personas for this role."
                    },
                    recommendedRole: { 
                        type: Type.STRING,
                        description: "The standardized job title derived from the intent."
                    }
                },
                required: ["recommendedPanelIDs", "recommendedRole"]
            }
        }
    });
    
    const parsed = extractJson(response.text || '{}');
    
    // Safety check: Ensure we actually got valid IDs from the registry
    const validIDs = PERSONAS_CONFIG.map(p => p.id);
    const filteredIDs = (parsed?.recommendedPanelIDs || [])
        .filter((id: string) => validIDs.includes(id))
        .slice(0, 3);

    return {
        recommendedPanelIDs: filteredIDs.length === 3 ? filteredIDs : ["p1", "p2", "p3"],
        recommendedRole: parsed?.recommendedRole || intentText
    };
};

export const generateInterviewPlan = async (intentText: string | null, jdText: string | null, controls: SessionControls, selectedPanelIDs: string[]): Promise<InterviewPlan> => {
    const profile = getUserProfile();
    const questionCount = controls.totalQuestions || 7;
    const experience = profile?.experienceLevel || 'mid';
    
    let sourceLabel: 'realJD' | 'genericProfile' | 'questionBank' | 'attachment' = 'genericProfile';
    if (jdText && jdText.trim().length > 20) {
        const lines = jdText.split('\n');
        const hasQuestions = jdText.includes('?') && lines.length < 15;
        
        if (jdText.includes('[Extracted from PDF:')) sourceLabel = 'attachment';
        else if (hasQuestions) sourceLabel = 'questionBank';
        else sourceLabel = 'realJD';
    }

    const masterPrompt = `You are an elite Staffing PM designing a high-stakes interview strategy for a ${intentText} candidate (${experience} level).
    ROLE CONTEXT: The role is strictly ${intentText}.
    INPUT SOURCE: ${jdText || "Industry-standard expectations for a " + intentText}
    
    TASK: 
    1. Use Google Search to identify current, high-signal interview questions and technical requirements specifically for the ${intentText} position.
    2. Create a detailed JDInsights object based on the search results and input.
    3. Generate exactly ${questionCount} question blueprints that are EXCLUSIVELY and DEEPLY relevant to the ${intentText} role.
    4. STRICLY FORBIDDEN: Do not generate generic behavioral or unrelated questions. If the role is technical like RPA Business Analyst, focus on automation tools (UiPath, Blue Prism), process mapping, PDD/SDD creation, and stakeholder management within automation.
    5. Ensure the competency weights reflect the core pillars of the role.
    
    You MUST return a valid JSON object matching the requested schema. Do not omit the jdInsights object.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: masterPrompt,
        config: { 
            responseMimeType: "application/json",
            temperature: 0.1,
            tools: [{googleSearch: {}}],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    meta: {
                        type: Type.OBJECT,
                        properties: {
                            mode: { type: Type.STRING },
                            candidateRole: { type: Type.STRING },
                            language: { type: Type.STRING },
                            controls: { 
                                type: Type.OBJECT,
                                description: "Configuration for the session flow.",
                                properties: {
                                    totalQuestions: { type: Type.INTEGER },
                                    difficulty: { type: Type.STRING },
                                    sessionMode: { type: Type.STRING }
                                },
                                required: ["totalQuestions", "difficulty"]
                            }
                        },
                        required: ["candidateRole"]
                    },
                    jdInsights: {
                        type: Type.OBJECT,
                        properties: {
                            mustHaveSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            niceToHave: { type: Type.ARRAY, items: { type: Type.STRING } },
                            domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                            tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                            softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            competencyWeights: { 
                                type: Type.OBJECT,
                                description: "Map of competencies to their relative importance (0-1).",
                                properties: {
                                    technical: { type: Type.NUMBER },
                                    behavioral: { type: Type.NUMBER },
                                    communication: { type: Type.NUMBER },
                                    problemSolving: { type: Type.NUMBER }
                                }
                            }
                        },
                        required: ["mustHaveSkills", "niceToHave", "domains", "tools", "softSkills", "competencyWeights"]
                    },
                    questionSet: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                phase: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                type: { type: Type.STRING },
                                question: { type: Type.STRING },
                                expectedSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
                                failureModes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                personaWeights: { 
                                    type: Type.OBJECT,
                                    description: "Weights for which interviewer is most likely to ask this.",
                                    properties: {
                                        p1: { type: Type.NUMBER },
                                        p2: { type: Type.NUMBER },
                                        p3: { type: Type.NUMBER },
                                        s1: { type: Type.NUMBER }
                                    }
                                },
                                rubric: { 
                                    type: Type.OBJECT,
                                    description: "Evaluation criteria for scoring responses.",
                                    properties: {
                                        impact: {
                                            type: Type.OBJECT,
                                            properties: {
                                                score1: { type: Type.ARRAY, items: { type: Type.STRING } },
                                                score3: { type: Type.ARRAY, items: { type: Type.STRING } },
                                                score5: { type: Type.ARRAY, items: { type: Type.STRING } }
                                            },
                                            required: ["score1", "score3", "score5"]
                                        }
                                    }
                                },
                                sourceBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                                estTimeSec: { type: Type.NUMBER }
                            },
                            required: ["id", "question", "phase", "difficulty"]
                        }
                    },
                    orderingNotes: { type: Type.STRING },
                    adaptSpec: {
                        type: Type.OBJECT,
                        properties: { 
                            rules: { type: Type.STRING } 
                        },
                        required: ["rules"]
                    },
                    coachPack: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                competency: { type: Type.STRING },
                                why: { type: Type.STRING },
                                microDrills: { type: Type.ARRAY, items: { type: Type.STRING } },
                                modelAnswer: { type: Type.STRING }
                            },
                            required: ["competency", "why"]
                        }
                    }
                },
                required: ["jdInsights", "questionSet"]
            }
        }
    });

    const plan = extractJson(response.text || '{}');
    if (!plan || !plan.jdInsights) {
        console.error("Critical failure: AI returned incomplete plan structure", plan);
        throw new Error("Strategic blueprint failed to initialize.");
    }

    // Inject metadata if missing
    if (!plan.meta) {
        plan.meta = {
            mode: 'tailored',
            candidateRole: intentText,
            language: 'English',
            controls: controls
        };
    }
    
    plan.jdInsights.source = sourceLabel;
    return plan as InterviewPlan;
};

export const startInterviewSession = async (sessionContext: SessionContext): Promise<{ firstQuestion: string; personaId: string; updatedContext: SessionContext }> => {
    const firstId = sessionContext.selectedPanelIDs[0] || 'p1';
    const persona = PERSONAS_CONFIG.find(p => p.id === firstId);
    const prompt = `You are ${persona?.name}, ${persona?.title}. Ask a sharp opening question for a ${sessionContext.candidateRole} role. Return ONLY text.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return { firstQuestion: response.text || 'Tell me about yourself.', personaId: firstId, updatedContext: sessionContext };
};

export const submitAnswerAndGetNext = async (sessionHistory: InterviewTurn[], sessionContext: SessionContext, personaId: string): Promise<{ nextQuestion?: string; isLastQuestion: boolean; }> => {
    const totalAllowed = sessionContext.interviewPlan?.meta?.controls?.totalQuestions || 7;
    if (sessionHistory.length >= totalAllowed) return { isLastQuestion: true };
    const persona = PERSONAS_CONFIG.find(p => p.id === personaId) || PERSONAS_CONFIG[0];
    const prompt = `You are ${persona.name}, ${persona.title}. Focus: ${persona.focus}. Ask a high-signal follow-up for ${sessionContext.candidateRole}. SESSION HISTORY:\n${sessionHistory.slice(-2).map(h => `Q: ${h.question}\nA: ${h.candidateResponse}`).join('\n\n')}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return { nextQuestion: response.text, isLastQuestion: false };
};

export const analyzeCode = async (question: any, userCode: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Critique this code:\n${userCode}` });
    return response.text || 'Analysis complete.';
};

export const getHintForQuestion = async (q: string, signals?: string[]): Promise<string> => {
    const prompt = `Socratic nudge for: "${q}". Rules: No answer, under 20 words.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || 'Think about the impact of your actions.';
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
    });
    const base64 = await base64Promise;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: 'audio/webm', data: base64 } }, { text: "Transcribe exactly." }] }
    });
    return response.text || '';
};

export const generateFinalReport = async (sessionHistory: InterviewTurn[], sessionContext: SessionContext): Promise<FinalReport> => {
    const historyText = sessionHistory.map((h, i) => `[TURN ${i+1}] ${h.interviewer}\nQ: ${h.question}\nA: ${h.candidateResponse}`).join('\n\n');
    
    const prompt = `You are an elite interview assessment engine. Synthesize a professional Performance Audit for a ${sessionContext.candidateRole} candidate based on this transcript:
    ${historyText}

    CRITICAL REQUIREMENTS:
    - For EVERY turn (including those marked '[SKIPPED]'), you MUST provide a comprehensive 'max_impact_response' demonstrating what an ideal, high-performing answer would look like.
    - Title: "Targeted Mastery Lab" or similar high-signal brand.
    - Top 3 Weaknesses: Explicitly identify the 3 most damaging habits/gaps from this specific session.
    - Micro-Drills: For each weakness, design a specific, actionable re-practice prompt. 
    - Redo Now: Select the single question the candidate failed most significantly. Provide a brief instruction on how to pivot their answer.

    JSON SCHEMA REQUIREMENTS:
    - overallSummary: narrative synthesis.
    - readiness: { status, reasoning }.
    - advisoryPanel: scores and feedback per participant.
    - questionPerformance: feedback and 'max_impact_response' for EVERY turn.
    - biggestRiskArea: single critical vulnerability.
    - coachPack: { title, redoNow: { question, instruction }, micro_drills: [{ weakness, drill_prompt, focus_point }] }.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    overallSummary: { type: Type.STRING },
                    readiness: {
                        type: Type.OBJECT,
                        properties: {
                            status: { type: Type.STRING },
                            reasoning: { type: Type.STRING }
                        },
                        required: ["status", "reasoning"]
                    },
                    advisoryPanel: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                persona: { type: Type.STRING },
                                summary: { type: Type.STRING },
                                scores: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            skill: { type: Type.STRING },
                                            score: { type: Type.NUMBER }
                                        },
                                        required: ["skill", "score"]
                                    }
                                }
                            },
                            required: ["persona", "summary", "scores"]
                        }
                    },
                    questionPerformance: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question_text: { type: Type.STRING },
                                user_transcript: { type: Type.STRING },
                                max_impact_response: { type: Type.STRING },
                                feedback: { type: Type.STRING }
                            },
                            required: ["question_text", "user_transcript", "max_impact_response", "feedback"]
                        }
                    },
                    biggestRiskArea: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            observation: { type: Type.STRING },
                            mitigation: { type: Type.STRING }
                        },
                        required: ["title", "observation", "mitigation"]
                    },
                    coachPack: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            redoNow: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    instruction: { type: Type.STRING }
                                }
                            },
                            micro_drills: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        weakness: { type: Type.STRING },
                                        drill_prompt: { type: Type.STRING },
                                        focus_point: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        required: ["title", "redoNow", "micro_drills"]
                    }
                },
                required: ["overallSummary", "readiness", "advisoryPanel", "questionPerformance", "biggestRiskArea", "coachPack"]
            }
        }
    });
    
    const report = extractJson(response.text || '{}');
    
    if (report && report.questionPerformance) {
        report.questionPerformance.forEach((qp: any, idx: number) => {
            if (!qp.user_transcript || qp.user_transcript === "undefined") {
                qp.user_transcript = sessionHistory[idx]?.candidateResponse || "[Transcript Missing]";
            }
        });
    }

    return {
        ...report,
        jdInsights: sessionContext.jdInsights,
        competencyWeights: sessionContext.competencyWeights
    } as FinalReport;
};
