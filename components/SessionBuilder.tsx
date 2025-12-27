
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JDInsights, CompetencyWeight } from '../types';

interface SessionBuilderProps {
    jdInsights: JDInsights;
    competencyWeights: CompetencyWeight[];
    onAdjustSpecs: () => void;
    onInitialize: () => void;
    researchLinks?: { uri: string; title: string; }[];
}

const BAR_COLORS = [
    '#14C8B0', // Teal
    '#38BDF8', // Blue
    '#FBBF24', // Yellow
    '#F86A6A', // Red
    '#A78BFA'  // Purple
];

const ArenaBlueprint: React.FC<SessionBuilderProps> = ({ jdInsights, competencyWeights, onAdjustSpecs, onInitialize, researchLinks }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!jdInsights || !competencyWeights) return null;

    const data = competencyWeights.map((w, i) => ({
        label: w.competency,
        percentage: w.weight * 100,
        color: BAR_COLORS[i % BAR_COLORS.length]
    }));

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'realJD': return 'Job Description';
            case 'genericProfile': return 'Role Profile';
            case 'questionBank': return 'MockMate Intelligence';
            default: return 'Defined Goal';
        }
    };

    const SkillList = ({ title, items }: { title: string, items: string[] }) => (
        <div className="space-y-5">
            <h4 className="text-white font-bold text-sm tracking-tight">{title}</h4>
            <ul className="space-y-2.5">
                {(items || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 group">
                        <span className="text-white/20 group-hover:text-action-teal transition-colors mt-1.5 text-xs">•</span>
                        <span className="text-text-secondary text-[13px] leading-snug group-hover:text-text-primary transition-colors">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A192F]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 md:p-16 shadow-[0_64px_128px_rgba(0,0,0,0.6)] flex flex-col"
            >
                {/* Header Section */}
                <header className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight font-serif">Prepare Your Session</h2>
                    <p className="text-text-secondary text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
                        We've selected a recommended panel for you. Upload a JD or a Question Bank for a tailored plan.
                    </p>
                </header>

                {/* Section Title */}
                <div className="space-y-2 mb-12 border-l-2 border-action-teal/30 pl-6">
                    <h3 className="text-action-teal font-bold text-2xl tracking-tight">Your Interview Blueprint</h3>
                    <p className="text-text-secondary text-sm font-medium">
                        We've analyzed your goal and generated a tailored interview plan. The source is a <span className="text-white font-bold">{getSourceLabel(jdInsights.source)}</span>.
                    </p>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    <SkillList title="Must-Have Skills" items={jdInsights.mustHaveSkills} />
                    <SkillList title="Nice-to-Have Skills" items={jdInsights.niceToHave} />
                    <SkillList title="Domains" items={jdInsights.domains} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <SkillList title="Tools & Technologies" items={jdInsights.tools} />
                    <SkillList title="Soft Skills" items={jdInsights.softSkills} />
                </div>

                {/* Search Grounding Sources Displayed to comply with Gemini API policy */}
                {researchLinks && researchLinks.length > 0 && (
                    <div className="mb-12 p-6 bg-white/[0.03] border border-info-blue/20 rounded-2xl">
                        <h4 className="text-[10px] font-black text-info-blue uppercase tracking-widest mb-4">Research & Intelligence Sources</h4>
                        <div className="flex flex-wrap gap-4">
                            {researchLinks.map((link, idx) => (
                                <a 
                                    key={idx} 
                                    href={link.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-text-primary hover:text-action-teal transition-colors flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
                                >
                                    <span className="opacity-40">#{idx + 1}</span> {link.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Competency Weights Section */}
                <div className="space-y-8 mb-16">
                    <h3 className="text-action-teal font-bold text-2xl tracking-tight">Competency Weights</h3>
                    <p className="text-text-secondary text-sm font-medium">The interview will focus on these areas, weighted as shown.</p>
                    
                    <div className="space-y-5 pt-8">
                        {data.map((item, i) => (
                            <div 
                                key={i} 
                                className="relative flex items-center gap-6 group"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <div className="w-40 text-right">
                                    <span className="text-text-primary text-sm font-bold tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex-grow h-9 bg-white/5 rounded-sm relative overflow-visible shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percentage}%` }}
                                        transition={{ delay: 0.2 + (i * 0.1), duration: 1, ease: "circOut" }}
                                        className="h-full rounded-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    
                                    <AnimatePresence>
                                        {hoveredIndex === i && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute left-1/2 -top-16 -translate-x-1/2 z-50 bg-[#0A192F] border border-info-blue/30 px-5 py-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] pointer-events-none"
                                            >
                                                <p className="text-white font-bold text-xs mb-1">{item.label}</p>
                                                <p className="text-text-secondary text-[10px] font-bold opacity-60 uppercase tracking-widest">weight : {Math.round(item.percentage)}%</p>
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0A192F] border-r border-b border-info-blue/30 rotate-45" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="w-16">
                                    <span className="text-info-blue text-sm font-mono font-bold">
                                        {Math.round(item.percentage)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Footer */}
                <div className="w-full grid grid-cols-2 gap-10 pt-10 border-t border-white/5">
                    <button 
                        onClick={onAdjustSpecs} 
                        className="bg-[#162741] text-white font-bold py-6 rounded-2xl hover:bg-[#1c3253] transition-all text-[11px] tracking-[0.2em] uppercase border border-white/10"
                    >
                        Adjust Specs
                    </button>
                    <button 
                        onClick={onInitialize}
                        className="bg-action-teal text-base-surface font-black py-6 rounded-2xl hover:bg-opacity-90 transition-all text-[11px] tracking-[0.2em] uppercase shadow-[0_20px_40px_rgba(20,200,176,0.2)]"
                    >
                        Initialize Arena
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ArenaBlueprint;
