
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionContext, FinalReport, InterviewTurn, QuestionBlueprint } from '../types';
import * as mockGeminiService from '../services/mockGeminiService';
import PushToTalkInput from './PushToTalkInput';
import CodeEditor from './CodeEditor';
import PresenceMonitor from './PresenceMonitor';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { PERSONAS_CONFIG } from '../personas.config';
import { DevLeadIcon } from './icons/personaIcons';
import { audioService } from '../services/audioService';
import { trackQuestionUsage } from '../services/storageService';

interface MockSessionProps {
    sessionContext: SessionContext;
    onReportGenerated: (report: FinalReport) => void;
    onCancel: () => void;
}

type SessionPhase = 'loading_question' | 'asking' | 'thinking' | 'reviewing' | 'confirm_exit' | 'confirm_skip' | 'generating_report';

const MockSession: React.FC<MockSessionProps> = ({ sessionContext, onReportGenerated, onCancel }) => {
    const [sessionPhase, setSessionPhase] = useState<SessionPhase>('loading_question');
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [currentInterviewer, setCurrentInterviewer] = useState<string | null>(null);
    const [currentBlueprint, setCurrentBlueprint] = useState<QuestionBlueprint | null>(null);
    const [lastTranscript, setLastTranscript] = useState<string | null>(null);
    const [codeValue, setCodeValue] = useState<string>('');
    const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
    const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [localContext, setLocalContext] = useState(sessionContext);
    
    const sessionHistory = useRef<InterviewTurn[]>([]);
    const currentQuestionIndex = useRef(0);
    
    const totalExpectedQuestions = sessionContext.interviewPlan?.meta?.controls?.totalQuestions || 7;

    useEffect(() => {
        const startSession = async () => {
            setSessionPhase('loading_question');
            let qText = '';
            let personaId = '';
            
            try {
                if (sessionContext.sessionType === 'structured' && sessionContext.interviewPlan?.questionSet?.length) {
                    const firstQuestion = sessionContext.interviewPlan.questionSet[0];
                    if (firstQuestion && firstQuestion.question) {
                        setCurrentBlueprint(firstQuestion);
                        setCurrentQuestion(firstQuestion.question);
                        // Get the heaviest weighted persona for this question
                        personaId = Object.entries(firstQuestion.personaWeights || {})
                            .sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || sessionContext.selectedPanelIDs[0] || 'p1';
                        
                        updateInterviewerUI(personaId, firstQuestion.phase === 'coding');
                        qText = firstQuestion.question;
                    }
                } else {
                    const { firstQuestion, personaId: startId, updatedContext } = await mockGeminiService.startInterviewSession(sessionContext);
                    setLocalContext(updatedContext);
                    setCurrentQuestion(firstQuestion);
                    updateInterviewerUI(startId);
                    qText = firstQuestion;
                }

                if (!qText || qText.trim() === "") {
                    qText = "Welcome to the session. To get us started, could you walk me through your most relevant professional achievement that aligns with this role?";
                    setCurrentQuestion(qText);
                    updateInterviewerUI(sessionContext.selectedPanelIDs[0] || 'p1');
                }

                trackQuestionUsage(qText, sessionContext.candidateRole);
                audioService.playNotify();
                setSessionPhase('asking');
            } catch (err) {
                console.error("Session start error", err);
                onCancel();
            }
        };
        startSession();
    }, [sessionContext]);

    const updateInterviewerUI = (personaId: string, isCoding = false) => {
        if (isCoding) {
            setCurrentInterviewer(`Vikram — Dev Lead`);
        } else {
            const persona = PERSONAS_CONFIG.find(p => p.id === personaId) || PERSONAS_CONFIG[0];
            setCurrentInterviewer(`${persona.name} — ${persona.title}`);
        }
    }

    const handleAnswerSubmit = async (transcript: string) => {
        if (!currentQuestion || !currentInterviewer) return;
        audioService.playConfirm();
        setHint(null);
        setLastTranscript(transcript);
        setSessionPhase('reviewing');
    };

    const handleCodeSubmit = async (code: string) => {
        if (!currentBlueprint) return;
        setIsAnalyzingCode(true);
        audioService.playStart();
        try {
            const feedback = await mockGeminiService.analyzeCode(currentBlueprint, code);
            setCodeFeedback(feedback);
            setLastTranscript(code); 
            setSessionPhase('reviewing');
        } catch (e) {
            setLastTranscript(code);
            setSessionPhase('reviewing');
        } finally {
            setIsAnalyzingCode(false);
        }
    };

    const handleConfirmTranscript = () => {
        if (!currentQuestion || !currentInterviewer || !lastTranscript) return;
        audioService.playConfirm();
        sessionHistory.current.push({
            interviewer: currentInterviewer,
            question: currentQuestion,
            candidateResponse: lastTranscript,
            questionBlueprint: currentBlueprint ?? undefined,
            codeFeedback: codeFeedback || undefined
        });
        handleProceedToNextQuestion();
    };

    const handleReRecord = () => {
        audioService.playEnd();
        setLastTranscript(null);
        setCodeFeedback(null);
        setSessionPhase('asking');
    };

    const handleRequestHint = async () => {
        if (!currentQuestion || isHintLoading) return;
        setIsHintLoading(true);
        audioService.playConfirm();
        try {
            const nudge = await mockGeminiService.getHintForQuestion(currentQuestion);
            setHint(nudge);
        } catch (e) {
            setHint("Focus on the core intent of the role and your direct impact.");
        } finally {
            setIsHintLoading(false);
        }
    };

    const handleSkipClick = () => {
        audioService.playConfirm();
        setSessionPhase('confirm_skip');
    };

    const handleConfirmSkip = () => {
        if (!currentQuestion || !currentInterviewer) return;
        audioService.playConfirm();
        sessionHistory.current.push({
            interviewer: currentInterviewer,
            question: currentQuestion,
            candidateResponse: '[SKIPPED]',
            questionBlueprint: currentBlueprint ?? undefined
        });
        handleProceedToNextQuestion();
    };

    const handleProceedToNextQuestion = async () => {
        const currentTotal = localContext.interviewPlan?.meta?.controls?.totalQuestions || 7;
        
        if (sessionHistory.current.length >= currentTotal) {
            generateReport();
            return;
        }

        setSessionPhase('thinking');
        setCurrentQuestion(null);
        setCurrentBlueprint(null);
        setLastTranscript(null);
        setCodeValue('');
        setCodeFeedback(null);
        setHint(null);

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            if (localContext.sessionType === 'structured' && localContext.interviewPlan?.questionSet?.length) {
                currentQuestionIndex.current++;
                const blueprint = localContext.interviewPlan.questionSet[currentQuestionIndex.current];
                if (blueprint && blueprint.question) {
                     setCurrentBlueprint(blueprint);
                     setCurrentQuestion(blueprint.question);
                     const personaId = Object.entries(blueprint.personaWeights || {})
                        .sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || localContext.selectedPanelIDs[currentQuestionIndex.current % localContext.selectedPanelIDs.length] || 'p1';
                     
                     updateInterviewerUI(personaId, blueprint.phase === 'coding');
                     audioService.playNotify();
                     setSessionPhase('asking');
                     trackQuestionUsage(blueprint.question, localContext.candidateRole);
                } else {
                    generateReport();
                }
            } else {
                // Determine next interviewer for conversational mode
                const nextIndex = sessionHistory.current.length % localContext.selectedPanelIDs.length;
                const nextPersonaId = localContext.selectedPanelIDs[nextIndex];

                const { nextQuestion, isLastQuestion } = await mockGeminiService.submitAnswerAndGetNext(
                    sessionHistory.current, 
                    localContext,
                    nextPersonaId
                );

                if (isLastQuestion) {
                    generateReport();
                } else if (nextQuestion) {
                    setCurrentQuestion(nextQuestion);
                    updateInterviewerUI(nextPersonaId);
                    audioService.playNotify();
                    setSessionPhase('asking');
                    trackQuestionUsage(nextQuestion, localContext.candidateRole);
                } else {
                    generateReport();
                }
            }
        } catch (err) {
            generateReport();
        }
    };
    
    const generateReport = async () => {
        if (sessionHistory.current.length === 0) {
            onCancel();
            return;
        }
        setSessionPhase('generating_report');
        try {
            const report = await mockGeminiService.generateFinalReport(sessionHistory.current.slice(), localContext);
            onReportGenerated(report);
        } catch (error) {
            console.error("Report synthesis failed:", error);
            onCancel();
        }
    }

    const handleCancelClick = () => {
        audioService.playEnd();
        if (sessionHistory.current.length > 0) {
            setSessionPhase('confirm_exit');
        } else {
            onCancel();
        }
    };

    const getPersonaDetails = (personaString: string | null) => {
        if (!personaString) return null;
        const name = personaString.split('—')[0].trim();
        return PERSONAS_CONFIG.find(p => p.name === name);
    };

    const currentPersona = getPersonaDetails(currentInterviewer);
    const isCodingQuestion = currentBlueprint?.phase === 'coding';
    const PersonaIcon = isCodingQuestion ? DevLeadIcon : currentPersona?.icon;

    return (
        <div className="w-full h-full flex flex-col bg-transparent rounded-[2.5rem] overflow-hidden relative">
            {/* Header - Compact */}
            <div className="flex justify-between items-center w-full px-10 py-4 z-30 border-b border-white/5 bg-[#0A192F]/60 backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${sessionPhase === 'asking' ? 'bg-action-teal animate-pulse shadow-[0_0_10px_rgba(20,200,176,0.6)]' : 'bg-white/10'}`} />
                    <h2 className="text-[10px] font-black text-white tracking-[0.2em] uppercase opacity-80">
                        {sessionPhase === 'asking' ? 'Active Dialogue' : 'Calibrating'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg">
                        <span className="text-[9px] font-black text-info-blue uppercase tracking-widest opacity-40">Phase</span>
                        <span className="text-[10px] font-mono font-bold text-white">{sessionHistory.current.length + 1} / {totalExpectedQuestions}</span>
                    </div>
                    <button 
                        onClick={handleCancelClick} 
                        className="text-[9px] font-black text-text-secondary hover:text-white transition-all tracking-widest px-4 py-1.5 border border-white/5 rounded-full bg-white/[0.02] hover:bg-white/[0.05] uppercase"
                    >
                        End
                    </button>
                </div>
            </div>

            {/* Main Content Area - Scrollable but contained */}
            <div className="flex-grow flex flex-col items-center justify-center relative overflow-y-auto px-6 py-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {sessionPhase === 'loading_question' || sessionPhase === 'generating_report' || sessionPhase === 'thinking' ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <LoadingSpinner />
                            <p className="mt-6 text-[10px] font-black text-info-blue uppercase tracking-[0.3em] opacity-60">
                                {sessionPhase === 'generating_report' ? 'Synthesizing Performance Audit' : 
                                 sessionPhase === 'thinking' ? 'Deliberating...' :
                                 'Calibrating Protocol'}
                            </p>
                        </motion.div>
                    ) : sessionPhase === 'confirm_exit' ? (
                        <motion.div key="exit" className="w-full max-w-md text-center space-y-8">
                            <h3 className="text-3xl font-serif font-bold text-white tracking-tight">Discard Rehearsal?</h3>
                            <div className="flex flex-col gap-3">
                                <button onClick={generateReport} className="bg-action-teal text-base-surface font-black py-4 rounded-xl tracking-[0.15em] text-[10px] uppercase shadow-xl">Generate Partial Audit</button>
                                <button onClick={onCancel} className="bg-white/5 text-text-secondary font-black py-4 rounded-xl border border-white/10 tracking-[0.15em] text-[10px] uppercase">Full Termination</button>
                                <button onClick={() => setSessionPhase('asking')} className="text-[9px] font-black text-info-blue uppercase py-3">Resume</button>
                            </div>
                        </motion.div>
                    ) : sessionPhase === 'confirm_skip' ? (
                        <motion.div key="skip" className="w-full max-w-md text-center space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-3xl font-serif font-bold text-white tracking-tight">Skip Current Inquiry?</h3>
                                <p className="text-sm text-text-secondary font-medium leading-relaxed opacity-60">
                                    Skipping will record a null response in your performance audit, potentially impacting your final readiness score.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleConfirmSkip} className="bg-accent-amber text-base-surface font-black py-4 rounded-xl tracking-[0.15em] text-[10px] uppercase shadow-xl">Confirm Bypass</button>
                                <button onClick={() => setSessionPhase('asking')} className="bg-white/5 text-text-primary font-black py-4 rounded-xl border border-white/10 text-[10px] uppercase">Resume Rehearsal</button>
                            </div>
                        </motion.div>
                    ) : sessionPhase === 'reviewing' ? (
                        <motion.div key="review" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl text-center">
                            <span className="text-[9px] font-black text-accent-amber uppercase tracking-[0.3em] mb-4 block opacity-60">Transcript Captured</span>
                            <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/10 mb-8 shadow-inner overflow-y-auto max-h-[220px] backdrop-blur-3xl">
                                {isCodingQuestion ? (
                                    <pre className="text-left text-action-teal font-mono text-xs whitespace-pre-wrap leading-relaxed opacity-90">{lastTranscript}</pre>
                                ) : (
                                    <p className="text-white font-medium text-lg md:text-xl leading-snug tracking-tight">"{lastTranscript}"</p>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={handleConfirmTranscript} className="bg-action-teal text-base-surface font-black py-4 px-10 rounded-xl tracking-[0.15em] text-[10px] uppercase">Confirm Submission</button>
                                <button onClick={handleReRecord} className="bg-white/5 text-text-primary font-black py-4 px-10 rounded-xl border border-white/10 text-[10px] uppercase">Re-Evaluate</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`w-full flex flex-col items-center ${isCodingQuestion ? 'h-full grid grid-cols-1 lg:grid-cols-5 gap-8' : ''}`}>
                             <div className={`${isCodingQuestion ? 'lg:col-span-2 flex flex-col justify-center' : 'w-full flex flex-col items-center max-w-2xl'}`}>
                                {currentPersona && (
                                    <div className="flex flex-col items-center mb-6">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#EA580C]/10 border border-[#EA580C]/40 mb-3 shadow-lg">
                                            {PersonaIcon && <PersonaIcon className="w-6 h-6 text-white opacity-80" />}
                                        </div>
                                        <div className="text-center">
                                            <span className="text-base font-bold text-white/90 uppercase tracking-[0.1em]">{currentPersona.name}</span>
                                            <p className="text-[9px] text-text-secondary font-bold mt-0.5 tracking-widest uppercase opacity-40">{currentPersona.title}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-4 text-center">
                                    <h3 className={`font-serif font-bold text-white tracking-tight leading-snug ${isCodingQuestion ? 'text-lg md:text-xl' : 'text-xl md:text-2xl italic'}`}>
                                        "{currentQuestion || '...'}"
                                    </h3>
                                    
                                    <AnimatePresence>
                                        {hint && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-info-blue/5 border border-info-blue/20 rounded-xl p-4 max-w-lg mx-auto">
                                                <p className="text-[11px] font-medium text-info-blue leading-relaxed italic">“{hint}”</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                             </div>
                             
                             {isCodingQuestion && (
                                <div className="lg:col-span-3 w-full h-[350px] lg:h-[480px]">
                                    <CodeEditor value={codeValue} onChange={setCodeValue} onSubmit={handleCodeSubmit} isProcessing={isAnalyzingCode} feedback={codeFeedback} />
                                </div>
                             )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Interaction Area - Compact and fixed to bottom */}
            <div className="shrink-0 pb-10 pt-4 px-10 w-full flex flex-col items-center z-20 bg-gradient-to-t from-[#0A192F] to-transparent">
                {sessionPhase === 'asking' && (
                    <div className="w-full flex flex-col items-center gap-6 max-w-xl">
                        <div className="flex flex-col items-center w-full gap-4">
                            {!isCodingQuestion && <PushToTalkInput onTranscriptSubmit={handleAnswerSubmit} disabled={false} />}
                            
                            <div className="flex gap-4 items-center flex-wrap justify-center">
                                <button 
                                    onClick={handleRequestHint}
                                    disabled={isHintLoading}
                                    className="text-[9px] font-black text-info-blue hover:text-white transition-colors uppercase tracking-[0.15em] px-4 py-2 border border-info-blue/20 rounded-lg bg-info-blue/5"
                                >
                                    {isHintLoading ? 'Thinking...' : 'Request Coach Nudge'}
                                </button>
                                <button 
                                    onClick={handleSkipClick}
                                    className="text-[9px] font-black text-accent-amber/60 hover:text-accent-amber transition-colors uppercase tracking-[0.15em] px-4 py-2 border border-accent-amber/10 rounded-lg bg-accent-amber/5"
                                >
                                    Skip This Question
                                </button>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.15em] w-full text-center mt-2">Thinking time encouraged</span>
                            </div>
                        </div>
                        <PresenceMonitor historyCount={sessionHistory.current.length} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MockSession;
