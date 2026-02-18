import React from 'react';
import { SimulationStats } from '../types';

interface StatsBoardProps {
  stats: SimulationStats;
}

const StatCard = ({ title, value, type = "default" }: any) => {
  let valueColor = "text-white";
  if (type === "success") valueColor = "text-emerald-500";
  if (type === "error") valueColor = "text-rose-500";
  if (type === "warning") valueColor = "text-amber-500";

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
      <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">{title}</span>
      <span className={`text-2xl font-semibold font-mono tracking-tight ${valueColor}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
};

export const StatsBoard: React.FC<StatsBoardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard 
        title="Total Requests" 
        value={stats.totalSent} 
      />

      <StatCard 
        title="Successful" 
        value={stats.success} 
        type="success"
      />

      <StatCard 
        title="Gateway Processed" 
        value={stats.sentOpaque} 
        type="warning"
      />

      <StatCard 
        title="Failed" 
        value={stats.failed} 
        type="error"
      />

      <StatCard 
        title="Rate Limited" 
        value={stats.rateLimited} 
        type="warning"
      />
    </div>
  );
};