import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationMode, LogEntry, SimulationStats, RequestStatus } from './types';
import { MOCK_SERVICES, INITIAL_STATS } from './constants';
import { simulateNetworkCall } from './services/simulator';
import { ControlPanel } from './components/ControlPanel';
import { LogConsole } from './components/LogConsole';
import { StatsBoard } from './components/StatsBoard';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { Zap, Info, ShieldCheck, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState('5551234567');
  const [email, setEmail] = useState('');
  const [limit, setLimit] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>(SimulationMode.SEQUENTIAL);
  const [speed, setSpeed] = useState(500); 
  
  // Toggle between Fake (Safe) and Real (Live)
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
      if (log.status === RequestStatus.SENT) newStats.sentOpaque++; // Track Opaque Sent
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

    const service = MOCK_SERVICES[sequenceIndexRef.current];
    sequenceIndexRef.current = (sequenceIndexRef.current + 1) % MOCK_SERVICES.length;
    
    // Pass the useSimulation flag
    const result = await simulateNetworkCall(service, target, email, useSimulation);
    
    if (isRunning) { 
        addLog(result);
    }
  }, [target, email, isRunning, limit, stats.totalSent, addLog, useSimulation]);

  const runParallelStep = useCallback(() => {
    if (limit !== null && stats.totalSent >= limit) return;

    MOCK_SERVICES.forEach(async (service) => {
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-3">
            <Zap className="text-indigo-500" />
            API Stress Simulator v2.0
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Academic SMS API Analysis & Concurrency Testing Dashboard
          </p>
        </div>
        
        <div className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 border animate-pulse ${useSimulation ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-red-900/20 border-red-800 text-red-300'}`}>
            {useSimulation ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            <span>Environment: {useSimulation ? "Safe Simulation Mode" : "Live Network Mode"}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <StatsBoard stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
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
            
            <div className="h-[350px]">
              <NetworkVisualizer activeServices={activeServices} />
            </div>

             <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Info size={16} className="text-blue-400" /> Academic Notice
                </h3>
                <p className="text-xs text-slate-400">
                  <strong>Simulation Mode:</strong> Emulates 200 OK responses.<br/>
                  <strong>Live Mode:</strong> Uses "Fire-and-Forget" strategy. Requests are sent blindly to avoid browser CORS blocks. Status "SENT" confirms transmission, not receipt.
                </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <LogConsole logs={logs} onClear={handleClearLogs} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;