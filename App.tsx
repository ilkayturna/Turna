import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationMode, LogEntry, SimulationStats, RequestStatus } from './types';
import { TARGET_ENDPOINTS, INITIAL_STATS } from './constants';
import { simulateNetworkCall } from './services/simulator';
import { ControlPanel } from './components/ControlPanel';
import { LogConsole } from './components/LogConsole';
import { StatsBoard } from './components/StatsBoard';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { Activity, Zap, Server, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState('5551234567');
  const [email, setEmail] = useState('');
  const [limit, setLimit] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>(SimulationMode.SEQUENTIAL);
  const [speed, setSpeed] = useState(500); 
  
  const [useSimulation, setUseSimulation] = useState(true);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceIndexRef = useRef(0);

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
    
    const result = await simulateNetworkCall(service, target, email, useSimulation);
    
    if (isRunning) { 
        addLog(result);
    }
  }, [target, email, isRunning, limit, stats.totalSent, addLog, useSimulation]);

  const runParallelStep = useCallback(() => {
    if (limit !== null && stats.totalSent >= limit) return;

    TARGET_ENDPOINTS.forEach(async (service) => {
      await new Promise(r => setTimeout(r, Math.random() * 500)); 
      if (!isRunning) return;
      const result = await simulateNetworkCall(service, target, email, useSimulation);
      if (isRunning) addLog(result);
    });
  }, [target, email, isRunning, limit, stats.totalSent, addLog, useSimulation]);

  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
  };

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
                 SMS API Simulator
               </h1>
            </div>
            <p className="text-zinc-500 text-sm mt-2 ml-1">
              Analyze request mechanics, concurrency patterns, and response handling.
            </p>
          </div>
          
          <div className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border transition-all ${
            useSimulation 
              ? 'bg-zinc-900 border-zinc-700 text-zinc-300' 
              : 'bg-red-950/30 border-red-900 text-red-400'
          }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${useSimulation ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {useSimulation ? "Gateway Mode: Secure Proxy" : "Browser Mode: Direct Connection"}
          </div>
        </header>

        <main className="space-y-6">
          <StatsBoard stats={stats} />

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
                useSimulation={useSimulation}
                setUseSimulation={setUseSimulation}
              />
              
              <div className="h-[400px] lg:h-[450px] bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                 <NetworkVisualizer activeServices={activeServices} />
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