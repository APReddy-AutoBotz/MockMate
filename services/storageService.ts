
import { SessionHistoryRecord, FinalReport } from '../types';

const HISTORY_KEY = 'mockmate_session_history';

export const saveSessionToHistory = (report: FinalReport, role: string, type: 'structured' | 'conversational') => {
    try {
        if (!report) return;
        
        const historyJson = localStorage.getItem(HISTORY_KEY);
        const history: SessionHistoryRecord[] = historyJson ? JSON.parse(historyJson) : [];
        
        const allScores: number[] = [];
        (report.advisoryPanel || []).forEach(adv => {
            (adv.scores || []).forEach(s => allScores.push(s.score));
        });
        const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

        const newRecord: SessionHistoryRecord = {
            id: `session_${Date.now()}`,
            timestamp: Date.now(),
            role: role || 'Unknown Role',
            avgScore: parseFloat(avgScore.toFixed(1)),
            readinessStatus: report.readiness?.status || 'NOT_READY',
            biggestRisk: report.biggestRiskArea?.title || 'No major risk identified',
            sessionType: type
        };

        const updatedHistory = [newRecord, ...history].slice(0, 50); 
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
        console.error("Failed to save session history:", e);
    }
};

export const getSessionHistory = (): SessionHistoryRecord[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error("Failed to read session history:", e);
        return [];
    }
};

export const clearAllHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
