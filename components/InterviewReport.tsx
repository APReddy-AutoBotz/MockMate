import React, { useState } from 'react';
import { FinalReport, QuestionPerformance } from '../types';
import { generatePdf } from '../services/pdfGenerator';
import { motion } from 'framer-motion';

const sectionAnimation = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
};

const GranularAuditSection: React.FC<{ performance: QuestionPerformance[] }> = ({ performance }) => (
    <div className="space-y-12">
        <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-info-blue uppercase tracking-[0.4em] mb-2 block">Performance Audit</span>
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Turn-by-Turn Assessment</h2>
            <p className="text-xs text-text-secondary opacity-60 italic">We compare your response against an elite-tier model answer for every topic.</p>
        </div>

        <div className="space-y-8">
            {(performance || []).map((q, i) => {
                const isSkipped = q.user_transcript === '[SKIPPED]';
                return (
                    <motion.div 
                        key={i}
                        {...sectionAnimation}
                        className={`bg-white/5 border ${isSkipped ? 'border-alert-coral/20' : 'border-white/10'} rounded-2xl overflow-hidden shadow-2xl`}
                    >
                        <div className="px-8 py-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40 mb-1">Question {i + 1} {q.question_phase && `• ${q.question_phase.toUpperCase()}`}</span>
                                <h4 className="text-sm font-bold text-text-primary leading-snug">{q.question_text}</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-8 border-b lg:border-b-0 lg:border-r border-white/5">
                                <h5 className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-4 opacity-60">Your Answer</h5>
                                <div className={`p-5 rounded-xl border ${isSkipped ? 'bg-alert-coral/[0.03] border-alert-coral/10' : 'bg-white/5 border-white/5'} min-h-[140px]`}>
                                    <p className={`text-sm ${isSkipped ? 'text-alert-coral/60 font-bold italic' : 'text-text-secondary'} leading-relaxed`}>
                                        {isSkipped ? "You opted to skip this question during the session." : `"${q.user_transcript}"`}
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 bg-action-teal/[0.02]">
                                <h5 className="text-[9px] font-black text-action-teal uppercase tracking-widest mb-4">Elite Mastery Response (Model)</h5>
                                <div className="bg-action-teal/10 p-5 rounded-xl border-2 border-action-teal/30 min-h-[140px] shadow-inner">
                                    <p className="text-sm text-text-primary font-bold leading-relaxed italic">
                                        {q.max_impact_response || 'Elite strategy analysis pending.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-base-surface/60 border-t border-white/5">
                            <h5 className={`text-[9px] font-black ${isSkipped ? 'text-alert-coral' : 'text-accent-amber'} uppercase tracking-widest mb-3`}>
                                {isSkipped ? 'Why this topic is critical' : 'Strategic Feedback & Refinement'}
                            </h5>
                            <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                {q.feedback}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    </div>
);

const InterviewReport: React.FC<{ report: FinalReport, onRestart: () => void }> = ({ report, onRestart }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try { await generatePdf(report); } catch (e) { alert("Download failed."); } finally { setIsDownloading(false); }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 md:p-12 space-y-12 pb-24">
            <header className="text-center space-y-4 mb-12">
                <span className="text-[10px] font-black text-action-teal uppercase tracking-[0.5em]">Performance Assessment Dossier</span>
                <h1 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter uppercase">Rehearsal Audit</h1>
                <p className="text-text-secondary max-w-2xl mx-auto text-base md:text-lg leading-relaxed">{report?.overallSummary}</p>
                
                {report.readiness && (
                    <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl max-w-2xl mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-2">
                             <div className={`w-3 h-3 rounded-full ${report.readiness.status === 'INTERVIEW_READY' ? 'bg-action-teal shadow-[0_0_10px_rgba(20,200,176,0.6)]' : report.readiness.status === 'ALMOST_READY' ? 'bg-accent-amber' : 'bg-alert-coral'}`} />
                             <span className="text-xs font-black uppercase tracking-widest text-text-primary">{report.readiness.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm text-text-secondary italic">"{report.readiness.reasoning}"</p>
                    </div>
                )}
            </header>

            {report?.questionPerformance && <GranularAuditSection performance={report.questionPerformance} />}

            {report?.coachPack && (
                <div className="p-10 bg-base-surface/80 backdrop-blur-3xl border border-action-teal/20 rounded-3xl space-y-8 shadow-2xl">
                    <div className="text-center">
                        <span className="text-[10px] font-black text-action-teal uppercase tracking-[0.4em] mb-2 block">Personal Mastery Lab</span>
                        <h3 className="text-3xl font-black text-text-primary uppercase tracking-tighter">{report.coachPack.title}</h3>
                    </div>
                    
                    {report.coachPack.redoNow && report.coachPack.redoNow.question && (
                        <div className="p-6 bg-alert-coral/5 border border-alert-coral/20 rounded-2xl space-y-4">
                            <h4 className="text-[10px] font-black text-alert-coral uppercase tracking-widest">Immediate Redo Required</h4>
                            <p className="text-sm font-bold text-text-primary">Q: {report.coachPack.redoNow.question}</p>
                            <div className="p-4 bg-base-surface rounded-xl border border-white/10">
                                <p className="text-xs text-text-secondary font-medium italic">"{report.coachPack.redoNow.instruction}"</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {report.coachPack.micro_drills.map((drill, di) => (
                            <div key={di} className="p-6 bg-info-blue/5 border border-info-blue/10 rounded-2xl flex flex-col h-full">
                                <div className="mb-4">
                                    <h4 className="text-[10px] font-black text-info-blue uppercase tracking-widest mb-1">Vulnerability</h4>
                                    <p className="text-xs text-text-primary font-bold">{drill.weakness}</p>
                                </div>
                                <div className="mb-4 flex-grow">
                                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-60">HIIT Drill Prompt</h4>
                                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">"{drill.drill_prompt}"</p>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <span className="text-[10px] font-black text-accent-amber uppercase tracking-widest">Focus: </span>
                                    <span className="text-[10px] text-accent-amber font-medium uppercase tracking-tight">{drill.focus_point}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Research & Grounding Sources */}
            {report.jdInsights && report.jdInsights.source === 'questionBank' && (
                <div className="text-center pt-8 opacity-40">
                     <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.5em]">Grounded via MockMate Intelligence Hub</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-16 border-t border-white/5">
                 <button onClick={handleDownload} disabled={isDownloading} className="px-10 py-4 bg-white/5 text-text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-white/10 transition-all border border-white/10">
                    {isDownloading ? 'Exporting...' : 'Download Intelligence PDF'}
                 </button>
                 <button onClick={onRestart} className="px-14 py-4 bg-action-teal text-base-surface text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:opacity-90 transition-all shadow-2xl shadow-action-teal/20">
                    Restart Rehearsal
                 </button>
            </div>
        </div>
    );
};

export default InterviewReport;