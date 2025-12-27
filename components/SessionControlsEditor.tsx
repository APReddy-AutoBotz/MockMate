
import React from 'react';
import { SessionControls } from '../types';

interface SessionControlsEditorProps {
    controls: SessionControls;
    onChange: (newControls: SessionControls) => void;
}

const ToggleSwitch: React.FC<{ 
    isOn: boolean; 
    onToggle: () => void; 
    activeColor?: string;
}> = ({ isOn, onToggle, activeColor = 'bg-info-blue' }) => (
    <button 
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out border-2 ${
            isOn 
            ? `${activeColor} border-transparent shadow-[0_0_15px_rgba(56,189,248,0.4)]` 
            : 'bg-[#0A192F] border-white/10'
        }`}
    >
        <div className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out
            ${isOn ? 'left-[30px]' : 'left-0.5'}
        `} />
    </button>
);

const SessionControlsEditor: React.FC<SessionControlsEditorProps> = ({ controls, onChange }) => {
    
    const setPresetCount = (preset: 'quick' | 'standard' | 'deep') => {
        let newCount = preset === 'quick' ? 7 : preset === 'standard' ? 12 : 20;
        onChange({ ...controls, totalQuestions: newCount });
    }

    const handlePhaseMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name: changedPhase, value } = e.target;
        const newValue = parseInt(value, 10) / 100;

        const currentMix = { ...controls.phaseMix };
        const oldValue = currentMix[changedPhase as keyof typeof currentMix];
        const delta = newValue - (oldValue || 0);

        currentMix[changedPhase as keyof typeof currentMix] = newValue;

        const otherPhases = (Object.keys(currentMix) as Array<keyof typeof currentMix>).filter(p => p !== changedPhase);
        const sumOfOthers = otherPhases.reduce((acc: number, p) => acc + (currentMix[p] || 0), 0);

        if (sumOfOthers > 0) {
            let remainderToDistribute = -delta;
            for (const phase of otherPhases) {
                const proportion = (currentMix[phase] || 0) / sumOfOthers;
                const adjustment = remainderToDistribute * proportion;
                currentMix[phase] = (currentMix[phase] || 0) + adjustment;
            }
        }
        
        onChange({ ...controls, phaseMix: currentMix });
    };

    const applyContentPreset = (preset: 'balanced' | 'case') => {
        if (preset === 'balanced') {
            onChange({ ...controls, phaseMix: { knowledge: 0.34, process: 0.33, scenario: 0.33, coding: 0 }, includeCoding: false });
        } else {
            onChange({ ...controls, phaseMix: { knowledge: 0.2, process: 0.2, scenario: 0.6, coding: 0 }, includeCoding: false });
        }
    };

    const toggleCoding = () => {
        const isCurrentlyOn = controls.includeCoding;
        const newMix = { ...controls.phaseMix };
        if (!isCurrentlyOn) {
            newMix.coding = 0.2;
            newMix.knowledge = Math.max(0, newMix.knowledge - 0.1);
            newMix.scenario = Math.max(0, newMix.scenario - 0.1);
        } else {
            newMix.coding = 0;
            newMix.knowledge = 0.34;
            newMix.scenario = 0.33;
        }
        onChange({ ...controls, includeCoding: !isCurrentlyOn, phaseMix: newMix });
    };

    return (
        <div className="space-y-12">
            {/* Volume and Sophistication Tier Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Volume Section */}
                <div className="space-y-5">
                    <div className="flex justify-between items-baseline px-1">
                        <label className="text-sm font-bold text-white tracking-tight">Volume</label>
                        <span className="text-sm font-bold text-info-blue">{controls.totalQuestions} Queries</span>
                    </div>
                    <div className="flex gap-2">
                        {(['quick', 'standard', 'deep'] as const).map(p => (
                            <button 
                                key={p}
                                onClick={() => setPresetCount(p)}
                                className={`flex-1 py-4 text-xs font-bold rounded-xl border transition-all ${
                                    (p === 'quick' && controls.totalQuestions === 7) || 
                                    (p === 'standard' && controls.totalQuestions === 12) || 
                                    (p === 'deep' && controls.totalQuestions === 20)
                                    ? 'bg-info-blue text-base-surface border-info-blue'
                                    : 'bg-white/[0.03] text-text-secondary border-white/5 hover:border-white/10'
                                }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sophistication Tier Section */}
                <div className="space-y-5">
                    <label className="text-sm font-bold text-white tracking-tight block px-1">Sophistication tier</label>
                    <div className="flex gap-2">
                        {(['beginner', 'mixed', 'advanced'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => onChange({ ...controls, difficulty: level })}
                                className={`flex-1 py-4 text-xs font-bold rounded-xl border transition-all ${
                                    controls.difficulty === level 
                                    ? 'bg-action-teal text-base-surface border-action-teal' 
                                    : 'bg-white/[0.03] text-text-secondary border-white/5 hover:border-white/10'
                                }`}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Emphasis Section */}
            <div className="space-y-8">
                <div className="flex justify-between items-end px-1">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-white tracking-tight">Content emphasis</label>
                        <p className="text-[12px] text-text-secondary/60 font-medium">Adjust weights to tailor session focus</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => applyContentPreset('balanced')}
                            className={`px-5 py-2 text-[11px] font-bold rounded-lg border transition-all ${
                                !controls.includeCoding && controls.phaseMix.knowledge === 0.34 
                                ? 'bg-info-blue/20 border-info-blue text-info-blue'
                                : 'border-info-blue/30 text-info-blue hover:bg-info-blue/10'
                            }`}
                        >
                            Balanced
                        </button>
                        <button 
                            onClick={() => applyContentPreset('case')}
                            className={`px-5 py-2 text-[11px] font-bold rounded-lg border transition-all ${
                                controls.phaseMix.scenario === 0.6 
                                ? 'bg-action-teal/20 border-action-teal text-action-teal'
                                : 'border-action-teal/30 text-action-teal hover:bg-action-teal/10'
                            }`}
                        >
                            Case focus
                        </button>
                    </div>
                </div>
                
                <div className="bg-[#11233D]/50 p-8 rounded-3xl border border-white/5 space-y-10 shadow-inner">
                    {(['knowledge', 'process', 'scenario'] as const).map((phase) => {
                        const phaseValue = controls.phaseMix[phase] || 0;
                        return (
                             <div key={phase} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-white/80 tracking-wide">{phase.charAt(0).toUpperCase() + phase.slice(1)}</span>
                                    <span className="text-xs font-mono text-info-blue font-bold">{Math.round(phaseValue * 100)}%</span>
                                </div>
                                <div className="relative flex items-center h-4">
                                    <div className="absolute w-full h-[1px] bg-white/10" />
                                    <input
                                        type="range"
                                        name={phase}
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={Math.round(phaseValue * 100)}
                                        onChange={handlePhaseMixChange}
                                        className="w-full h-full bg-transparent appearance-none cursor-pointer relative z-10"
                                        style={{
                                            accentColor: '#38BDF8',
                                        }}
                                    />
                                    <style>{`
                                        input[type=range]::-webkit-slider-runnable-track { height: 1px; }
                                        input[type=range]::-webkit-slider-thumb {
                                            appearance: none;
                                            height: 16px;
                                            width: 16px;
                                            border-radius: 50%;
                                            background: #38BDF8;
                                            margin-top: -7.5px;
                                            box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
                                            border: none;
                                        }
                                    `}</style>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Tactical Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-between p-8 bg-white/[0.03] rounded-3xl border border-white/5 transition-all hover:bg-white/[0.05] min-h-[160px]">
                    <div className="space-y-1.5 text-center">
                        <label className="text-sm font-bold text-white tracking-tight block">Coach guidance</label>
                        <p className="text-[11px] text-text-secondary font-medium">Real-time socratic hints</p>
                    </div>
                    <div className="mt-4">
                        <ToggleSwitch 
                            isOn={controls.sessionMode === 'coach'} 
                            onToggle={() => onChange({...controls, sessionMode: controls.sessionMode === 'coach' ? 'exam' : 'coach'})}
                        />
                    </div>
                </div>
                
                <div className="flex flex-col items-center justify-between p-8 bg-white/[0.03] rounded-3xl border border-white/5 transition-all hover:bg-white/[0.05] min-h-[160px]">
                    <div className="space-y-1.5 text-center">
                        <label className="text-sm font-bold text-white tracking-tight block">Behavioral focus</label>
                        <p className="text-[11px] text-text-secondary font-medium">Include cultural STAR methods</p>
                    </div>
                    <div className="mt-4">
                        <ToggleSwitch 
                            isOn={controls.includeBehavioral} 
                            onToggle={() => onChange({...controls, includeBehavioral: !controls.includeBehavioral})}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between p-8 bg-white/[0.03] rounded-3xl border border-white/5 transition-all hover:bg-white/[0.05] min-h-[160px]">
                    <div className="space-y-1.5 text-center">
                        <label className="text-sm font-bold text-white tracking-tight block">Technical focus</label>
                        <p className="text-[11px] text-text-secondary font-medium">Include live code challenges</p>
                    </div>
                    <div className="mt-4">
                        <ToggleSwitch 
                            isOn={!!controls.includeCoding} 
                            onToggle={toggleCoding}
                            activeColor="bg-action-teal"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionControlsEditor;
