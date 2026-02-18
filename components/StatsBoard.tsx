import React from 'react';
import { SimulationStats } from '../types';
import { CheckCircle, XCircle, AlertTriangle, Send, Radio } from 'lucide-react';

interface StatsBoardProps {
  stats: SimulationStats;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col items-center justify-center shadow-lg">
        <div className="text-slate-400 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
          <Send size={14} /> Total
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalSent}</div>
      </div>

      <div className="bg-slate-800 p-3 rounded-lg border border-green-900/50 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
        <div className="text-green-400 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
          <CheckCircle size={14} /> Success
        </div>
        <div className="text-2xl font-bold text-white">{stats.success}</div>
      </div>

      {/* New SENT Board for Opaque Requests */}
      <div className="bg-slate-800 p-3 rounded-lg border border-yellow-900/50 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
         <div className="text-yellow-400 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
          <Radio size={14} /> Sent
        </div>
        <div className="text-2xl font-bold text-white">{stats.sentOpaque}</div>
        <div className="text-[9px] text-yellow-500/50 absolute bottom-1">Response Opaque</div>
      </div>

      <div className="bg-slate-800 p-3 rounded-lg border border-red-900/50 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
        <div className="text-red-400 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
          <XCircle size={14} /> Failed
        </div>
        <div className="text-2xl font-bold text-white">{stats.failed}</div>
      </div>

      <div className="bg-slate-800 p-3 rounded-lg border border-orange-900/50 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
        <div className="text-orange-400 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
          <AlertTriangle size={14} /> Limit
        </div>
        <div className="text-2xl font-bold text-white">{stats.rateLimited}</div>
      </div>
    </div>
  );
};