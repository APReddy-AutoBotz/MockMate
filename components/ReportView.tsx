
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface RoleCaptureProps {
    userProfile: UserProfile | null;
    onRoleSubmit: (role: string, sessionType: 'structured' | 'conversational') => void;
    onBack: () => void;
    onViewHistory: () => void;
}

const RoleCapture: React.FC<RoleCaptureProps> = ({ userProfile, onRoleSubmit, onBack, onViewHistory }) => {
    const [intentText, setIntentText] = useState('');

    const handleSubmit = (sessionType: 'structured' | 'conversational') => {
        const trimmedIntent = intentText.trim();
        if (trimmedIntent) {
            onRoleSubmit(trimmedIntent, sessionType);
        }
    };

    const welcomeMessage = userProfile ? `Welcome back, ${userProfile.name}!` : 'Welcome to MockMate';

    return (
        <div className="relative flex flex-col items-center text-center text-text-primary p-4">
            <div className="absolute top-4 right-4 flex gap-4">
                <button 
                    onClick={onViewHistory} 
                    className="text-[10px] font-black text-info-blue bg-info-blue/10 border border-info-blue/20 rounded-full px-4 py-2 hover:bg-info-blue/20 transition-all uppercase tracking-widest"
                >
                    View Progress
                </button>
                <button 
                    onClick={onBack} 
                    className="text-[10px] font-black text-text-secondary bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-all uppercase tracking-widest"
                    aria-label="Logout"
                >
                    Logout
                </button>
            </div>
            
            <h2 className="text-4xl font-bold mb-3 mt-8">{welcomeMessage}</h2>
            <p className="text-text-secondary mb-8 max-w-md">Describe the interview you're preparing for. Our AI will craft a hyper-realistic session from your goal.</p>
            
            <div className="w-full max-w-md flex flex-col items-center">
                <textarea
                    value={intentText}
                    onChange={(e) => setIntentText(e.target.value)}
                    placeholder="e.g., 'Staff Nurse for a pediatric ward' or 'Senior Software Engineer at a fintech startup'"
                    className="w-full h-32 bg-base-surface/80 border-2 border-info-blue/30 rounded-lg py-4 px-5 text-text-primary focus:outline-none focus:ring-2 focus:ring-action-teal text-lg transition-colors focus:border-action-teal resize-none"
                    aria-label="Your interview goal"
                    autoFocus
                />
                
                <p className="text-text-secondary mt-8 mb-4 font-semibold">Choose your preparation style:</p>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleSubmit('structured')}
                        disabled={!intentText.trim()}
                        className="w-full bg-info-blue/20 text-text-primary p-4 rounded-lg hover:bg-info-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-info-blue/30"
                    >
                        <h3 className="font-bold text-lg">Structured Session</h3>
                        <p className="text-sm text-text-secondary">Generate a full interview plan upfront. Best for targeted practice.</p>
                    </button>
                     <button
                        onClick={() => handleSubmit('conversational')}
                        disabled={!intentText.trim()}
                        className="w-full bg-action-teal/20 text-text-primary p-4 rounded-lg hover:bg-action-teal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-action-teal/30"
                    >
                        <h3 className="font-bold text-lg">Conversational Flow</h3>
                        <p className="text-sm text-text-secondary">A dynamic, unscripted interview. Best for practicing adaptability.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleCapture;
