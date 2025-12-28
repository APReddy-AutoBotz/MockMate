
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';

interface OnboardingQuestionsProps {
    onComplete: (profile: UserProfile, targetRole: string, sessionType: 'structured' | 'conversational') => void;
}

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';

const experienceOptions: { id: ExperienceLevel; label: string }[] = [
    { id: 'entry', label: 'Entry-Level' },
    { id: 'mid', label: 'Mid-Career' },
    { id: 'senior', label: 'Senior / Staff' },
    { id: 'lead', label: 'Lead / Executive' },
];

const OnboardingQuestions: React.FC<OnboardingQuestionsProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [experience, setExperience] = useState<ExperienceLevel | null>(null);
    const [targetRole, setTargetRole] = useState('');

    const handleNext = () => setStep(s => s + 1);

    const handleFinalSelection = (sessionType: 'structured' | 'conversational') => {
        const profile: UserProfile = {
            name: 'Candidate', // Default placeholder to keep flow minimal
            experienceLevel: experience || 'mid',
            primaryGoal: 'specific_interview'
        };
        onComplete(profile, targetRole, sessionType);
    };

    const stepVariants = {
        initial: { opacity: 0, y: 15, filter: 'blur(10px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -15, filter: 'blur(15px)' },
    };

    const ProgressBar = () => (
        <div className="w-full flex justify-center mb-20">
            <div className="flex gap-6">
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className={`h-0.5 rounded-full transition-all duration-700 ease-out ${step >= i ? 'w-16 bg-action-teal shadow-[0_0_10px_rgba(20,200,176,0.3)]' : 'w-4 bg-white/5'}`} 
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto px-6">
            <ProgressBar />
            
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" {...stepVariants} className="text-center">
                        <header className="mb-16">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Your current standing</h2>
                            <p className="text-text-secondary text-base font-medium opacity-60">Select your professional level to calibrate the session intensity.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {experienceOptions.map(opt => (
                                <button 
                                    key={opt.id} 
                                    onClick={() => { setExperience(opt.id); handleNext(); }}
                                    className="text-center p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-2xl hover:border-action-teal/40 hover:bg-white/[0.05] transition-all group"
                                >
                                    <h3 className="font-bold text-white text-lg group-hover:text-action-teal transition-colors tracking-tight">{opt.label}</h3>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" {...stepVariants} className="text-center">
                        <header className="mb-16">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Set your intention</h2>
                            <p className="text-text-secondary text-base font-medium opacity-60">What role are we preparing for today?</p>
                        </header>
                        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col items-center gap-10 w-full">
                            <textarea 
                                placeholder="e.g. Senior Product Designer"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-10 text-3xl text-center text-white placeholder:text-white/5 focus:border-action-teal/40 outline-none transition-all h-40 resize-none shadow-2xl leading-tight font-sans font-bold"
                                autoFocus
                                required
                            />
                            
                            <button 
                                type="submit"
                                className="bg-action-teal text-base-surface font-black py-5 px-16 rounded-xl hover:shadow-[0_20px_40px_rgba(20,200,176,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-20 text-[11px] uppercase tracking-[0.2em]"
                                disabled={!targetRole.trim()}
                            >
                                Continue
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" {...stepVariants} className="text-center">
                        <header className="mb-16">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Choose your protocol</h2>
                            <p className="text-text-secondary text-base font-medium opacity-60">How would you like to engage with the AI panel?</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <button 
                                onClick={() => handleFinalSelection('structured')}
                                className="p-10 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] hover:border-info-blue/40 hover:bg-white/[0.05] text-left transition-all group h-full flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black text-info-blue uppercase tracking-widest border border-info-blue/20 w-fit px-3 py-1 rounded">Protocol Alpha</div>
                                    <h3 className="text-xl font-bold text-white font-sans">Structured Blueprint</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium opacity-60">A methodical approach with a predefined roadmap. Best for precision practice.</p>
                                </div>
                                <span className="mt-8 text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-info-blue transition-colors">Select &rarr;</span>
                            </button>
                            <button 
                                onClick={() => handleFinalSelection('conversational')}
                                className="p-10 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] hover:border-action-teal/40 hover:bg-white/[0.05] text-left transition-all group h-full flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black text-action-teal uppercase tracking-widest border border-action-teal/20 w-fit px-3 py-1 rounded">Protocol Beta</div>
                                    <h3 className="text-xl font-bold text-white font-sans">Dynamic Arena</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium opacity-60">An unscripted, adaptive environment that evolves with your responses.</p>
                                </div>
                                <span className="mt-8 text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-action-teal transition-colors">Select &rarr;</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnboardingQuestions;
