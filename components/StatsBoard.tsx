import React from 'react';
import { SimulationStats, EndpointHealth } from '../types';

interface StatsBoardProps {
  stats: SimulationStats;
  endpointHealth?: EndpointHealth[];
  lastRunAt?: number | null;
}

interface StatCardProps {
  title: string;
  value: number | string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
}
const StatCard = ({ title, value, type = 'default', subtitle }: StatCardProps) => {
  let valueColor = 'text-white';
  if (type === 'success') valueColor = 'text-emerald-500';
  if (type === 'error') valueColor = 'text-rose-500';
  if (type === 'warning') valueColor = 'text-amber-500';
  if (type === 'info') valueColor = 'text-sky-400';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
      <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">{title}</span>
      <span className={`text-2xl font-semibold font-mono tracking-tight ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      {subtitle && <span className="text-zinc-600 text-[10px] font-mono mt-1">{subtitle}</span>}
    </div>
  );
};

export const StatsBoard: React.FC<StatsBoardProps> = ({ stats, endpointHealth, lastRunAt }) => {
  const working = endpointHealth?.filter(h => h.status === 'working').length || 0;
  const dead = endpointHealth?.filter(h => h.status === 'dead').length || 0;
  const limited = endpointHealth?.filter(h => h.status === 'limited').length || 0;
  const total = endpointHealth?.length || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <StatCard title="Requests" value={stats.totalSent} subtitle="uç nokta başına 1" />

      <StatCard title="2xx" value={stats.success} type="success" subtitle={total > 0 ? `/ ${total} uç nokta` : undefined} />

      <StatCard title="Failed" value={stats.failed} type="error" />

      <StatCard title="Rate Limited" value={stats.rateLimited} type="warning" />

      {total > 0 && (
        <StatCard
          title="Endpoint Health"
          value={total - dead}
          type="info"
          subtitle={dead > 0 ? `${working} working, ${limited} limited, ${dead} dead` : `${working} working`}
        />
      )}

      <StatCard
        title="Mode"
        value="Tek geçiş"
        type="success"
        subtitle={lastRunAt ? `son: ${new Date(lastRunAt).toLocaleTimeString()}` : 'proxy yok · döngü yok'}
      />
    </div>
  );
};
