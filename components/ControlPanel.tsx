import React from 'react';
import { Play, Square, Settings, Server, Globe } from 'lucide-react';
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

const InputField = ({ label, ...props }: any) => (
  <div>
    <label className="block text-zinc-400 text-xs font-medium mb-2">{label}</label>
    <input
      {...props}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all font-mono placeholder:text-zinc-700"
    />
  </div>
);

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
    <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
        <Settings size={16} className="text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">Configuration</h2>
      </div>
      
      <div className="space-y-5">
        
        {/* Architecture Toggle */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-2">Network Architecture</label>
          <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                  onClick={() => setUseSimulation(true)}
                  disabled={isRunning}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                      useSimulation 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                  <Server size={14} /> Proxy Gateway
              </button>
              <button
                  onClick={() => setUseSimulation(false)}
                  disabled={isRunning}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                      !useSimulation 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                  <Globe size={14} /> Direct Browser
              </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
           <InputField 
             label="Target Phone Number" 
             value={target}
             onChange={(e: any) => setTarget(e.target.value)}
             disabled={isRunning}
             placeholder="555..."
           />
           <InputField 
             label="Target Email (Optional)" 
             type="email"
             value={email}
             onChange={(e: any) => setEmail(e.target.value)}
             disabled={isRunning}
             placeholder="user@example.com"
           />
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-2">Concurrency Mode</label>
            <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 p-1">
              <button
                onClick={() => setMode(SimulationMode.SEQUENTIAL)}
                disabled={isRunning}
                className={`flex-1 py-1.5 text-xs rounded font-medium transition-all ${
                  mode === SimulationMode.SEQUENTIAL ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Serial
              </button>
              <button
                onClick={() => setMode(SimulationMode.PARALLEL)}
                disabled={isRunning}
                className={`flex-1 py-1.5 text-xs rounded font-medium transition-all ${
                  mode === SimulationMode.PARALLEL ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Parallel
              </button>
            </div>
          </div>

          <InputField 
             label="Request Limit" 
             type="number"
             value={limit || ''}
             onChange={(e: any) => {
                const val = parseInt(e.target.value);
                setLimit(isNaN(val) || val <= 0 ? null : val);
             }}
             disabled={isRunning}
             placeholder="∞"
           />
        </div>

        {/* Speed Slider */}
        <div>
            <div className="flex justify-between text-xs font-medium text-zinc-400 mb-2">
                <span>Request Interval</span>
                <span className="text-white font-mono">{speed}ms</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isRunning}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors shadow-sm text-sm"
            >
              <Play size={16} fill="currentColor" /> Start Simulation
            </button>
          ) : (
            <button
              onClick={onStop}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
            >
              <Square size={16} fill="currentColor" /> Stop Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
};