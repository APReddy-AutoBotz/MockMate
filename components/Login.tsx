
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { GoogleIcon, LinkedInIcon, MicrosoftIcon, GitHubIcon } from './icons/SocialIcons';
import { auth, googleProvider } from '../services/firebaseClient';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            onLoginSuccess();
        } catch (err: any) {
            console.error("Auth error:", err);
            setError("Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
        >
            <GlassCard>
                <div className="flex flex-col items-center text-center text-text-primary p-4">
                    <h2 className="text-4xl font-bold mb-3">Get Started</h2>
                    <p className="text-text-secondary mb-8 max-w-sm">Sign in to securely track your growth and generate performance reports.</p>
                    
                    {error && (
                        <div className="mb-4 text-alert-coral text-xs font-bold uppercase tracking-widest bg-alert-coral/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="w-full max-w-xs flex flex-col items-center gap-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <GoogleIcon className="w-6 h-6" />
                            {isLoading ? 'Verifying...' : 'Continue with Google'}
                        </button>
                        
                        <div className="opacity-40 grayscale pointer-events-none w-full flex flex-col gap-4">
                            <button className="w-full flex items-center justify-center gap-3 bg-[#0077B5] text-white font-semibold py-3 px-4 rounded-lg">
                                <LinkedInIcon className="w-6 h-6" />
                                LinkedIn (Soon)
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] text-text-secondary mt-12 opacity-50 max-w-[200px]">
                        By continuing, you start a new session under the MockMate Free Tier usage policy.
                    </p>
                    
                    <button onClick={onBack} className="mt-8 text-xs font-bold text-info-blue uppercase tracking-widest hover:underline">
                        &larr; Back to Landing
                    </button>
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default Login;
