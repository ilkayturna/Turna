import React from 'react';
import { TARGET_ENDPOINTS } from '../constants';
import { ServiceDefinition, EndpointHealth } from '../types';
import { Globe, ArrowUpRight } from 'lucide-react';

interface NetworkVisualizerProps {
  activeServices: string[];
  endpointHealth?: EndpointHealth[];
}

function getStatusColor(status: string, isActive: boolean): string {
  if (isActive) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  switch (status) {
    case 'working': return 'bg-emerald-500/70';
    case 'limited': return 'bg-amber-500/70';
    case 'dead': return 'bg-rose-500/70';
    default: return 'bg-zinc-800';
  }
}

function getTextColor(status: string, isActive: boolean): string {
  if (isActive) return 'text-white';
  switch (status) {
    case 'working': return 'text-emerald-400/80';
    case 'limited': return 'text-amber-400/80';
    case 'dead': return 'text-rose-400/60';
    default: return 'text-zinc-400';
  }
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ activeServices, endpointHealth }) => {
  const healthMap = new Map<string, string>();
  if (endpointHealth) {
    endpointHealth.forEach(h => healthMap.set(h.id, h.status));
  }

  const working = endpointHealth?.filter(h => h.status === 'working').length || 0;
  const dead = endpointHealth?.filter(h => h.status === 'dead').length || 0;
  const unknown = endpointHealth?.filter(h => h.status === 'unknown').length || TARGET_ENDPOINTS.length;

  return (
    <div className="h-full flex flex-col bg-zinc-900/30">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 className="text-zinc-300 font-medium text-xs flex items-center gap-2">
          <Globe size={14} className="text-zinc-500" /> 
          Endpoints
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {endpointHealth && endpointHealth.some(h => h.status !== 'unknown') && (
            <>
              <span className="text-emerald-500">{working} ✓</span>
              <span className="text-rose-500">{dead} ✗</span>
              <span className="text-zinc-600">|</span>
            </>
          )}
          <span className="text-zinc-500">{TARGET_ENDPOINTS.length} Total</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-zinc-800/50">
          {TARGET_ENDPOINTS.map((service: ServiceDefinition) => {
            const isActive = activeServices.includes(service.name);
            const healthStatus = healthMap.get(service.id) || 'unknown';
            return (
              <div 
                key={service.id} 
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${getStatusColor(healthStatus, isActive)}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-xs font-medium truncate ${getTextColor(healthStatus, isActive)}`}>
                      {service.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-mono">
                        {service.method}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-600 truncate font-mono">
                    {service.url}
                  </div>
                </div>
                
                {isActive && <ArrowUpRight size={14} className="text-zinc-500" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};