
import React, { useState } from 'react';
import { FinalReport, QuestionPerformance, AdvisorAssessment } from '../types';
import { generatePdf } from '../services/pdfGenerator';
import { motion } from 'framer-motion';
import { PERSONAS_CONFIG } from '../personas.config';

const sectionAnimation = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
};

const PersonaScoreCard: React.FC<{ advisory: AdvisorAssessment[] }> = ({ advisory }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advisory.map((adv, i) => {
            const personaDetails = PERSONAS_CONFIG.find(p => p.name === adv.persona.split('—')[0].trim());
            const Icon = personaDetails?.icon;
            
            return (
                <motion.div 
                    key={i} 
                    {...sectionAnimation} 
                    className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col gap-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {Icon && (
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-white opacity-80" />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{adv.persona}</span>
                                <span className="text-[10px] font-black uppercase text-text-secondary opacity-40">Advisory Verdict</span>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-action-teal">{adv.scores?.[0]?.score || (adv as any).score || '-'}<span className="text-[10px] text-white/20">/5</span></div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed italic opacity-80">"{adv.summary}"</p>
                </motion.div>
            );
        })}
    </div>
);

const GranularAuditSection: React.FC<{ performance: QuestionPerformance[] }> = ({ performance }) => (
    <div className="space-y-12">
        <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-info-blue uppercase tracking-[0.4em] mb-2 block">Performance Audit</span>
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Turn-by-Turn Assessment</h2>
            <p className="text-xs text-text-secondary opacity-60 italic">Deep analysis of response efficacy and structural gaps.</p>
        </div>

        <div className="space-y-12">
            {(performance || []).map((q, i) => {
                const isSkipped = q.user_transcript === '[SKIPPED]';
                return (
                    <motion.div 
                        key={i}
                        {...sectionAnimation}
                        className={`bg-white/5 border ${isSkipped ? 'border-alert-coral/20' : 'border-white/10'} rounded-[2.5rem] overflow-hidden shadow-2xl`}
                    >
                        <div className="px-10 py-8 bg-white/5 border-b border-white/5">
                            <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40 mb-2 block">Question {i + 1}</span>
                            <h4 className="text-lg font-bold text-white leading-tight">"{q.question_text}"</h4>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-10 border-b lg:border-b-0 lg:border-r border-white/5">
                                <h5 className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-4 opacity-60">Candidate Delivery {isSkipped ? "(Skipped)" : ""}</h5>
                                <div className={`p-6 rounded-2xl border ${isSkipped ? 'bg-alert-coral/[0.03] border-alert-coral/10' : 'bg-white/5 border-white/5'} min-h-[140px]`}>
                                    <p className={`text-sm ${isSkipped ? 'text-alert-coral/60 font-bold italic' : 'text-text-primary'} leading-relaxed`}>
                                        {isSkipped ? "You opted to skip this question during the session." : `"${q.user_transcript}"`}
                                    </p>
                                </div>
                            </div>

                            <div className="p-10 bg-action-teal/[0.01]">
                                <h5 className="text-[9px] font-black text-action-teal uppercase tracking-widest mb-4">Elite Mastery Response</h5>
                                <div className="bg-action-teal/5 p-6 rounded-2xl border border-action-teal/20 min-h-[140px]">
                                    <p className="text-sm text-text-primary font-medium leading-relaxed italic">
                                        {q.max_impact_response || 'Elite strategy analysis pending.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 bg-black/20 border-t border-white/5">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h5 className={`text-[9px] font-black ${isSkipped ? 'text-alert-coral' : 'text-accent-amber'} uppercase tracking-widest mb-3`}>
                                        Critical Intelligence
                                    </h5>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium">
                                        {q.feedback}
                                    </p>
                                </div>
                            </div>
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

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'INTERVIEW_READY': return 'text-action-teal border-action-teal/30 bg-action-teal/10';
            case 'ALMOST_READY': return 'text-accent-amber border-accent-amber/30 bg-accent-amber/10';
            case 'NOT_READY': return 'text-alert-coral border-alert-coral/30 bg-alert-coral/10';
            default: return 'text-white/40 border-white/10 bg-white/5';
        }
    };

    const statusClasses = getStatusColor(report.readiness?.status);

    return (
        <div className="w-full max-w-5xl mx-auto p-6 md:p-12 space-y-20 pb-24">
            {/* Header / Summary */}
            <header className="text-center space-y-6">
                <span className="text-[10px] font-black text-action-teal uppercase tracking-[0.5em] mb-4 block">Performance Assessment Dossier</span>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">Rehearsal Audit</h1>
                <p className="text-text-secondary max-w-3xl mx-auto text-lg md:text-xl leading-relaxed font-medium opacity-80">{report?.overallSummary || "Analyzing performance..."}</p>
                
                {report?.readiness && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="mt-16 p-1 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-[3rem] max-w-2xl mx-auto overflow-hidden shadow-2xl"
                    >
                        <div className="bg-[#0A192F]/90 backdrop-blur-3xl rounded-[2.9rem] p-10 flex flex-col items-center">
                            <div className="mb-6 flex flex-col items-center gap-2">
                                <span className="text-[11px] font-black text-info-blue uppercase tracking-[0.4em] mb-4 opacity-40">System Signal</span>
                                <div className={`px-8 py-3 border-2 rounded-full flex items-center gap-4 ${statusClasses} transition-all`}>
                                    <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} />
                                    <span className="text-sm font-black uppercase tracking-[0.3em]">
                                        {(report.readiness.status || "CALIBRATING").replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-lg text-white font-medium leading-relaxed max-w-md mx-auto mb-6 italic opacity-90">
                                "{report.readiness.reasoning || "Analyzing session data points across consistency and role alignment..."}"
                            </p>

                            <div className="pt-6 border-t border-white/5 w-full">
                                <span className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] opacity-30">
                                    Authoritative Verdict: This assessment reflects current readiness for real interviews.
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </header>

            {/* Persona Advisory Scores */}
            {report?.advisoryPanel && report.advisoryPanel.length > 0 && (
                <section className="space-y-8">
                    <div className="text-center">
                        <span className="text-[10px] font-black text-info-blue uppercase tracking-[0.4em] mb-2 block">The Advisory Board</span>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Panel Verdicts</h3>
                    </div>
                    <PersonaScoreCard advisory={report.advisoryPanel} />
                </section>
            )}

            {/* Premium Risk Callout */}
            {report?.biggestRiskArea && (
                <motion.section 
                    {...sectionAnimation}
                    className="relative overflow-hidden bg-alert-coral/5 border border-alert-coral/30 rounded-[3rem] p-10 md:p-14"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-alert-coral/10 blur-[100px] -z-10" />
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        <div className="bg-alert-coral text-base-surface px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">Priority Risk Detected</div>
                        <div className="space-y-6">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{report.biggestRiskArea.title}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-black text-alert-coral uppercase tracking-widest opacity-60">Observation</h4>
                                    <p className="text-sm text-text-secondary font-medium leading-relaxed">{report.biggestRiskArea.observation}</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-black text-alert-coral uppercase tracking-widest opacity-60">Strategic Mitigation</h4>
                                    <p className="text-sm text-text-secondary font-medium leading-relaxed">{report.biggestRiskArea.mitigation}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {report?.questionPerformance && <GranularAuditSection performance={report.questionPerformance} />}

            {/* Mastery Lab / Coach Pack - Phase 6 Active Learning */}
            {report?.coachPack && (
                <section className="p-12 bg-base-surface/80 backdrop-blur-3xl border border-action-teal/20 rounded-[3rem] space-y-16 shadow-[0_64px_128px_rgba(0,0,0,0.6)]">
                    <div className="text-center">
                        <span className="text-[10px] font-black text-action-teal uppercase tracking-[0.4em] mb-2 block">Active Learning Protocol</span>
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{report.coachPack.title || "Targeted Mastery Lab"}</h3>
                        <p className="text-text-secondary mt-4 text-xs font-medium opacity-60">These drills are designed for immediate verbal re-practice. Spend 30–60 seconds on each.</p>
                    </div>
                    
                    {report.coachPack.redoNow && report.coachPack.redoNow.question && (
                        <motion.div 
                            {...sectionAnimation}
                            className="p-10 bg-alert-coral/5 border border-alert-coral/30 rounded-[2.5rem] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-alert-coral/5 -skew-x-12 translate-x-1/2" />
                            <div className="relative space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-alert-coral animate-ping" />
                                    <h4 className="text-[10px] font-black text-alert-coral uppercase tracking-widest">Immediate Pivot Directive</h4>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">High Stakes Question</span>
                                    <p className="text-2xl font-bold text-white leading-tight italic">"{report.coachPack.redoNow.question}"</p>
                                </div>
                                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                                    <h5 className="text-[9px] font-black text-action-teal uppercase tracking-widest">Re-Practice Instruction</h5>
                                    <p className="text-sm text-text-secondary font-medium leading-relaxed">
                                        {report.coachPack.redoNow.instruction}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {(report.coachPack.micro_drills || []).slice(0, 3).map((drill, di) => (
                            <motion.div 
                                key={di} 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: di * 0.1 }}
                                className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex flex-col group hover:bg-white/[0.06] transition-all"
                            >
                                <div className="mb-8 flex justify-between items-start">
                                    <div className="px-3 py-1 bg-info-blue/10 border border-info-blue/20 rounded text-[9px] font-black text-info-blue uppercase tracking-widest">Active Prompt</div>
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">45s Drill</span>
                                </div>
                                
                                <div className="mb-8 space-y-2">
                                    <h4 className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40">Identified Friction</h4>
                                    <p className="text-base font-bold text-white group-hover:text-info-blue transition-colors">{drill.weakness}</p>
                                </div>
                                
                                <div className="flex-grow space-y-4">
                                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                                        <p className="text-xs text-text-secondary leading-relaxed font-medium italic">"{drill.drill_prompt}"</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5">
                                    <span className="text-[9px] font-black text-accent-amber uppercase tracking-widest block mb-2">Success Metric</span>
                                    <span className="text-[11px] text-accent-amber font-bold uppercase tracking-widest">{drill.focus_point}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-12">
                 <button onClick={handleDownload} disabled={isDownloading} className="px-12 py-5 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-xl">
                    {isDownloading ? 'Synthesizing...' : 'Export Intelligence Dossier'}
                 </button>
                 <button onClick={onRestart} className="px-16 py-5 bg-action-teal text-base-surface text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:opacity-90 transition-all shadow-2xl shadow-action-teal/20">
                    Initialize New Arena
                 </button>
            </div>
        </div>
    );
};

export default InterviewReport;
