
import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import * as mockGeminiService from '../services/mockGeminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface PushToTalkInputProps {
    onTranscriptSubmit: (transcript: string) => void;
    disabled?: boolean;
}

type Status = 'idle' | 'recording' | 'transcribing' | 'reviewing' | 'error';

const PushToTalkInput: React.FC<PushToTalkInputProps> = ({ onTranscriptSubmit, disabled }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
        if (status !== 'idle' && status !== 'error') return;
        
        setError(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                processTranscription(blob);
            };
            
            mediaRecorder.start();
            setStatus('recording');
        } catch (err) {
            setError("Microphone Authorization Required.");
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const processTranscription = async (blob: Blob) => {
        setStatus('transcribing');
        try {
            const transcript = await mockGeminiService.transcribeAudio(blob);
            if (transcript.trim()) {
                onTranscriptSubmit(transcript);
                setStatus('idle');
            } else {
                setError("No Signal Detected.");
                setStatus('error');
                setTimeout(() => setStatus('idle'), 2000);
            }
        } catch (e) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };
    
    const stopRecording = () => {
        if (status !== 'recording' || !mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        streamRef.current?.getTracks().forEach(track => track.stop());
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative group">
                <AnimatePresence>
                    {status === 'recording' && (
                        <>
                            <motion.div 
                                initial={{ scale: 1, opacity: 0.4 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                className="absolute inset-0 rounded-full bg-info-blue/20"
                            />
                            <motion.div 
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.4 }}
                                className="absolute inset-0 rounded-full bg-info-blue/10"
                            />
                        </>
                    )}
                </AnimatePresence>

                <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                    onTouchEnd={stopRecording}
                    disabled={disabled || status === 'transcribing'}
                    className={`
                        relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700
                        ${status === 'recording' ? 'bg-info-blue shadow-[0_0_50px_rgba(56,189,248,0.4)] scale-110' : 
                          status === 'transcribing' ? 'bg-white/[0.05] border border-white/10' : 
                          'bg-white/[0.02] border border-white/10 hover:border-info-blue/40 hover:bg-info-blue/5 hover:scale-105 active:scale-95'}
                        disabled:opacity-50 text-white z-10 backdrop-blur-3xl
                    `}
                >
                    {status === 'transcribing' ? (
                        <div className="animate-spin h-8 w-8 border-[3px] border-info-blue border-t-transparent rounded-full" />
                    ) : (
                        <MicrophoneIcon className={`w-10 h-10 transition-all duration-500 ${status === 'recording' ? 'scale-110 text-base-surface' : 'text-info-blue opacity-80'}`} />
                    )}
                </button>
            </div>

            <div className="text-center h-6">
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${status === 'recording' ? 'text-info-blue' : 'text-text-secondary opacity-30'}`}>
                    {status === 'idle' && "Hold To Speak"}
                    {status === 'recording' && "Capturing Presence"}
                    {status === 'transcribing' && "Syncing Voice Data"}
                    {status === 'error' && (error || "Link Failure")}
                </p>
            </div>
        </div>
    );
};

export default PushToTalkInput;
