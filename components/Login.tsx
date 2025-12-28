
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { GoogleIcon } from './icons/SocialIcons';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, isUsingMockAuth, signOut } from '../services/firebaseClient';
import { signInWithPopup } from 'firebase/auth';
import { audioService } from '../services/audioService';

interface LoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{ code: string; message: string } | null>(null);

    // Clear error when user starts correcting inputs
    useEffect(() => {
        if (error) setError(null);
    }, [email, password]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        
        setIsLoading(true);
        setError(null);
        audioService.playConfirm();

        try {
            await (mode === 'signup' 
                ? createUserWithEmailAndPassword(auth, email, password)
                : signInWithEmailAndPassword(auth, email, password)
            );
            onLoginSuccess();
        } catch (err: any) {
            console.error("Auth error:", err.code || err.message);
            const errorCode = err.code || 'unknown';
            let message = "Authentication failed. Please check your credentials.";

            switch (errorCode) {
                case 'auth/email-already-in-use':
                    message = "This email is already registered.";
                    break;
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    message = "Invalid email or password. Please try again.";
                    break;
                case 'auth/weak-password':
                    message = "Password should be at least 6 characters.";
                    break;
                case 'auth/api-key-not-valid':
                case 'auth/invalid-api-key':
                    message = "System Configuration Error. Reverting to Sandbox Mode.";
                    break;
            }
            setError({ code: errorCode, message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAccess = async () => {
        if (!isUsingMockAuth) return;
        setIsLoading(true);
        audioService.playStart();
        try {
            // Attempt to login with guest, if fail, create guest
            const guestEmail = "guest@mockmate.io";
            const guestPass = "sandbox123";
            try {
                await signInWithEmailAndPassword(auth, guestEmail, guestPass);
            } catch (e) {
                await createUserWithEmailAndPassword(auth, guestEmail, guestPass);
            }
            onLoginSuccess();
        } catch (err) {
            setError({ code: 'quick-access-fail', message: "Quick access failed. Please use manual registration." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSandbox = () => {
        localStorage.removeItem('mockmate_mock_users');
        localStorage.removeItem('mockmate_current_user');
        localStorage.removeItem('mockmate_user_profile');
        window.location.reload();
    };

    const handleGoogleLogin = async () => {
        if (isUsingMockAuth) {
            setError({ code: 'mock/google-disabled', message: "Google Login is disabled in Sandbox Mode. Please use Email/Password." });
            return;
        }
        setIsLoading(true);
        setError(null);
        audioService.playStart();
        try {
            await signInWithPopup(auth, googleProvider);
            onLoginSuccess();
        } catch (err: any) {
            setError({ code: 'auth/google-failed', message: "Google sign-in failed. Ensure your Firebase Project has Google Auth enabled." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-lg"
        >
            <GlassCard className="p-10 md:p-14 relative overflow-hidden">
                {isUsingMockAuth && (
                    <div className="absolute top-0 left-0 w-full bg-accent-amber/20 border-b border-accent-amber/30 py-2 px-4 flex items-center justify-between gap-2 z-20">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                            <span className="text-[9px] font-black text-accent-amber uppercase tracking-[0.2em]">Sandbox Mode Active</span>
                        </div>
                        <button 
                            onClick={handleClearSandbox}
                            className="text-[8px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Reset System
                        </button>
                    </div>
                )}

                <div className={`flex flex-col items-center ${isUsingMockAuth ? 'mt-20 md:mt-24' : 'mt-4'}`}>
                    <header className="text-center mb-10">
                        <h2 className="text-4xl font-serif font-bold text-white mb-3">
                            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-text-secondary text-sm font-medium opacity-60">
                            {mode === 'signin' 
                                ? 'Enter your credentials to access your growth journal.' 
                                : 'Join MockMate to start your professional rehearsal journey.'}
                        </p>
                    </header>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="w-full mb-6 p-4 bg-alert-coral/10 border border-alert-coral/20 rounded-xl flex flex-col items-center gap-2"
                            >
                                <p className="text-[10px] font-black text-alert-coral uppercase tracking-widest text-center leading-relaxed">
                                    {error.message}
                                </p>
                                {error.code === 'auth/email-already-in-use' && (
                                    <button 
                                        onClick={() => { setMode('signin'); setError(null); }}
                                        className="text-[9px] font-black text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all uppercase tracking-widest"
                                    >
                                        Click here to Sign In
                                    </button>
                                )}
                                {error.code === 'auth/invalid-credential' && isUsingMockAuth && (
                                    <button 
                                        onClick={() => { setMode('signup'); setError(null); }}
                                        className="text-[9px] font-black text-white/60 hover:text-white transition-all uppercase tracking-widest underline underline-offset-4"
                                    >
                                        New here? Create a sandbox account
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleAuth} className="w-full space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Email Address</label>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-info-blue/40 outline-none transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Password</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-info-blue/40 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-action-teal text-base-surface font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(20,200,176,0.3)] transition-all disabled:opacity-40"
                            >
                                {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Register Now')}
                            </button>

                            {isUsingMockAuth && (
                                <button
                                    type="button"
                                    onClick={handleQuickAccess}
                                    disabled={isLoading}
                                    className="w-full bg-white/5 text-white/40 border border-white/10 font-black py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                                >
                                    Quick Entry (Guest Mode)
                                </button>
                            )}
                        </div>
                    </form>

                    {!isUsingMockAuth && (
                        <>
                            <div className="w-full flex items-center gap-4 my-8">
                                <div className="h-px flex-grow bg-white/5" />
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">or</span>
                                <div className="h-px flex-grow bg-white/5" />
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest disabled:opacity-40"
                            >
                                <GoogleIcon className="w-5 h-5" />
                                Continue with Google
                            </button>
                        </>
                    )}

                    <div className="mt-10 pt-8 border-t border-white/5 w-full text-center">
                        <button 
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                            className="text-[10px] font-black text-info-blue hover:text-white uppercase tracking-widest transition-colors"
                        >
                            {mode === 'signin' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                        </button>
                    </div>

                    <button 
                        onClick={onBack} 
                        className="mt-6 text-[9px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        &larr; Back to Landing
                    </button>
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default Login;
