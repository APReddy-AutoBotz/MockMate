
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
    const [localTranscript, setLocalTranscript] = useState<string>('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
        if (status !== 'idle' && status !== 'error') return;
        
        setError(null);
        setLocalTranscript('');
        
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
            setError("Microphone access required.");
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
                setError("No voice detected.");
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
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative group">
                {/* Waveform Animation Background */}
                <AnimatePresence>
                    {status === 'recording' && (
                        <>
                            <motion.div 
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 rounded-full bg-alert-coral/20"
                            />
                            <motion.div 
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 1.3, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                                className="absolute inset-0 rounded-full bg-alert-coral/10"
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
                        relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500
                        ${status === 'recording' ? 'bg-alert-coral shadow-2xl shadow-alert-coral/40 scale-110' : 
                          status === 'transcribing' ? 'bg-info-blue/20' : 
                          'bg-action-teal hover:scale-105 active:scale-95'}
                        disabled:opacity-50 text-base-surface z-10
                    `}
                >
                    {status === 'transcribing' ? (
                        <div className="animate-spin h-7 w-7 border-4 border-action-teal border-t-transparent rounded-full" />
                    ) : (
                        <MicrophoneIcon className={`w-9 h-9 transition-transform ${status === 'recording' ? 'scale-110 text-white' : 'text-base-surface'}`} />
                    )}
                </button>
            </div>

            <div className="text-center h-5">
                <p className={`text-[11px] font-bold tracking-tight transition-all duration-300 ${status === 'recording' ? 'text-alert-coral' : 'text-text-secondary/80'}`}>
                    {status === 'idle' && "Hold to speak"}
                    {status === 'recording' && "Capturing voice..."}
                    {status === 'transcribing' && "Analyzing response..."}
                    {status === 'error' && (error || "Recording failed")}
                </p>
            </div>
        </div>
    );
};

export default PushToTalkInput;
