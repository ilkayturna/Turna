import React, { useEffect, useRef } from 'react';
import { LogEntry, RequestStatus } from '../types';
import { Terminal, Trash2, Activity } from 'lucide-react';

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
      case RequestStatus.SUCCESS: return 'text-emerald-500';
      case RequestStatus.FAILED: return 'text-rose-500';
      case RequestStatus.RATE_LIMITED: return 'text-amber-500';
      case RequestStatus.SENT: return 'text-blue-500'; 
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
      
      {/* Top Bar */}
      <div className="bg-zinc-900/80 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-400" />
          <span className="font-mono text-xs text-zinc-400">output.log</span>
        </div>
        
        <button 
          onClick={onClear}
          className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
          title="Clear Buffer"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      {/* Console Body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-[#0c0c0e]"
      >
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3">
            <Activity size={24} className="opacity-20" />
            <span className="text-zinc-600">Waiting for requests...</span>
          </div>
        )}
        
        <table className="w-full text-left border-collapse">
            <tbody>
            {logs.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="py-1 pr-4 text-zinc-600 w-24 align-top whitespace-nowrap border-r border-zinc-800/50">{log.timestamp}</td>
                <td className="py-1 px-4 text-zinc-300 font-semibold w-40 align-top whitespace-nowrap">{log.serviceName}</td>
                <td className={`py-1 px-4 w-24 align-top whitespace-nowrap font-medium ${getStatusColor(log.status)}`}>{log.status}</td>
                <td className="py-1 px-4 text-zinc-500 align-top break-all">{log.message}</td>
                <td className="py-1 pl-4 text-zinc-600 text-right w-16 align-top">{log.latency}ms</td>
            </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};