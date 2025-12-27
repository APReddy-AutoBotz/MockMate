
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SessionContext, InterviewPlan, SessionControls } from '../types';
import * as mockGeminiService from '../services/mockGeminiService';
import PanelSelector from './PanelSelector';
import SessionBuilder from './SessionBuilder';
import { AnimatePresence, motion } from 'framer-motion';
import SessionControlsEditor from './SessionControlsEditor';
import { UploadIcon } from './icons/UploadIcon';
import { audioService } from '../services/audioService';

interface SessionPrepProps {
    onContextReady: (context: SessionContext) => void;
    context: SessionContext;
    onGoBack: () => void;
}

const defaultControls: SessionControls = {
    totalQuestions: 7,
    difficulty: 'mixed',
    startWithBasics: true,
    includeBehavioral: true,
    includeCoding: false,
    phaseMix: { knowledge: 0.4, process: 0.3, scenario: 0.3, coding: 0 },
    timePerQuestion: '90s',
    sessionMode: 'exam',
};

const FileDropZone: React.FC<{ onFileTextExtracted: (text: string) => void }> = ({ onFileTextExtracted }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        setFileName(file.name);
        onFileTextExtracted("Extracted text would be here...");
    };

    return (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 px-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex items-center justify-center gap-4 group"
        >
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && processFile(e.target.files[0])} className="hidden" />
            <UploadIcon className="w-6 h-6 text-info-blue group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em]">
                {fileName ? `Locked: ${fileName}` : 'Upload JD or Resume (Optional)'}
            </span>
        </div>
    );
};

const SessionPrep: React.FC<SessionPrepProps> = ({ onContextReady, context, onGoBack }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPlanReady, setIsPlanReady] = useState(false);
    const [plan, setPlan] = useState<InterviewPlan | null>(null);
    const [selectedPanelIDs, setSelectedPanelIDs] = useState<string[]>([]);
    const [showCustomization, setShowCustomization] = useState(false);
    const [sessionControls, setSessionControls] = useState<SessionControls>(defaultControls);
    const [currentContext, setCurrentContext] = useState(context);

    useEffect(() => {
        const init = async () => {
            const { recommendedPanelIDs, recommendedRole } = await mockGeminiService.calibrateIntent(context.intentText);
            setSelectedPanelIDs(recommendedPanelIDs);
            setCurrentContext(prev => ({...prev, candidateRole: recommendedRole, selectedPanelIDs: recommendedPanelIDs }));
            setIsLoading(false);
        };
        init();
    }, [context.intentText]);

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        audioService.playStart();
        try {
            const interviewPlan = await mockGeminiService.generateInterviewPlan(context.intentText, null, sessionControls, selectedPanelIDs);
            setPlan(interviewPlan);
            setIsPlanReady(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartSession = () => {
        if (!plan) return;
        audioService.playConfirm();
        const weights = plan.jdInsights?.competencyWeights || {};
        const weightsArray = Object.entries(weights).map(([key, val]) => ({ competency: key, weight: val as number }));
        onContextReady({ ...currentContext, selectedPanelIDs, interviewPlan: plan, competencyWeights: weightsArray, jdInsights: plan.jdInsights });
    };

    return (
        <div className="w-full flex flex-col items-center">
            <AnimatePresence mode="wait">
                {!isPlanReady ? (
                    <motion.div key="prep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl space-y-10">
                        <FileDropZone onFileTextExtracted={() => {}} />
                        <PanelSelector selectedPanelIDs={selectedPanelIDs} onSelectionChange={setSelectedPanelIDs} />
                        
                        {/* Advanced Parameters Bar */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                            <button 
                                onClick={() => { audioService.playConfirm(); setShowCustomization(!showCustomization); }}
                                className="w-full px-8 py-6 flex justify-between items-center hover:bg-white/5 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${showCustomization ? 'bg-action-teal' : 'bg-white/20'}`} />
                                    <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Advanced Parameters</span>
                                </div>
                                <span className={`text-info-blue text-xs transition-transform ${showCustomization ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {showCustomization && (
                                <div className="px-8 pb-8 border-t border-white/5">
                                    <SessionControlsEditor controls={sessionControls} onChange={setSessionControls} />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={onGoBack} className="flex-1 bg-white/5 text-text-secondary font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] border border-white/10">← Back</button>
                            <button onClick={handleGeneratePlan} disabled={isLoading} className="flex-1 bg-action-teal text-base-surface font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-action-teal/20">
                                {isLoading ? 'Calibrating...' : 'Review Blueprint'}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="blueprint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl space-y-8">
                        {plan && (
                            <SessionBuilder 
                                jdInsights={plan.jdInsights} 
                                competencyWeights={Object.entries(plan.jdInsights?.competencyWeights || {}).map(([k,v]) => ({competency:k, weight:v as number}))} 
                            />
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setIsPlanReady(false)} className="flex-1 bg-white/5 text-text-primary font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] border border-white/10">Adjust Specs</button>
                            <button onClick={handleStartSession} className="flex-1 bg-action-teal text-base-surface font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-action-teal/30 transition-all hover:scale-[1.02]">Initialize Arena</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SessionPrep;
