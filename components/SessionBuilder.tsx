
import { motion } from 'framer-motion';
import { JDInsights, CompetencyWeight } from '../types';
import React from 'react';

interface SessionBuilderProps {
    jdInsights: JDInsights;
    competencyWeights: CompetencyWeight[];
    onAdjustSpecs: () => void;
    onInitialize: () => void;
}

const BAR_COLORS = ['#14C8B0', '#38BDF8', '#FBBF24', '#F86A6A', '#A78BFA'];

const ArenaBlueprint: React.FC<SessionBuilderProps> = ({ jdInsights, competencyWeights, onAdjustSpecs, onInitialize }) => {
    
    // Ensure weightData values are treated as percentages (0-100)
    const weightData = (competencyWeights || []).length > 0 
        ? competencyWeights.map((w, i) => {
            const rawWeight = w.weight;
            // If the weight is a decimal (e.g. 0.25), multiply by 100.
            // If it's already > 1 (e.g. 25), leave it as is.
            const displayPercentage = rawWeight <= 1 ? rawWeight * 100 : rawWeight;
            
            return {
                label: w.competency,
                percentage: displayPercentage,
                color: BAR_COLORS[i % BAR_COLORS.length]
            };
          })
        : [];

    const getSourceMeta = (source: string) => {
        switch (source) {
            case 'realJD': 
                return { label: 'Direct JD Analysis', color: 'text-info-blue', border: 'border-info-blue/20' };
            case 'questionBank': 
                return { label: 'Question Bank Integration', color: 'text-accent-amber', border: 'border-accent-amber/20' };
            case 'attachment': 
                return { label: 'Attached Documentation', color: 'text-action-teal', border: 'border-action-teal/20' };
            default: 
                return { label: 'Industry Standard Baseline', color: 'text-white/40', border: 'border-white/10' };
        }
    };

    const sourceMeta = getSourceMeta(jdInsights.source);

    const CategoryBlock = ({ title, items, colorClass = "text-action-teal" }: { title: string, items: string[], colorClass?: string }) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="space-y-4">
                <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] opacity-40 ${colorClass}`}>{title}</h4>
                <ul className="space-y-2.5">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 group">
                            <span className="text-action-teal/40 group-hover:text-action-teal transition-colors mt-1.5 text-[6px]">●</span>
                            <span className="text-text-secondary text-[14px] font-medium leading-relaxed group-hover:text-white transition-colors">
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto py-12 px-6">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A192F]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-[0_64px_128px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-action-teal via-info-blue to-accent-amber opacity-50" />
                
                <header className="text-center mb-20 flex flex-col items-center">
                    <div className={`mb-6 px-4 py-1.5 border ${sourceMeta.border} rounded-full inline-flex items-center gap-2 bg-white/[0.02]`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${sourceMeta.color} animate-pulse`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${sourceMeta.color}`}>
                            {sourceMeta.label} Verified
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight">Prepare Your Session</h2>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed font-medium opacity-80">
                        We've mapped the core competencies and domain requirements for your session. 
                        The simulation is calibrated to these signals.
                    </p>
                </header>

                {/* Primary Skills Grid (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-16 mb-24">
                    <CategoryBlock title="Must-Have Skills" items={jdInsights.mustHaveSkills} />
                    <CategoryBlock title="Nice-To-Have Skills" items={jdInsights.niceToHave} />
                    <CategoryBlock title="Domains" items={jdInsights.domains} />
                </div>

                {/* Secondary Skills Grid (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16 mb-24">
                    <CategoryBlock title="Tools & Technologies" items={jdInsights.tools} />
                    <CategoryBlock title="Soft Skills" items={jdInsights.softSkills} />
                </div>

                {/* Weighting Section - Fixed Percentage Logic */}
                {weightData.length > 0 && (
                    <div className="space-y-12 mb-24 p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                        <div className="text-center space-y-2">
                            <h3 className="text-accent-amber font-black text-xl uppercase tracking-widest">Competency Priority Distribution</h3>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] opacity-30">Weighted Analysis of Role Pillars</p>
                        </div>
                        <div className="space-y-8 pt-4 max-w-3xl mx-auto">
                            {weightData.map((item, i) => (
                                <div key={i} className="flex items-center gap-6 group">
                                    <div className="w-40 text-right shrink-0">
                                        <span className="text-[11px] font-black text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                                            {item.label}
                                        </span>
                                    </div>
                                    <div className="flex-grow h-2.5 bg-white/5 rounded-full relative overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            transition={{ delay: 0.5 + (i * 0.1), duration: 1.2, ease: "circOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                    </div>
                                    <div className="w-16 shrink-0">
                                        <span className="text-[11px] font-mono font-black text-info-blue">
                                            {Math.round(item.percentage)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-12 border-t border-white/5">
                    <button 
                        onClick={onAdjustSpecs} 
                        className="bg-white/5 text-white/40 font-black py-6 rounded-2xl hover:bg-white/10 hover:text-white transition-all text-xs tracking-[0.25em] uppercase border border-white/5"
                    >
                        Adjust Specs
                    </button>
                    <button 
                        onClick={onInitialize}
                        className="bg-action-teal text-base-surface font-black py-6 rounded-2xl hover:shadow-[0_20px_50px_rgba(20,200,176,0.2)] transition-all text-xs tracking-[0.25em] uppercase"
                    >
                        Initialize Arena
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ArenaBlueprint;
