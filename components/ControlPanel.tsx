import React from 'react';
import { Play, Square, Settings, Server, Globe, Zap, TestTube, Monitor } from 'lucide-react';
import { SpeedLevel, SPEED_CONFIG } from '../types';

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
  speedLevel: SpeedLevel;
  setSpeedLevel: (val: SpeedLevel) => void;
  isTesting: boolean;
  onBulkTest: () => void;
  localProxyAvailable: boolean | null;
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

const SPEED_LABELS: Record<SpeedLevel, string> = {
  safe: 'Safe',
  normal: 'Normal',
  aggressive: 'Aggressive',
  max: 'Max',
};

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
  speedLevel,
  setSpeedLevel,
  isTesting,
  onBulkTest,
  localProxyAvailable
}) => {
  return (
    <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
        <Settings size={16} className="text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">Configuration</h2>
      </div>
      
      <div className="space-y-5">
        
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

        {/* Speed Level Selector */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-2">Speed Level</label>
          <div className="grid grid-cols-4 gap-1 bg-zinc-900 rounded-lg border border-zinc-800 p-1">
            {(Object.keys(SPEED_CONFIG) as SpeedLevel[]).map(level => (
              <button
                key={level}
                onClick={() => setSpeedLevel(level)}
                disabled={isRunning}
                className={`py-1.5 text-xs rounded font-medium transition-all ${
                  speedLevel === level ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {SPEED_LABELS[level]}
              </button>
            ))}
          </div>
          <p className="text-zinc-600 text-[10px] mt-1.5 font-mono">
            {SPEED_CONFIG[speedLevel].maxConcurrent} concurrent · {SPEED_CONFIG[speedLevel].batchDelay}ms delay · {SPEED_CONFIG[speedLevel].minEndpointGap}ms gap
          </p>
        </div>

        {/* Request Limit */}
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

        {/* Local Proxy Status */}
        <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg px-3 py-2.5 border border-zinc-800">
          <Monitor size={14} className="text-zinc-500" />
          <span className="text-xs text-zinc-400">Local Proxy:</span>
          <span className={`flex items-center gap-1.5 ml-auto text-xs font-mono ${
            localProxyAvailable === true ? 'text-emerald-400' : localProxyAvailable === false ? 'text-red-400' : 'text-zinc-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              localProxyAvailable === true ? 'bg-emerald-500' : localProxyAvailable === false ? 'bg-red-500' : 'bg-zinc-600 animate-pulse'
            }`} />
            {localProxyAvailable === null ? 'Detecting...' : localProxyAvailable === true ? 'Connected (your IP)' : 'Vercel Proxy'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors shadow-sm text-sm"
            >
              <Play size={16} fill="currentColor" /> Start Sending SMS
            </button>
          ) : (
            <button
              onClick={onStop}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
            >
              <Square size={16} fill="currentColor" /> Stop Process
            </button>
          )}

          <button
            onClick={onBulkTest}
            disabled={isRunning || isTesting}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${
              isTesting
                ? 'bg-amber-900/30 text-amber-400 border border-amber-700/50'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <TestTube size={16} /> {isTesting ? 'Testing...' : 'Tümünü Test Et'}
          </button>
        </div>
      </div>
    </div>
  );
};
