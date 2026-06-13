import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, SimulationStats, RequestStatus, EndpointHealth } from './types';
import { TARGET_ENDPOINTS, INITIAL_STATS } from './constants';
import { simulateNetworkCall, detectLocalProxy } from './services/simulator';
import { AdaptiveConcurrencyQueue } from './services/queue';
import { ControlPanel } from './components/ControlPanel';
import { LogConsole } from './components/LogConsole';
import { StatsBoard } from './components/StatsBoard';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { Zap } from 'lucide-react';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState('5343622375');
  const [email, setEmail] = useState('');
  const [limit, setLimit] = useState<number | null>(null);
  const [localProxyAvailable, setLocalProxyAvailable] = useState<boolean | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [endpointHealth, setEndpointHealth] = useState<EndpointHealth[]>(
    TARGET_ENDPOINTS.map(s => ({ id: s.id, name: s.name, status: 'unknown' }))
  );
  const [isTesting, setIsTesting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    detectLocalProxy().then(setLocalProxyAvailable);
  }, []);

  const addLog = useCallback((log: LogEntry) => {
    setLogs(prev => {
      const newLogs = [...prev, log];
      if (newLogs.length > 200) newLogs.shift();
      return newLogs;
    });

    setStats(prev => {
      const newStats = { ...prev, totalSent: prev.totalSent + 1 };
      if (log.status === RequestStatus.SUCCESS) newStats.success++;
      if (log.status === RequestStatus.FAILED) newStats.failed++;
      if (log.status === RequestStatus.RATE_LIMITED) newStats.rateLimited++;
      if (log.status === RequestStatus.SENT) newStats.sentOpaque++; 
      return newStats;
    });

    setActiveServices(prev => [...prev, log.serviceName]);
    setTimeout(() => {
      setActiveServices(prev => prev.filter(s => s !== log.serviceName));
    }, 400);
  }, []);

  const addResult = useCallback((result: LogEntry) => {
    addLog(result);

    setEndpointHealth(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(e => e.name === result.serviceName);
      if (idx >= 0) {
        const matched = TARGET_ENDPOINTS.find(s => s.name === result.serviceName);
        updated[idx] = {
          ...updated[idx],
          status: result.status === RequestStatus.SUCCESS ? 'working' : matched?.status === 'limited' ? 'limited' : 'dead',
          upstreamStatus: parseInt(result.message.match(/(\d+)/)?.[0] || '0')
        };
      }
      return updated;
    });
  }, [addLog]);

  const handleStart = useCallback(async () => {
    if (!target) {
      alert("Please enter a valid target phone number.");
      return;
    }

    setStats(INITIAL_STATS);
    setLogs([]);
    setEndpointHealth(TARGET_ENDPOINTS.map(s => ({ id: s.id, name: s.name, status: 'unknown' })));
    setIsRunning(true);

    const abort = new AbortController();
    abortRef.current = abort;

    const endpoints = limit ? TARGET_ENDPOINTS.slice(0, limit) : TARGET_ENDPOINTS;

    const queue = new AdaptiveConcurrencyQueue();
    const tasks = endpoints.map(service => ({
      id: service.id,
      execute: () => simulateNetworkCall(service, target, email, localProxyAvailable === true),
    }));

    await queue.run(tasks, abort.signal, addResult);
    setIsRunning(false);
  }, [target, email, limit, localProxyAvailable, addResult]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setStats(INITIAL_STATS);
    setEndpointHealth(TARGET_ENDPOINTS.map(s => ({ id: s.id, name: s.name, status: 'unknown' })));
  };

  const handleBulkTest = useCallback(async () => {
    if (isTesting) return;
    setIsTesting(true);
    setLogs([]);
    setStats(INITIAL_STATS);
    setEndpointHealth(TARGET_ENDPOINTS.map(s => ({ id: s.id, name: s.name, status: 'unknown' })));

    const queue = new AdaptiveConcurrencyQueue();
    const tasks = TARGET_ENDPOINTS.map(service => ({
      id: service.id,
      execute: () => simulateNetworkCall(service, target, email, localProxyAvailable === true),
    }));

    await queue.run(tasks, undefined, addResult);
    setIsTesting(false);
  }, [target, email, localProxyAvailable, addResult]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-zinc-100 rounded text-black">
                 <Zap size={20} fill="currentColor" />
               </div>
               <h1 className="text-2xl font-semibold tracking-tight text-white">
                  SMS API Sender
                </h1>
            </div>
            <p className="text-zinc-500 text-sm mt-2 ml-1">
              Send real SMS OTP requests to {TARGET_ENDPOINTS.length} service endpoints.
            </p>
          </div>
          
          <div className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border transition-all ${
            localProxyAvailable === true ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-red-950/30 border-red-900 text-red-400'
          }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${localProxyAvailable === true ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {localProxyAvailable === null ? 'Detecting...' : localProxyAvailable ? 'Local Proxy (your IP)' : 'Vercel Proxy'}
          </div>
        </header>

        <main className="space-y-6">
            <StatsBoard stats={stats} endpointHealth={endpointHealth} localProxyAvailable={localProxyAvailable} />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Controls & Visualization */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <ControlPanel
                isRunning={isRunning}
                onStart={handleStart}
                onStop={handleStop}
                target={target}
                setTarget={setTarget}
                email={email}
                setEmail={setEmail}
                limit={limit}
                setLimit={setLimit}
                isTesting={isTesting}
                onBulkTest={handleBulkTest}
                localProxyAvailable={localProxyAvailable}
              />
              
              <div className="h-[400px] lg:h-[450px] bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                 <NetworkVisualizer activeServices={activeServices} endpointHealth={endpointHealth} />
              </div>

            </div>

            {/* Right Column: Logs */}
            <div className="lg:col-span-8 h-[600px] lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
              <LogConsole logs={logs} onClear={handleClearLogs} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
