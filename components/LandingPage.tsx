
import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './icons/Logo';
import { RealityIcon, ActionFeedbackIcon, MasteryIcon } from './icons/FeatureIcons';

interface LandingPageProps {
    onGetStarted: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-[#0A192F]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 text-center flex flex-col items-center flex-1 transition-all hover:bg-[#0A192F]/80 group hover:border-white/20 hover:-translate-y-1 duration-500 shadow-2xl">
        <div className="w-16 h-16 rounded-full border border-[#F97316]/40 flex items-center justify-center mb-8 group-hover:border-action-teal/40 transition-colors bg-[#F97316]/10">
            <div className="text-[#F97316]">
                {icon}
            </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
            {title}
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed font-medium opacity-80">
            {description}
        </p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center relative overflow-hidden bg-executive">
            {/* Cinematic Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/80 via-[#0A192F]/40 to-[#0A192F] z-0 pointer-events-none" />
            
            {/* Header / Navbar */}
            <header className="w-full px-8 md:px-16 py-10 flex justify-between items-center z-50">
                <Logo className="h-12 md:h-16 w-auto" />
                <div className="flex gap-4 items-center">
                </div>
            </header>

            <main className="flex-grow w-full flex flex-col items-center justify-center px-6 max-w-7xl mx-auto z-10 pt-10 pb-20">
                {/* Hero Section */}
                <div className="text-center max-w-5xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-center"
                    >
                        <h1 className="text-6xl md:text-[7.5rem] font-black text-white tracking-tighter leading-[0.9]">
                            Don’t just practice
                        </h1>
                        <h1 className="text-6xl md:text-[7.5rem] font-black text-action-teal tracking-tighter leading-[1.1]">
                            Perform
                        </h1>
                    </motion.div>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="text-lg md:text-xl text-text-secondary mt-10 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
                    >
                        Master your next high-stakes conversation with personalized AI coaching designed to build lasting professional confidence.
                    </motion.p>

                    <div className="flex flex-col items-center">
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                            onClick={onGetStarted}
                            className="group relative bg-action-teal hover:bg-opacity-90 text-base-surface font-black py-5 px-14 rounded-xl text-sm uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden"
                        >
                            Start Your Free Session
                        </motion.button>
                        <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="mt-5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]"
                        >
                            No credit card • 5-minute setup
                        </motion.span>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
                    <FeatureCard 
                        icon={<RealityIcon className="w-8 h-8"/>}
                        title="Hyper-Realistic Sessions"
                        description="Tailored interviews from a panel of AI experts, adapting to your every word."
                    />
                    <FeatureCard 
                        icon={<ActionFeedbackIcon className="w-8 h-8"/>}
                        title="Instant, Actionable Feedback"
                        description="Go beyond right or wrong. Get detailed, rubric-based scoring on what to improve."
                    />
                    <FeatureCard 
                        icon={<MasteryIcon className="w-8 h-8"/>}
                        title="Personalized Coaching"
                        description="Receive a custom 'Coach Pack' with micro-drills to sharpen your weakest areas."
                    />
                </div>
            </main>

            <footer className="w-full py-8 text-center z-10">
                <span className="text-text-secondary/40 text-[10px] font-bold uppercase tracking-widest">
                    © 2025 MockMate. All Rights Reserved.
                </span>
            </footer>
        </div>
    );
};

export default LandingPage;
