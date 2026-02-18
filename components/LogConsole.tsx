import React, { useEffect, useRef } from 'react';
import { LogEntry, RequestStatus } from '../types';
import { Terminal, Trash2 } from 'lucide-react';

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.SUCCESS: return 'text-green-400';
      case RequestStatus.FAILED: return 'text-red-400';
      case RequestStatus.RATE_LIMITED: return 'text-orange-400';
      case RequestStatus.SENT: return 'text-yellow-300'; // New color for Fire-and-Forget
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-black border border-slate-700 rounded-lg flex flex-col h-[500px] shadow-xl overflow-hidden font-mono text-sm">
      <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal size={16} />
          <span className="font-bold">Execution Logs</span>
        </div>
        <button 
          onClick={onClear}
          className="text-slate-500 hover:text-red-400 transition-colors"
          title="Clear Logs"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {logs.length === 0 && (
          <div className="text-slate-600 italic text-center mt-20">
            Waiting for process initiation...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 p-1 rounded transition-colors">
            <span className="text-slate-500 w-20 shrink-0">[{log.timestamp}]</span>
            <span className="text-blue-400 font-bold w-40 shrink-0 truncate">{log.serviceName}</span>
            <span className={`${getStatusColor(log.status)} w-24 shrink-0 font-bold`}>{log.status}</span>
            <span className="text-slate-300 truncate flex-1">{log.message}</span>
            <span className="text-slate-600 text-xs w-16 text-right">{log.latency}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
};