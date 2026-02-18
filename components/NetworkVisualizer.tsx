import React from 'react';
import { TARGET_ENDPOINTS } from '../constants';
import { ServiceDefinition } from '../types';
import { Globe, ArrowUpRight } from 'lucide-react';

interface NetworkVisualizerProps {
  activeServices: string[];
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ activeServices }) => {
  return (
    <div className="h-full flex flex-col bg-zinc-900/30">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 className="text-zinc-300 font-medium text-xs flex items-center gap-2">
          <Globe size={14} className="text-zinc-500" /> 
          Endpoints
        </h3>
        <span className="text-[10px] text-zinc-500 font-mono">
            {TARGET_ENDPOINTS.length} Total
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-zinc-800/50">
          {TARGET_ENDPOINTS.map((service: ServiceDefinition) => {
            const isActive = activeServices.includes(service.name);
            return (
              <div 
                key={service.id} 
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/30'
                }`}
              >
                {/* Status Dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                    isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>
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