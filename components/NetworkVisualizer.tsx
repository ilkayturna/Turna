import React from 'react';
import { MOCK_SERVICES } from '../constants';
import { ServiceDefinition } from '../types';
import { Server, Globe, ShieldAlert, Wifi } from 'lucide-react';

interface NetworkVisualizerProps {
  activeServices: string[];
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ activeServices }) => {
  return (
    <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 h-full flex flex-col overflow-hidden">
      <h3 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
        <Globe size={18} className="text-blue-500" /> Network Endpoints
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="space-y-2">
          {MOCK_SERVICES.map((service: ServiceDefinition) => {
            const isActive = activeServices.includes(service.name);
            return (
              <div 
                key={service.id} 
                className={`flex items-center gap-3 p-2 rounded transition-all duration-300 border ${
                  isActive 
                    ? 'bg-slate-800 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'bg-transparent border-transparent hover:bg-slate-800/50'
                }`}
              >
                {/* Status Indicator */}
                <div className={`shrink-0 transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                   {isActive ? <Wifi size={16} className="animate-pulse" /> : <Server size={16} />}
                </div>

                {/* Service Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`text-xs font-bold font-mono truncate ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {service.name}
                    </span>
                    <span className="text-[10px] text-slate-600 uppercase">{service.method}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {service.url}
                  </div>
                </div>

                {/* Activity Bar */}
                 <div className="w-1.5 h-8 bg-slate-800 rounded-full overflow-hidden relative shrink-0">
                    <div className={`absolute bottom-0 left-0 w-full bg-blue-500 transition-all duration-300 ${isActive ? 'h-full opacity-100' : 'h-0 opacity-0'}`} />
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};