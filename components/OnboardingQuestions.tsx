
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';

interface OnboardingQuestionsProps {
    onComplete: (profile: UserProfile, targetRole: string, sessionType: 'structured' | 'conversational') => void;
}

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';

const experienceOptions: { id: ExperienceLevel; label: string; description: string }[] = [
    { id: 'entry', label: 'Entry-Level', description: 'Early career or career pivot.' },
    { id: 'mid', label: 'Mid-Career', description: 'Established professional experience.' },
    { id: 'senior', label: 'Senior / Staff', description: 'Deep specialized expertise.' },
    { id: 'lead', label: 'Lead / Executive', description: 'Strategic leadership and management.' },
];

const OnboardingQuestions: React.FC<OnboardingQuestionsProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [experience, setExperience] = useState<ExperienceLevel | null>(null);
    const [targetRole, setTargetRole] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyUrl, setCompanyUrl] = useState('');

    const handleNext = () => setStep(s => s + 1);

    const handleFinalSelection = (sessionType: 'structured' | 'conversational') => {
        const profile: UserProfile = {
            name: name || 'Candidate',
            experienceLevel: experience || 'mid',
            primaryGoal: 'specific_interview',
            companyName,
            companyUrl
        };
        onComplete(profile, targetRole, sessionType);
    };

    const stepVariants = {
        initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.02, filter: 'blur(8px)' },
    };

    const ProgressBar = () => (
        <div className="w-full flex justify-center mb-16">
            <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-1000 ease-in-out ${step >= i ? 'w-12 bg-action-teal shadow-[0_0_15px_rgba(20,200,176,0.5)]' : 'w-3 bg-white/10'}`} 
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-3xl mx-auto px-6">
            <ProgressBar />
            
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" {...stepVariants} className="text-center">
                        <h2 className="text-5xl font-serif font-bold text-white mb-4 tracking-tight">Identity Calibration</h2>
                        <p className="text-text-secondary mb-12 font-medium">How should we address you in the rehearsal environment?</p>
                        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col items-center">
                            <input 
                                type="text"
                                placeholder="Candidate Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl py-6 px-8 text-3xl text-center text-white placeholder:text-white/10 focus:border-action-teal/40 outline-none transition-all shadow-2xl font-sans"
                                autoFocus
                                required
                            />
                            <button 
                                type="submit"
                                className="mt-12 bg-action-teal text-base-surface font-bold py-5 px-16 rounded-full hover:shadow-[0_0_40px_rgba(20,200,176,0.3)] hover:-translate-y-1 transition-all disabled:opacity-20 label-mono"
                                disabled={!name.trim()}
                            >
                                Synchronize
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" {...stepVariants}>
                        <div className="text-center mb-12">
                            <h2 className="text-5xl font-serif font-bold text-white mb-4 tracking-tight">Experience Tier</h2>
                            <p className="text-text-secondary font-medium">Select your professional standing to calibrate session difficulty.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {experienceOptions.map(opt => (
                                <button 
                                    key={opt.id} 
                                    onClick={() => { setExperience(opt.id); handleNext(); }}
                                    className="text-left p-10 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2rem] hover:border-action-teal/30 hover:bg-white/[0.05] transition-all group relative overflow-hidden"
                                >
                                    <h3 className="font-bold text-white text-xl mb-2 group-hover:text-action-teal transition-colors font-sans">{opt.label}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium opacity-70">{opt.description}</p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" {...stepVariants} className="text-center">
                        <h2 className="text-5xl font-serif font-bold text-white mb-4 tracking-tight">Target Role & Company</h2>
                        <p className="text-text-secondary mb-12 font-medium">Define the objective for precise environment grounding.</p>
                        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col items-center gap-6 w-full">
                            <textarea 
                                placeholder="e.g. Senior RPA Business Analyst"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full max-w-xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 text-3xl text-center text-white placeholder:text-white/10 focus:border-action-teal/40 outline-none transition-all h-48 resize-none shadow-2xl leading-tight font-sans"
                                autoFocus
                                required
                            />
                            
                            <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Company Name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-5 text-lg text-white placeholder:text-white/20 focus:border-action-teal/40 outline-none transition-all font-sans"
                                    />
                                    <span className="absolute -top-3 left-6 px-2 bg-[#0A192F] text-[9px] label-mono text-white/30 opacity-0 group-focus-within:opacity-100 transition-opacity">Grounding Target</span>
                                </div>
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Company URL (Optional)"
                                        value={companyUrl}
                                        onChange={(e) => setCompanyUrl(e.target.value)}
                                        className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-5 text-lg text-white placeholder:text-white/20 focus:border-action-teal/40 outline-none transition-all font-sans"
                                    />
                                    <span className="absolute -top-3 left-6 px-2 bg-[#0A192F] text-[9px] label-mono text-white/30 opacity-0 group-focus-within:opacity-100 transition-opacity">Intelligence Source</span>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="mt-8 bg-action-teal text-base-surface font-bold py-6 px-20 rounded-full hover:shadow-[0_0_50px_rgba(20,200,176,0.4)] hover:-translate-y-1 transition-all disabled:opacity-20 label-mono text-xs"
                                disabled={!targetRole.trim()}
                            >
                                Confirm Strategic Targets
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div key="step4" {...stepVariants}>
                        <div className="text-center mb-12">
                            <h2 className="text-5xl font-serif font-bold text-white mb-4 tracking-tight">Engagement Protocol</h2>
                            <p className="text-text-secondary font-medium">Select the interface protocol for this session.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <button 
                                onClick={() => handleFinalSelection('structured')}
                                className="p-12 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[3rem] hover:border-info-blue/40 hover:bg-white/[0.05] text-left transition-all group"
                            >
                                <div className="text-[10px] label-mono text-info-blue mb-6 border border-info-blue/20 w-fit px-3 py-1 rounded">Protocol Alpha</div>
                                <h3 className="text-2xl font-bold text-white mb-4 font-sans">Structured Blueprint</h3>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium opacity-70">A methodology-driven rehearsal based on a predefined strategic plan.</p>
                            </button>
                            <button 
                                onClick={() => handleFinalSelection('conversational')}
                                className="p-12 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[3rem] hover:border-action-teal/40 hover:bg-white/[0.05] text-left transition-all group"
                            >
                                <div className="text-[10px] label-mono text-action-teal mb-6 border border-action-teal/20 w-fit px-3 py-1 rounded">Protocol Beta</div>
                                <h3 className="text-2xl font-bold text-white mb-4 font-sans">The Dynamic Arena</h3>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium opacity-70">A reactive, high-stakes environment that evolves in real-time based on your input.</p>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnboardingQuestions;
