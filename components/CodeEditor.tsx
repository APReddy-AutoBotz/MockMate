
import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (code: string) => void;
    isProcessing: boolean;
    feedback?: string | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onSubmit, isProcessing, feedback }) => {
    const [lineCount, setLineCount] = useState(1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const lines = value.split('\n').length;
        setLineCount(Math.max(lines, 1));
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textareaRef.current!.selectionStart;
            const end = textareaRef.current!.selectionEnd;
            const newValue = value.substring(0, start) + "    " + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = start + 4;
            }, 0);
        }
    };

    return (
        <div className="w-full flex flex-col h-full bg-[#011627] rounded-2xl border border-white/10 shadow-2xl overflow-hidden group">
            {/* IDE Header - Redesigned with Submit button at top */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex gap-1.5 items-center">
                    <div className="flex gap-1.5 mr-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-alert-coral/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-action-teal/40" />
                    </div>
                    <span className="text-[10px] font-black text-text-secondary/60 uppercase tracking-widest hidden sm:inline">Main.py — Edited</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { audioService.playConfirm(); onSubmit(value); }}
                        disabled={isProcessing || !value.trim()}
                        className="flex items-center gap-2 bg-action-teal text-base-surface font-black px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-action-teal/20 disabled:opacity-40"
                    >
                        {isProcessing ? 'Analyzing...' : 'Analyze & Submit'}
                    </button>
                    <span className="text-[9px] font-black text-action-teal uppercase tracking-widest bg-action-teal/10 px-2 py-0.5 rounded hidden xs:inline">UTF-8</span>
                </div>
            </div>

            <div className="flex-grow flex overflow-hidden">
                {/* Gutters */}
                <div className="w-10 bg-black/20 flex flex-col items-end pt-4 pr-3 text-[10px] font-mono text-text-secondary/20 select-none border-r border-white/5">
                    {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
                        <div key={i} className="leading-6">{i + 1}</div>
                    ))}
                </div>

                {/* Editor Surface */}
                <div className="relative flex-grow h-full">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="# Enter your technical logic here..."
                        className="absolute inset-0 w-full h-full bg-transparent p-4 text-[12px] font-mono text-info-blue leading-6 focus:outline-none resize-none scrollbar-hide selection:bg-action-teal/30 caret-action-teal"
                        spellCheck="false"
                    />
                </div>
            </div>

            {/* Console / Feedback Output */}
            <div className={`transition-all duration-500 overflow-hidden ${feedback ? 'h-28 border-t border-action-teal/20' : 'h-0'}`}>
                <div className="p-4 h-full bg-black/40 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-black text-action-teal uppercase tracking-widest">Compiler Review</span>
                        <div className="h-px flex-grow bg-action-teal/10" />
                    </div>
                    <p className="text-[11px] font-mono text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {feedback}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
