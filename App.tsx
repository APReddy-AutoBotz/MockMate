
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import MockSession from './components/MockSession';
import SessionPrep from './components/SessionPrep';
import RoleCapture from './components/RoleCapture';
import GlassCard from './utils/audio';
import InterviewReport from './components/InterviewReport';
import InterviewOrbit from './components/InterviewOrbit';
import { FinalReport, SessionContext, UserProfile } from './types';
import { Logo } from './components/icons/Logo';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import OnboardingQuestions from './components/OnboardingQuestions';
import GrowthDashboard from './components/GrowthDashboard';
import { saveSessionToHistory } from './services/storageService';
import { audioService } from './services/audioService';

type AppState = 'LOADING' | 'LANDING' | 'LOGIN' | 'ONBOARDING' | 'ROLE_SELECTION' | 'CONTEXT_UPLOAD' | 'SESSION_ACTIVE' | 'REPORT_VIEW' | 'HISTORY_VIEW';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('LOADING');
    const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        try {
            const storedProfile = localStorage.getItem('mockmate_user_profile');
            if (storedProfile) {
                setUserProfile(JSON.parse(storedProfile));
                setAppState('ROLE_SELECTION');
            } else {
                setAppState('LANDING');
            }
        } catch (error) {
            console.error("Failed to parse user profile from localStorage", error);
            setAppState('LANDING');
        }
    }, []);
    
    const handleGetStarted = () => {
        audioService.playConfirm();
        setAppState('LOGIN');
    };
    const handleLogin = () => {
        audioService.playStart();
        setAppState('ONBOARDING');
    };
    const handleBackToLanding = () => setAppState('LANDING');
    
    const handleOnboardingComplete = (profile: UserProfile, targetRole: string, sessionType: 'structured' | 'conversational') => {
        audioService.playConfirm();
        try {
            localStorage.setItem('mockmate_user_profile', JSON.stringify(profile));
            setUserProfile(profile);
            
            const initialContext: SessionContext = { 
                candidateRole: targetRole, 
                intentText: targetRole, 
                selectedPanelIDs: [], 
                sessionType: sessionType,
                sessionMode: 'exam',
                companyName: profile.companyName,
                companyUrl: profile.companyUrl
            };
            setSessionContext(initialContext);

            if (sessionType === 'structured') {
                setAppState('CONTEXT_UPLOAD');
            } else {
                setAppState('SESSION_ACTIVE');
            }
        } catch (error) {
            console.error("Failed to save user profile from localStorage", error);
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('mockmate_user_profile');
        } catch (error) {
            console.error("Failed to remove user profile from localStorage", error);
        }
        setUserProfile(null);
        setAppState('LANDING');
        setSessionContext(null);
        setFinalReport(null);
    };


    const handleRoleSubmit = (intent: string, sessionType: 'structured' | 'conversational', companyData?: { name: string, url: string }) => {
        audioService.playConfirm();
        const initialContext: SessionContext = { 
            candidateRole: intent, 
            intentText: intent, 
            selectedPanelIDs: [], 
            sessionType: sessionType,
            sessionMode: 'exam',
            companyName: companyData?.name,
            companyUrl: companyData?.url
        };
        setSessionContext(initialContext);

        if (sessionType === 'structured') {
            setAppState('CONTEXT_UPLOAD');
        } else {
            setAppState('SESSION_ACTIVE');
        }
    };

    const handleContextReady = (context: SessionContext) => {
        audioService.playStart();
        setSessionContext(context);
        setAppState('SESSION_ACTIVE');
    }

    const handleReportGenerated = (report: FinalReport) => {
        audioService.playNotify();
        if (sessionContext) {
            saveSessionToHistory(report, sessionContext.candidateRole, sessionContext.sessionType);
        }
        setFinalReport(report);
        setAppState('REPORT_VIEW');
    };

    const handleRestart = () => {
        audioService.playConfirm();
        setAppState('ROLE_SELECTION');
        setSessionContext(null);
        setFinalReport(null);
    }
    
    const handleGoBack = () => {
        if (appState === 'CONTEXT_UPLOAD') {
            setAppState('ROLE_SELECTION');
            setSessionContext(null);
        }
    };

    const handleCancelSession = () => {
        audioService.playEnd();
        if (appState === 'SESSION_ACTIVE') {
             if (sessionContext?.sessionType === 'structured') {
                setAppState('CONTEXT_UPLOAD');
             } else {
                setAppState('ROLE_SELECTION');
                setSessionContext(null);
             }
        }
    };

    const toggleHistory = () => {
        audioService.playConfirm();
        if (appState === 'HISTORY_VIEW') {
            setAppState('ROLE_SELECTION');
        } else {
            setAppState('HISTORY_VIEW');
        }
    }

    const pageAnimation = {
        initial: { opacity: 0, scale: 0.99, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.01, filter: 'blur(15px)' },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
    };
    
    const headerAnimation = {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as any }
    }


    const renderPageContent = () => {
        switch (appState) {
            case 'LOADING':
                 return null;
            case 'LANDING':
                return <LandingPage onGetStarted={handleGetStarted} />;
            case 'LOGIN':
                return <Login onLoginSuccess={handleLogin} onBack={handleBackToLanding} />;
            case 'ONBOARDING':
                return <OnboardingQuestions onComplete={handleOnboardingComplete} />;
            case 'ROLE_SELECTION':
                return (
                    <motion.div key="role" {...pageAnimation} className="w-full max-w-2xl">
                        <GlassCard>
                            <RoleCapture 
                                userProfile={userProfile} 
                                onRoleSubmit={handleRoleSubmit} 
                                onBack={handleLogout} 
                                onViewHistory={toggleHistory}
                            />
                        </GlassCard>
                    </motion.div>
                );
            case 'HISTORY_VIEW':
                return (
                    <motion.div key="history" {...pageAnimation} className="w-full max-w-5xl">
                        <GrowthDashboard onBack={toggleHistory} />
                    </motion.div>
                );
            case 'CONTEXT_UPLOAD':
                 return (
                    <motion.div key="context" {...pageAnimation} className="w-full max-w-3xl">
                        <GlassCard>
                             <SessionPrep 
                                onContextReady={handleContextReady} 
                                context={sessionContext!} 
                                onGoBack={handleGoBack}
                             />
                        </GlassCard>
                    </motion.div>
                );
            case 'SESSION_ACTIVE':
                return (
                     <motion.div key="session" {...pageAnimation} className="relative w-full h-[92vh] max-h-[900px] lg:max-w-4xl flex flex-col items-center">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-md -z-10 scale-90">
                           {sessionContext && sessionContext.selectedPanelIDs.length > 0 && <InterviewOrbit panelIDs={sessionContext.selectedPanelIDs} />}
                        </div>
                        <div className="w-full h-full flex">
                            <GlassCard className="p-0 flex flex-col w-full overflow-hidden">
                                <MockSession
                                    sessionContext={sessionContext!}
                                    onReportGenerated={handleReportGenerated}
                                    onCancel={handleCancelSession}
                                />
                            </GlassCard>
                        </div>
                    </motion.div>
                );
            case 'REPORT_VIEW':
                return (
                    <motion.div key="report" {...pageAnimation} className="w-full max-w-5xl">
                       {finalReport && <InterviewReport report={finalReport} onRestart={handleRestart} />}
                    </motion.div>
                );
            default:
                return null;
        }
    }

    const showAppHeader = appState !== 'LANDING' && appState !== 'LOGIN' && appState !== 'ONBOARDING' && appState !== 'LOADING';


    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
             {showAppHeader && (
                <motion.header {...headerAnimation} className="absolute top-0 left-0 w-full px-12 py-10 flex justify-between items-center z-20 pointer-events-none">
                    <div onClick={handleRestart} className="cursor-pointer transition-transform hover:scale-[1.02] pointer-events-auto">
                        <Logo className="h-14 w-auto" />
                    </div>
                    <div className="flex items-center gap-8 pointer-events-auto">
                        <button 
                            onClick={toggleHistory}
                            className="text-[11px] font-bold text-text-secondary hover:text-info-blue uppercase tracking-widest transition-colors"
                        >
                            Journal
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-6 py-3 transition-all backdrop-blur-md uppercase tracking-widest"
                        >
                            End Session
                        </button>
                    </div>
                </motion.header>
             )}
             <main className="flex-grow w-full flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
                <AnimatePresence mode="wait">
                    {renderPageContent()}
                </AnimatePresence>
             </main>
        </div>
    );
};

export default App;
