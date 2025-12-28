
export interface UserProfile {
    name: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
    primaryGoal: 'specific_interview' | 'skill_building' | 'career_change';
    companyName?: string;
    companyUrl?: string;
}

export interface SessionContext {
    candidateRole: string;
    intentText: string;
    selectedPanelIDs: string[];
    jdInsights?: JDInsights;
    competencyWeights?: CompetencyWeight[];
    interviewPlan?: InterviewPlan; 
    sessionType: 'structured' | 'conversational';
    sessionMode: 'exam' | 'coach';
    companyName?: string;
    companyUrl?: string;
    companyBrief?: string;
}

export interface SessionControls {
    totalQuestions: number;
    difficulty: 'beginner' | 'mixed' | 'advanced';
    startWithBasics: boolean;
    includeBehavioral: boolean;
    includeCoding?: boolean; 
    phaseMix: {
        knowledge: number;
        process: number;
        scenario: number;
        coding?: number; 
    };
    timePerQuestion: '45s' | '90s' | '120s' | 'none';
    sessionMode: 'exam' | 'coach';
}

export interface JDInsights {
    source: 'realJD' | 'genericProfile' | 'questionBank' | 'attachment';
    mustHaveSkills: string[];
    niceToHave: string[];
    domains: string[];
    tools: string[];
    softSkills: string[];
    competencyWeights: {
        [key: string]: number;
    };
}

export interface QuestionBlueprint {
    id: string;
    phase: 'knowledge' | 'process' | 'scenario' | 'behavioral' | 'coding';
    difficulty: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
    type: 'recall' | 'concept' | 'process' | 'case' | 'roleplay' | 'algorithm';
    question: string;
    expectedSignals: string[];
    failureModes: string[];
    evaluationCriteria?: string[];
    personaWeights: { [key: string]: number };
    rubric: {
        [key: string]: {
            score1: string[];
            score3: string[];
            score5: string[];
        };
    };
    sourceBullets: string[];
    estTimeSec: number;
}

export interface InterviewPlan {
    meta: {
        mode: 'tailored' | 'generic';
        candidateRole: string;
        language: string;
        controls: SessionControls;
    };
    jdInsights: JDInsights;
    questionSet: QuestionBlueprint[];
    orderingNotes: string;
    adaptSpec: {
        rules: string;
    };
    coachPack: {
        competency: string;
        why: string;
        microDrills: string[];
        modelAnswer: string;
    }[];
    researchLinks?: { uri: string; title: string; }[];
}

export interface CompetencyWeight {
    competency: string;
    weight: number;
}

export interface BARS {
    criteria: string;
    score_5_description: string;
    score_3_description: string;
    score_1_description: string;
}

export interface QuestionPerformance {
    question_text: string;
    question_phase?: string;
    user_transcript: string;
    max_impact_response: string;
    feedback: string;
    bars_rubric?: BARS[];
}

export interface AdvisorAssessment {
    persona: string;
    summary: string;
    scores: {
        skill: string;
        score: number;
    }[];
}

export interface MicroDrill {
    weakness: string;
    drill_prompt: string;
    focus_point: string;
}

export interface CoachPack {
    title: string;
    redoNow: {
        question: string;
        instruction: string;
    };
    micro_drills: MicroDrill[];
}

export interface FinalReport {
    overallSummary: string;
    jdInsights: JDInsights;
    competencyWeights: CompetencyWeight[];
    advisoryPanel: AdvisorAssessment[];
    questionPerformance: QuestionPerformance[];
    coachPack: CoachPack;
    readiness?: {
        status: string;
        reasoning: string;
    };
    biggestRiskArea?: {
        title: string;
        observation?: string;
        consequence?: string;
        mitigation?: string;
    };
}

export interface InterviewTurn {
    interviewer: string;
    question: string;
    candidateResponse: string;
    questionBlueprint?: QuestionBlueprint;
    codeFeedback?: string;
}

export interface SessionHistoryRecord {
    id: string;
    timestamp: number;
    role: string;
    avgScore: number;
    readinessStatus: string;
    biggestRisk: string;
    sessionType: string;
}

export interface QuestionHistoryItem {
    id: string; 
    question: string;
    role: string;
    timestamp: number;
}
