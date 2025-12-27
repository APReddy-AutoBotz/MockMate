export interface DBUser {
  id: string;
  name: string;
  email: string;
  createdAt: any;
  experienceLevel?: string;
  primaryGoal?: string;
}

export interface DBSession {
  id?: string;
  userId: string;
  role: string;
  sessionType: 'structured' | 'conversational';
  status: 'active' | 'completed' | 'abandoned';
  createdAt: any;
  companyName?: string;
  companyUrl?: string;
  companyBrief?: string;
}

export interface DBTurn {
  id?: string;
  sessionId: string;
  interviewer: string;
  question: string;
  candidateResponse: string;
  timestamp: any;
  questionBlueprint?: any;
}

export interface DBReport {
  sessionId: string;
  overallSummary: string;
  readiness: any;
  advisoryPanel: any[];
  questionPerformance: any[];
  coachPack: any;
  createdAt: any;
}

export interface DBUpload {
  id: string;
  sessionId: string;
  userId: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  createdAt: any;
}