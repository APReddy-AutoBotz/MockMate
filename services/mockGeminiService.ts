
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SessionContext, FinalReport, InterviewTurn, InterviewPlan, SessionControls, QuestionHistoryItem } from '../types';
import { PERSONAS_CONFIG } from '../personas.config';
import { auth } from './firebaseClient';

// Always initialize with an object parameter as per SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The API Base URL - In production, Firebase Hosting proxies /api to Cloud Run
const API_BASE = window.location.origin;

const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return await user.getIdToken();
};

export const generateFinalReport = async (sessionHistory: InterviewTurn[], sessionContext: SessionContext): Promise<FinalReport> => {
    try {
        const token = await getAuthToken();
        
        // 1. Create a session on the backend first if not exists, or just send history
        // Here we call the specialized report generation endpoint you built in Phase 5/7
        const response = await fetch(`${API_BASE}/api/reports/${Date.now()}/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: sessionContext.candidateRole,
                companyBrief: sessionContext.companyBrief,
                history: sessionHistory.map(h => ({
                    question: h.question,
                    candidateResponse: h.candidateResponse
                }))
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Report generation failed");
        }

        return await response.json();
    } catch (e: any) {
        console.warn("Backend report failed, falling back to client-side (Cost Warning):", e);
        // Fallback to client-side if backend is unreachable for some reason during dev
        return await clientSideReportFallback(sessionHistory, sessionContext);
    }
};

// Correcting client-side fallback to follow SDK property access standards
async function clientSideReportFallback(sessionHistory: InterviewTurn[], sessionContext: SessionContext): Promise<FinalReport> {
    const historyText = sessionHistory.map(turn => `Q: ${turn.question}\nA: ${turn.candidateResponse}`).join('\n\n');
    const prompt = `Perform deep analysis for: ${sessionContext.candidateRole}. History:\n${historyText}`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Use Flash for fallback to save Pro quota
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    // Accessing .text property directly as per Gemini 3 SDK rules
    return JSON.parse(response.text || '{}');
}

// Fixed property access and model selection
export const calibrateIntent = async (intentText: string): Promise<{ recommendedPanelIDs: string[], recommendedRole: string }> => {
    const prompt = `Analyze: "${intentText}". Return JSON: {recommendedPanelIDs: string[], recommendedRole: string}`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

// Updated to use Search Grounding correctly and extract URLs as required
export const generateInterviewPlan = async (intentText: string | null, jdText: string | null, controls: SessionControls, selectedPanelIDs: string[]): Promise<InterviewPlan> => {
    const masterPrompt = `Build a comprehensive interview plan for ${intentText}. 
    Return a JSON structure including meta, jdInsights, questionSet, orderingNotes, adaptSpec, and coachPack.`;
    
    // Using Pro model for complex reasoning tasks as recommended
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: masterPrompt,
        config: { 
            // Correct grounding configuration
            tools: [{ googleSearch: {} }] 
        }
    });
    
    let rawText = response.text || '';
    // Strip markdown blocks to ensure JSON validity
    if (rawText.includes('```json')) {
        rawText = rawText.split('```json')[1].split('```')[0].trim();
    } else if (rawText.includes('```')) {
        rawText = rawText.split('```')[1].split('```')[0].trim();
    }
    
    const plan = JSON.parse(rawText);

    // Mandatory: Extract URLs from groundingChunks and list them on the web app
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        plan.researchLinks = chunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title
            }));
    }
    
    return plan;
};

// Fixed .text access for audio transcription
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
    });
    const base64 = await base64Promise;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: audioBlob.type, data: base64 } }, { text: "Transcribe the audio exactly." }] }
    });
    return response.text || '';
};

// Standardizing on .text property access
export const submitAnswerAndGetNext = async (sessionHistory: InterviewTurn[], sessionContext: SessionContext): Promise<{ nextQuestion?: string; persona?: string; isLastQuestion: boolean; }> => {
    if (sessionHistory.length >= 7) return { isLastQuestion: true };
    const prompt = `Based on the conversation history, generate the next logical interview question for the role: ${sessionContext.candidateRole}.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return { nextQuestion: response.text, persona: "Interviewer", isLastQuestion: false };
};

// Standardizing on .text property access
export const startInterviewSession = async (sessionContext: SessionContext): Promise<{ firstQuestion: string; persona: string; updatedContext: SessionContext }> => {
    const prompt = `Start a professional interview for ${sessionContext.candidateRole}. Greet the candidate and ask the first question.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return { firstQuestion: response.text || '', persona: "Interviewer", updatedContext: sessionContext };
};

// Standardizing on .text property access
export const analyzeCode = async (question: any, userCode: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Perform technical code review on the following solution: ${userCode}` });
    return response.text || '';
};

// Standardizing on .text property access and fixing logic
export const getHintForQuestion = async (q: string, signals?: string[]): Promise<string> => {
    const prompt = signals && signals.length > 0 
        ? `Provide a subtle hint for the following interview question: "${q}". The candidate should ideally address: ${signals.join(', ')}. Keep it cryptic but helpful.`
        : `Provide a subtle hint for: "${q}"`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || '';
};
