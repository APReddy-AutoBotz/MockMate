
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { getSessionHistory } from '../services/storageService';
import { SessionHistoryRecord } from '../types';

interface GrowthDashboardProps {
    onBack: () => void;
}

const ReadinessMap: Record<string, number> = {
    'NOT_READY': 1,
    'ALMOST_READY': 2,
    'INTERVIEW_READY': 3
};

const GrowthDashboard: React.FC<GrowthDashboardProps> = ({ onBack }) => {
    const history = getSessionHistory().reverse(); // Chronological for charts

    const chartData = history.map(h => ({
        date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        confidence: h.avgScore,
        readiness: ReadinessMap[h.readinessStatus] || 1,
        role: h.role
    }));

    const latestSessions = [...history].reverse();

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-info-blue animate-pulse" />
                        <span className="text-[10px] font-black text-info-blue uppercase tracking-[0.4em] block">Private Performance Journal</span>
                    </div>
                    <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Readiness Portfolio</h1>
                </div>
                <button 
                    onClick={onBack} 
                    className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-text-secondary hover:text-white hover:bg-white/10 uppercase tracking-widest transition-all"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Arena
                </button>
            </header>

            {history.length === 0 ? (
                <div className="text-center py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                         <span className="text-2xl">📓</span>
                    </div>
                    <p className="text-lg font-medium italic text-text-secondary opacity-40">Your growth metrics will materialize here after your first session audit.</p>
                </div>
            ) : (
                <>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Confidence Trend */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-base-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-action-teal uppercase tracking-[0.2em]">Confidence Trend</h3>
                                    <p className="text-[9px] text-text-secondary font-bold uppercase opacity-30">Avg Session Score (1-5)</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-action-teal">{chartData[chartData.length - 1]?.confidence || '0'}</span>
                                    <span className="text-[10px] text-white/20 block font-black">LATEST</span>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[0, 5]} hide />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0A192F', border: '1px solid #14C8B0', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                                            itemStyle={{ color: '#E6F1F8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="confidence" 
                                            stroke="#14C8B0" 
                                            strokeWidth={4} 
                                            dot={{ fill: '#14C8B0', r: 5, strokeWidth: 0 }} 
                                            activeDot={{ r: 8, stroke: '#0A192F', strokeWidth: 2 }} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Readiness Trend */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-base-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-accent-amber uppercase tracking-[0.2em]">Readiness Velocity</h3>
                                    <p className="text-[9px] text-text-secondary font-bold uppercase opacity-30">Career Alignment Progression</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-accent-amber">
                                        {latestSessions[0]?.readinessStatus.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-white/20 block font-black">CURRENT STATUS</span>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[1, 3]} hide />
                                        <Tooltip 
                                            formatter={(value) => value === 3 ? 'Interview Ready' : value === 2 ? 'Almost Ready' : 'Not Ready'}
                                            contentStyle={{ backgroundColor: '#0A192F', border: '1px solid #FBBF24', borderRadius: '16px' }}
                                            itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                                        />
                                        <Area 
                                            type="stepAfter" 
                                            dataKey="readiness" 
                                            stroke="#FBBF24" 
                                            fillOpacity={1} 
                                            fill="url(#readyGrad)" 
                                            strokeWidth={3} 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Timeline Feed */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em]">Audit Timeline</h3>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{latestSessions.length} Total Sessions</span>
                        </div>
                        <div className="space-y-5">
                            {latestSessions.map((session, i) => (
                                <motion.div 
                                    key={session.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/[0.06] hover:border-white/20 transition-all shadow-xl"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="text-center min-w-[70px] bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-text-secondary uppercase opacity-40 mb-1">{new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short' })}</p>
                                            <p className="text-2xl font-black text-text-primary leading-none">{new Date(session.timestamp).toLocaleDateString(undefined, { day: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-white group-hover:text-info-blue transition-colors uppercase tracking-tight">{session.role}</h4>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-40 mt-1">{session.sessionType} Rehearsal Protocol</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                        <div className="md:text-right">
                                            <p className="text-[9px] font-black text-alert-coral uppercase tracking-widest opacity-60 mb-1">Session Risk</p>
                                            <p className="text-xs font-bold text-white group-hover:text-alert-coral transition-colors">{session.biggestRisk}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 border-l border-white/10 pl-8">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40 mb-1">Panel Score</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-2xl font-black text-action-teal">{session.avgScore}</p>
                                                    <span className="text-[10px] text-white/10 font-black">/5</span>
                                                </div>
                                            </div>
                                            <div 
                                                title={session.readinessStatus.replace(/_/g, ' ')}
                                                className={`w-3 h-3 rounded-full ${
                                                    session.readinessStatus === 'INTERVIEW_READY' ? 'bg-action-teal shadow-[0_0_12px_rgba(20,200,176,0.6)]' : 
                                                    session.readinessStatus === 'ALMOST_READY' ? 'bg-accent-amber shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 
                                                    'bg-alert-coral shadow-[0_0_12px_rgba(248,106,106,0.4)]'
                                                }`} 
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GrowthDashboard;
