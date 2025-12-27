
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS_CONFIG, Persona } from '../personas.config';

interface PanelSelectorProps {
    selectedPanelIDs: string[];
    onSelectionChange: (ids: string[]) => void;
}

const PanelSelector: React.FC<PanelSelectorProps> = ({ selectedPanelIDs, onSelectionChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);

    const selectedPersonas = selectedPanelIDs.map(id => PERSONAS_CONFIG.find(p => p.id === id)).filter(Boolean) as Persona[];

    const openModal = (slotIndex: number) => {
        setActiveSlot(slotIndex);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActiveSlot(null);
    };

    const handlePersonaSelect = (personaId: string) => {
        if (activeSlot === null) return;
        const newSelection = [...selectedPanelIDs];
        newSelection[activeSlot] = personaId;
        onSelectionChange(newSelection);
        closeModal();
    };

    // Helper to convert to sentence case
    const toSentenceCase = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedPersonas.map((persona, index) => (
                    <motion.div 
                        key={persona.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => openModal(index)}
                        className="relative group p-6 bg-[#162741]/50 border border-white/5 rounded-2xl flex items-center gap-4 transition-all hover:bg-[#162741] hover:border-white/20 cursor-pointer overflow-hidden min-h-[90px]"
                    >
                         {/* Icon Circle with Deep Orange Border as requested */}
                         <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#EA580C] bg-[#EA580C]/10 text-white">
                             <persona.icon className="w-6 h-6" />
                        </div>
                        
                        <div className="text-left flex flex-col justify-center">
                            <p className="font-bold text-white text-lg tracking-tight leading-tight mb-0.5">
                                {persona.name}
                            </p>
                            {/* Title shown fully in Sentence Case */}
                            <p className="text-[12px] text-text-secondary opacity-70 leading-snug whitespace-normal break-words">
                                {persona.title}
                            </p>
                        </div>

                        <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[9px] text-info-blue font-bold uppercase tracking-widest">Swap</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal for Selecting Personas */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0A192F]/90 backdrop-blur-xl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0D213F] border border-white/10 rounded-[3rem] p-12 max-w-4xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-12">
                                <h3 className="text-4xl font-serif font-bold text-white">Select Panel Expert</h3>
                                <button onClick={closeModal} className="label-pill text-text-secondary hover:text-white transition-colors">Close</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {PERSONAS_CONFIG.map((p) => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => handlePersonaSelect(p.id)}
                                        className={`p-8 text-left bg-white/[0.03] border border-white/5 rounded-2xl hover:border-action-teal/40 hover:bg-white/[0.08] transition-all flex items-start gap-6 group ${selectedPanelIDs.includes(p.id) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        disabled={selectedPanelIDs.includes(p.id)}
                                    >
                                        <div className="p-4 rounded-full border-2 border-[#EA580C] bg-[#EA580C]/10">
                                            <p.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-white mb-1 group-hover:text-action-teal transition-colors">{p.name}</h4>
                                            <p className="text-sm text-text-secondary mb-3 opacity-60 tracking-tight">{p.title}</p>
                                            <p className="text-sm text-text-secondary/80 leading-relaxed italic">"{p.blurb}"</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PanelSelector;
