
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

interface MockSessionProps {
    sessionContext: SessionContext;
    onReportGenerated: (report: FinalReport) => void;
    onCancel: () => void;
}

type SessionPhase = 'loading_question' | 'asking' | 'thinking' | 'reviewing' | 'confirm_exit' | 'generating_report';

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
    const [localContext, setLocalContext] = useState(sessionContext);
    
    const sessionHistory = useRef<InterviewTurn[]>([]);
    const currentQuestionIndex = useRef(0);
    
    useEffect(() => {
        const startSession = async () => {
            setSessionPhase('loading_question');
            if (sessionContext.sessionType === 'structured') {
                const firstQuestion = sessionContext.interviewPlan?.questionSet[0];
                if (firstQuestion) {
                    setCurrentBlueprint(firstQuestion);
                    setCurrentQuestion(firstQuestion.question);
                    updateInterviewer(firstQuestion);
                }
            } else {
                const { firstQuestion, persona, updatedContext } = await mockGeminiService.startInterviewSession(sessionContext);
                setLocalContext(updatedContext);
                setCurrentQuestion(firstQuestion);
                setCurrentInterviewer(persona);
            }
            audioService.playNotify();
            setSessionPhase('asking');
        };
        startSession();
    }, [sessionContext]);

    const updateInterviewer = (blueprint: QuestionBlueprint) => {
        if (blueprint.phase === 'coding') {
            setCurrentInterviewer(`Vikram — Dev Lead`);
        } else {
            const personaName = Object.keys(blueprint.personaWeights)[0];
            const persona = PERSONAS_CONFIG.find(p => p.name === personaName);
            setCurrentInterviewer(`${persona?.name} — ${persona?.title}`);
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

    const handleProceedToNextQuestion = async () => {
        setSessionPhase('loading_question');
        setCurrentQuestion(null);
        setCurrentBlueprint(null);
        setLastTranscript(null);
        setCodeValue('');
        setCodeFeedback(null);
        setHint(null);

        if (localContext.sessionType === 'structured') {
            currentQuestionIndex.current++;
            const nextQuestion = localContext.interviewPlan?.questionSet[currentQuestionIndex.current];
            if (nextQuestion) {
                 setCurrentBlueprint(nextQuestion);
                 setCurrentQuestion(nextQuestion.question);
                 updateInterviewer(nextQuestion);
                 audioService.playNotify();
                 setSessionPhase('asking');
            } else {
                generateReport();
            }
        } else {
            const { nextQuestion, persona, isLastQuestion } = await mockGeminiService.submitAnswerAndGetNext(sessionHistory.current, localContext);
            if (isLastQuestion) {
                generateReport();
            } else {
                setCurrentQuestion(nextQuestion!);
                setCurrentInterviewer(persona!);
                audioService.playNotify();
                setSessionPhase('asking');
            }
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
            console.error("Report generation failed:", error);
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

    const handleGetHint = async () => {
        if (!currentBlueprint) return;
        audioService.playNotify();
        const generatedHint = await mockGeminiService.getHintForQuestion(currentBlueprint.question, currentBlueprint.expectedSignals);
        setHint(generatedHint);
    }

    const handleSkipQuestion = async () => {
        if (!currentQuestion || !currentInterviewer) return;
        sessionHistory.current.push({
            interviewer: currentInterviewer,
            question: currentQuestion,
            candidateResponse: "[SKIPPED]",
            questionBlueprint: currentBlueprint ?? undefined,
        });
        await handleProceedToNextQuestion();
    };

    const getPersonaDetails = (personaString: string | null) => {
        if (!personaString) return null;
        const name = personaString.split('—')[0].trim();
        return PERSONAS_CONFIG.find(p => p.name === name);
    };

    const currentPersona = getPersonaDetails(currentInterviewer);
    const isCodingQuestion = currentBlueprint?.phase === 'coding';
    const PersonaIcon = isCodingQuestion ? DevLeadIcon : currentPersona?.icon;

    const renderHeader = () => (
        <div className="flex justify-between items-center w-full px-10 py-5 z-30 shrink-0 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl">
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${sessionPhase === 'asking' ? 'bg-action-teal animate-pulse shadow-[0_0_8px_rgba(20,200,176,0.5)]' : 'bg-white/10'}`} />
                    <h2 className="text-[11px] font-bold text-white tracking-widest">
                        Active rehearsal
                    </h2>
                </div>
                <p className="text-[9px] text-text-secondary font-bold tracking-[0.05em] opacity-40 mt-1 uppercase">
                    Environment: {localContext.candidateRole}
                </p>
            </div>
            
            <button 
                onClick={handleCancelClick} 
                className="text-[10px] font-bold text-text-secondary hover:text-white transition-all tracking-widest px-4 py-2 border border-white/5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05]"
            >
                Terminate session
            </button>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-transparent rounded-[2.5rem] overflow-hidden relative">
            {renderHeader()}

            <div className={`flex-grow flex flex-col items-center justify-center px-12 relative overflow-y-auto min-h-0 py-4 ${isCodingQuestion && sessionPhase === 'asking' ? 'max-w-none px-6' : 'max-w-4xl mx-auto'}`}>
                <AnimatePresence mode="wait">
                    {sessionPhase === 'loading_question' || sessionPhase === 'generating_report' ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <LoadingSpinner />
                            <p className="mt-8 text-[11px] font-bold text-info-blue uppercase tracking-[0.3em]">
                                {sessionPhase === 'generating_report' ? 'Compiling performance dossier' : 'Synchronizing environment'}
                            </p>
                        </motion.div>
                    ) : sessionPhase === 'confirm_exit' ? (
                        <motion.div 
                            key="exit"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md text-center space-y-10"
                        >
                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold text-white tracking-tight">Exit rehearsal?</h3>
                                <p className="text-base text-text-secondary font-medium leading-relaxed opacity-60">Capture a partial audit of your performance so far, or discard progress.</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={generateReport}
                                    className="bg-action-teal text-base-surface font-bold py-4 rounded-xl tracking-widest text-[11px] shadow-2xl shadow-action-teal/20 transition-all hover:scale-[1.01]"
                                >
                                    Generate partial audit
                                </button>
                                <button 
                                    onClick={onCancel}
                                    className="bg-white/5 text-text-secondary font-bold py-4 rounded-xl border border-white/10 tracking-widest text-[11px] hover:bg-white/10 transition-all"
                                >
                                    Discard and exit
                                </button>
                                <button 
                                    onClick={() => setSessionPhase('asking')}
                                    className="text-[11px] font-bold text-info-blue uppercase tracking-widest py-3 hover:opacity-80 transition-opacity"
                                >
                                    Resume session
                                </button>
                            </div>
                        </motion.div>
                    ) : sessionPhase === 'reviewing' ? (
                        <motion.div 
                            key="review"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-2xl text-center"
                        >
                            <span className="text-[11px] font-bold text-accent-amber uppercase tracking-[0.2em] mb-4 block opacity-60">Submission captured</span>
                            <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5 mb-8 shadow-inner overflow-y-auto max-h-[250px]">
                                {isCodingQuestion ? (
                                    <pre className="text-left text-action-teal font-mono text-sm whitespace-pre-wrap leading-relaxed opacity-80">
                                        {lastTranscript}
                                    </pre>
                                ) : (
                                    <p className="text-white font-medium text-lg md:text-xl leading-snug tracking-tight">"{lastTranscript}"</p>
                                )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={handleConfirmTranscript}
                                    className="bg-action-teal text-base-surface font-bold py-4 px-10 rounded-xl hover:opacity-90 transition-all tracking-[0.2em] text-[11px] shadow-xl shadow-action-teal/20"
                                >
                                    Confirm submission
                                </button>
                                <button 
                                    onClick={handleReRecord}
                                    className="bg-white/5 text-text-primary font-bold py-4 px-10 rounded-xl hover:bg-white/10 transition-all tracking-[0.2em] text-[11px] border border-white/10"
                                >
                                    Discard & re-evaluate
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`w-full flex flex-col items-center ${isCodingQuestion ? 'h-full grid grid-cols-1 lg:grid-cols-5 gap-8' : ''}`}
                        >
                             <div className={`${isCodingQuestion ? 'lg:col-span-2 flex flex-col justify-center' : 'w-full flex flex-col items-center'}`}>
                                {currentPersona && (
                                    <div className="flex flex-col items-center mb-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-${currentPersona.color}/5 border border-${currentPersona.color}/20 mb-2 shadow-2xl backdrop-blur-xl`}>
                                            {PersonaIcon && <PersonaIcon className={`w-7 h-7 text-${currentPersona.color}`} />}
                                        </div>
                                        <div className="text-center">
                                            <span className={`text-[11px] font-bold text-${currentPersona.color} uppercase tracking-[0.15em]`}>{currentPersona.name}</span>
                                            <p className="text-[10px] text-text-secondary font-medium mt-0.5 tracking-tight opacity-50">{currentPersona.title}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <h3 className={`font-bold text-white text-center tracking-tight leading-snug mb-6 ${isCodingQuestion ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
                                    "{currentQuestion}"
                                </h3>

                                <div className="flex items-center gap-6 mb-3 justify-center">
                                    {localContext.sessionMode === 'coach' && !hint && (
                                        <button 
                                            onClick={handleGetHint}
                                            className="flex items-center gap-3 text-[10px] font-bold text-accent-amber bg-accent-amber/5 border border-accent-amber/20 rounded-xl px-5 py-2.5 hover:bg-accent-amber/10 transition-all uppercase tracking-widest"
                                        >
                                            Expert hint
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleSkipQuestion}
                                        className="text-[10px] font-bold text-text-secondary hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        Skip topic
                                    </button>
                                </div>

                                {hint && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-accent-amber/[0.03] border border-accent-amber/10 p-4 rounded-2xl mb-4 max-w-md shadow-inner"
                                    >
                                        <p className="text-xs text-accent-amber font-medium italic text-center leading-relaxed opacity-80">"{hint}"</p>
                                    </motion.div>
                                )}
                             </div>

                             {isCodingQuestion && (
                                <div className="lg:col-span-3 w-full h-[400px] lg:h-[500px]">
                                    <CodeEditor 
                                        value={codeValue} 
                                        onChange={setCodeValue} 
                                        onSubmit={handleCodeSubmit} 
                                        isProcessing={isAnalyzingCode}
                                        feedback={codeFeedback}
                                    />
                                </div>
                             )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Control Center: Anchoring mic and presence metrics together at the bottom */}
            <div className={`shrink-0 pb-10 pt-4 px-10 w-full mx-auto flex flex-col items-center max-w-2xl`}>
                {sessionPhase === 'asking' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full flex flex-col items-center gap-6"
                    >
                        {!isCodingQuestion && (
                            <PushToTalkInput 
                                onTranscriptSubmit={handleAnswerSubmit}
                                disabled={false}
                            />
                        )}
                        
                        {/* Soft Skill Metrics / Ribbon placed under the microphone button */}
                        <PresenceMonitor />
                        
                        {!isCodingQuestion && (
                            <p className="text-[9px] font-bold text-text-secondary opacity-25 uppercase tracking-[0.3em]">
                                Refined presence required
                            </p>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MockSession;
