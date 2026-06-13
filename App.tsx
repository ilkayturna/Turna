import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationMode, LogEntry, SimulationStats, RequestStatus, EndpointHealth } from './types';
import { TARGET_ENDPOINTS, INITIAL_STATS } from './constants';
import { simulateNetworkCall, detectLocalProxy } from './services/simulator';
import { ControlPanel } from './components/ControlPanel';
import { LogConsole } from './components/LogConsole';
import { StatsBoard } from './components/StatsBoard';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { Activity, Zap, Server, Globe, TestTube } from 'lucide-react';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState('5343622375');
  const [email, setEmail] = useState('');
  const [limit, setLimit] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>(SimulationMode.SEQUENTIAL);
  const [speed, setSpeed] = useState(500);
  const [localProxyAvailable, setLocalProxyAvailable] = useState<boolean | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [endpointHealth, setEndpointHealth] = useState<EndpointHealth[]>(
    TARGET_ENDPOINTS.map(s => ({ id: s.id, name: s.name, status: 'unknown' }))
  );
  const [isTesting, setIsTesting] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceIndexRef = useRef(0);

  useEffect(() => {
    detectLocalProxy().then(setLocalProxyAvailable);
  }, []);

  const addLog = useCallback((log: LogEntry) => {
    setLogs(prev => {
      const newLogs = [...prev, log];
      if (newLogs.length > 100) newLogs.shift();
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

  useEffect(() => {
    if (isRunning && limit !== null && stats.totalSent >= limit) {
      setIsRunning(false);
      const completionLog: LogEntry = {
        id: 'sys-end',
        timestamp: new Date().toLocaleTimeString(),
        serviceName: 'SYSTEM',
        status: RequestStatus.SUCCESS,
        message: `Request limit of ${limit} reached. Process terminated.`,
        latency: 0
      };
      setLogs(prev => [...prev, completionLog]);
    }
  }, [stats.totalSent, limit, isRunning]);

  const runSequentialStep = useCallback(async () => {
    if (limit !== null && stats.totalSent >= limit) return;

    const service = TARGET_ENDPOINTS[sequenceIndexRef.current];
    sequenceIndexRef.current = (sequenceIndexRef.current + 1) % TARGET_ENDPOINTS.length;
    
    const result = await simulateNetworkCall(service, target, email, localProxyAvailable === true);

    if (isRunning) {
        addLog(result);
    }
  }, [target, email, isRunning, limit, stats.totalSent, addLog, localProxyAvailable]);

  const runParallelStep = useCallback(() => {
    if (limit !== null && stats.totalSent >= limit) return;

    TARGET_ENDPOINTS.forEach(async (service) => {
      await new Promise(r => setTimeout(r, Math.random() * 500));
      if (!isRunning) return;
      const result = await simulateNetworkCall(service, target, email, localProxyAvailable === true);
      if (isRunning) addLog(result);
    });
  }, [target, email, isRunning, limit, stats.totalSent, addLog, localProxyAvailable]);

  useEffect(() => {
    if (isRunning) {
      if (mode === SimulationMode.SEQUENTIAL) {
        intervalRef.current = setInterval(runSequentialStep, speed);
      } else {
        intervalRef.current = setInterval(runParallelStep, speed * 2); 
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, speed, runSequentialStep, runParallelStep]);

  const handleStart = () => {
    if (!target) {
      alert("Please enter a valid target phone number.");
      return;
    }
    if (stats.totalSent > 0 && !isRunning) {
        setStats(INITIAL_STATS);
        setLogs([]);
    }
    setIsRunning(true);
  };

  const handleStop = () => setIsRunning(false);
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

    const batchSize = 5;
    const results: LogEntry[] = [];

    for (let i = 0; i < TARGET_ENDPOINTS.length; i += batchSize) {
      const batch = TARGET_ENDPOINTS.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (service) => {
          const result = await simulateNetworkCall(service, target, email, localProxyAvailable === true);
          return result;
        })
      );

      for (const result of batchResults) {
        results.push(result);
        setLogs(prev => {
          const newLogs = [...prev, result];
          if (newLogs.length > 200) newLogs.shift();
          return newLogs;
        });
        setStats(prev => {
          const ns = { ...prev, totalSent: prev.totalSent + 1 };
          if (result.status === RequestStatus.SUCCESS) ns.success++;
          if (result.status === RequestStatus.FAILED) ns.failed++;
          if (result.status === RequestStatus.RATE_LIMITED) ns.rateLimited++;
          if (result.status === RequestStatus.SENT) ns.sentOpaque++;
          return ns;
        });
        setActiveServices(prev => [...prev, result.serviceName]);
      }

      // endpoint health update
      setEndpointHealth(prev => {
        const updated = [...prev];
        for (const r of batchResults) {
          const idx = updated.findIndex(e => e.name === r.serviceName);
          if (idx >= 0) {
            const matched = TARGET_ENDPOINTS.find(s => s.name === r.serviceName);
            updated[idx] = {
              ...updated[idx],
              status: r.status === RequestStatus.SUCCESS ? 'working' : matched?.status === 'limited' ? 'limited' : 'dead',
              upstreamStatus: parseInt(r.message.match(/(\d+)/)?.[0] || '0')
            };
          }
        }
        return updated;
      });

      await new Promise(r => setTimeout(r, 200));
    }

    setIsTesting(false);
  }, [target, email, isTesting, localProxyAvailable]);

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
              Send real SMS OTP requests to service endpoints.
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
                mode={mode}
                setMode={setMode}
                speed={speed}
                setSpeed={setSpeed}
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
