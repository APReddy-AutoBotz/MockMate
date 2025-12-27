
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
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-12 overflow-y-auto max-h-[90vh]">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <span className="text-[10px] font-black text-info-blue uppercase tracking-[0.4em] mb-2 block">Personal Performance Journal</span>
                    <h1 className="text-4xl font-black text-text-primary tracking-tight">Your Readiness Journey</h1>
                </div>
                <button onClick={onBack} className="text-xs font-black text-text-secondary hover:text-text-primary uppercase tracking-widest transition-colors">
                    Back to Rehearsal
                </button>
            </header>

            {history.length === 0 ? (
                <div className="text-center py-24 opacity-40">
                    <p className="text-lg font-medium italic">Your growth history will appear here after your first complete rehearsal.</p>
                </div>
            ) : (
                <>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Confidence Trend */}
                        <div className="bg-base-surface/40 border border-white/5 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-[10px] font-black text-action-teal uppercase tracking-[0.2em]">Confidence Trend</h3>
                                <span className="text-[9px] text-text-secondary font-bold uppercase opacity-50">Average Panel Score</span>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[0, 5]} hide />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0A192F', border: '1px solid #14C8B0', borderRadius: '8px' }}
                                            itemStyle={{ color: '#E6F1F8', fontSize: '10px', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="confidence" stroke="#14C8B0" strokeWidth={3} dot={{ fill: '#14C8B0', r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Readiness Trend */}
                        <div className="bg-base-surface/40 border border-white/5 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-[10px] font-black text-accent-amber uppercase tracking-[0.2em]">Readiness Velocity</h3>
                                <span className="text-[9px] text-text-secondary font-bold uppercase opacity-50">Career Alignment</span>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[1, 3]} hide />
                                        <Tooltip 
                                            formatter={(value) => value === 3 ? 'Interview Ready' : value === 2 ? 'Almost Ready' : 'Not Ready Yet'}
                                            contentStyle={{ backgroundColor: '#0A192F', border: '1px solid #FBBF24', borderRadius: '8px' }}
                                        />
                                        <Area type="stepAfter" dataKey="readiness" stroke="#FBBF24" fillOpacity={1} fill="url(#readyGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Feed */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em] mb-4">Rehearsal History</h3>
                        <div className="space-y-4">
                            {latestSessions.map((session, i) => (
                                <motion.div 
                                    key={session.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/[0.08] transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="text-center min-w-[60px]">
                                            <p className="text-[10px] font-black text-text-secondary uppercase opacity-40">{new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short' })}</p>
                                            <p className="text-xl font-black text-text-primary">{new Date(session.timestamp).toLocaleDateString(undefined, { day: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-info-blue uppercase tracking-tight">{session.role}</p>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase opacity-60">{session.sessionType} rehearsal</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40 mb-1">Primary Risk</p>
                                            <p className="text-xs font-bold text-alert-coral">{session.biggestRisk}</p>
                                        </div>
                                        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40 mb-1">Score</p>
                                                <p className="text-lg font-black text-action-teal">{session.avgScore}</p>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${session.readinessStatus === 'INTERVIEW_READY' ? 'bg-action-teal' : session.readinessStatus === 'ALMOST_READY' ? 'bg-accent-amber' : 'bg-alert-coral'}`} />
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
