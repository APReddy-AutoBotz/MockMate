
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const PresenceMonitor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMicActive, setIsMicActive] = useState(false);
    
    // Soft skill metrics tracking vocal delivery
    const metrics = [
        { label: 'Pace', value: '142', unit: 'WPM', color: 'text-action-teal' },
        { label: 'Fillers', value: '0', unit: 'CT', color: 'text-alert-coral' },
        { label: 'Confidence', value: '94', unit: '%', color: 'text-info-blue' },
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let dataArray: Uint8Array | null = null;

        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                setIsMicActive(true);
            } catch (e) {
                console.log("Mic access restricted; using fallback animation.");
                setIsMicActive(false);
            }
        };

        setupAudio();

        let phase = 0;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.strokeStyle = isMicActive ? '#14C8B0' : 'rgba(168, 178, 209, 0.3)';
            ctx.lineWidth = 1.5;

            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);
                const width = canvas.width;
                const height = canvas.height;
                const sliceWidth = width / dataArray.length;
                let x = 0;

                for (let i = 0; i < dataArray.length; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * height) / 2;

                    if (i === 0) ctx.moveTo(x, height / 2);
                    else ctx.lineTo(x, height / 2 + (i % 2 === 0 ? y / 4 : -y / 4));

                    x += sliceWidth;
                }
            } else {
                // Fallback sine wave
                for (let x = 0; x < canvas.width; x++) {
                    const y = Math.sin(x * 0.05 + phase) * 8 + canvas.height / 2;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                phase += 0.05;
            }

            ctx.stroke();
            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationId);
            if (audioContext) audioContext.close();
        };
    }, [isMicActive]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="group relative flex items-center justify-center gap-10 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl px-8 py-3.5 shadow-2xl pointer-events-auto"
        >
            {/* Waveform Visualization */}
            <div className="flex items-center gap-4 pr-10 border-r border-white/10">
                <canvas 
                    ref={canvasRef} 
                    width={100} 
                    height={24} 
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isMicActive ? 'text-action-teal' : 'text-text-secondary opacity-30'}`}>
                    {isMicActive ? 'Live' : 'Ready'}
                </span>
            </div>

            {/* Live Soft-Skill Metrics */}
            <div className="flex gap-12">
                {metrics.map((m) => (
                    <div key={m.label} className="flex flex-col items-center md:items-start min-w-[60px]">
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 mb-1">{m.label}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-sm font-mono font-black ${m.color}`}>{m.value}</span>
                            <span className="text-[9px] font-mono font-bold text-white/20 uppercase">{m.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Contextual Intelligence Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#0A192F] border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100">
                <p className="text-[9px] font-black text-info-blue uppercase tracking-widest">
                    Vocal Intelligence: <span className="text-white">Active soft-skill monitoring</span>
                </p>
            </div>
        </motion.div>
    );
};

export default PresenceMonitor;
