import React from 'react';
import { Play, Square, Activity, Cpu, Shield, Wifi } from 'lucide-react';
import { SimulationMode } from '../types';

interface ControlPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  target: string;
  setTarget: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  limit: number | null;
  setLimit: (val: number | null) => void;
  mode: SimulationMode;
  setMode: (val: SimulationMode) => void;
  speed: number;
  setSpeed: (val: number) => void;
  useSimulation: boolean;
  setUseSimulation: (val: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onStart,
  onStop,
  target,
  setTarget,
  email,
  setEmail,
  limit,
  setLimit,
  mode,
  setMode,
  speed,
  setSpeed,
  useSimulation,
  setUseSimulation
}) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="text-blue-400" /> Simulation Controls
      </h2>
      
      <div className="space-y-4">
        {/* Connection Type Toggle - CRITICAL FOR DEMO */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-600 mb-4">
            <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Network Layer Mode</label>
            <div className="flex gap-2">
                <button
                    onClick={() => setUseSimulation(true)}
                    disabled={isRunning}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded transition-all ${
                        useSimulation 
                        ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Shield size={16} /> Safe Simulation
                </button>
                <button
                    onClick={() => setUseSimulation(false)}
                    disabled={isRunning}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded transition-all ${
                        !useSimulation 
                        ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]' 
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Wifi size={16} /> Live Traffic
                </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
                {useSimulation 
                    ? "✅ Emulates API responses locally. Guaranteed success for academic demo."
                    : "⚠️ Sends real requests via Proxy. May fail due to CORS/Firewalls."}
            </div>
        </div>

        {/* Targets Section */}
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-slate-400 text-sm mb-1">Target Phone</label>
            <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isRunning}
                placeholder="5551234567"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            </div>
            <div>
            <label className="block text-slate-400 text-sm mb-1">Target Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRunning}
                placeholder="user@example.com"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Execution Logic</label>
            <div className="flex bg-slate-900 rounded p-1 border border-slate-600">
              <button
                onClick={() => setMode(SimulationMode.SEQUENTIAL)}
                disabled={isRunning}
                className={`flex-1 py-1 text-xs rounded font-medium transition-all ${
                  mode === SimulationMode.SEQUENTIAL ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Serial
              </button>
              <button
                onClick={() => setMode(SimulationMode.PARALLEL)}
                disabled={isRunning}
                className={`flex-1 py-1 text-xs rounded font-medium transition-all ${
                  mode === SimulationMode.PARALLEL ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Threaded
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Batch Limit</label>
             <input
                type="number"
                value={limit || ''}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setLimit(isNaN(val) || val <= 0 ? null : val);
                }}
                disabled={isRunning}
                placeholder="Infinite"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Speed Slider */}
        <div>
            <label className="block text-slate-400 text-sm mb-1">Interval Delay ({speed}ms)</label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
            />
        </div>

        <div className="pt-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className={`w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded transition-all shadow-lg ${useSimulation ? 'bg-green-600 hover:bg-green-700 shadow-green-900/50' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/50'}`}
            >
              <Play size={18} fill="currentColor" /> 
              {useSimulation ? 'Start Simulation' : 'Start Live Attack'}
            </button>
          ) : (
            <button
              onClick={onStop}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded transition-all shadow-lg"
            >
              <Square size={18} fill="currentColor" /> Stop Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
};