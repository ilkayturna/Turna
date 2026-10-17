import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, SimulationStats, RequestStatus, EndpointHealth } from './types';
import {
  AUTHORIZED_ENDPOINTS,
  AUTHORIZED_PHONE_NUMBERS,
  INITIAL_STATS,
  RUN_COOLDOWN_MS,
  STEP_DELAY_MS,
} from './constants';
import { runSmokeTest } from './services/smoke-test';
import { ControlPanel } from './components/ControlPanel';
import { LogConsole } from './components/LogConsole';
import { StatsBoard } from './components/StatsBoard';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const initialHealth = (): EndpointHealth[] =>
  AUTHORIZED_ENDPOINTS.map(s => ({ id: s.id, name: s.name, status: 'unknown' as const }));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState(AUTHORIZED_PHONE_NUMBERS[0] ?? '');
  const [email, setEmail] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [endpointHealth, setEndpointHealth] = useState<EndpointHealth[]>(initialHealth);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const abortRef = useRef<AbortController | null>(null);
  const activeTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const cooldownRemaining = lastRunAt ? Math.max(0, lastRunAt + RUN_COOLDOWN_MS - now) : 0;
  const hasNumbers = AUTHORIZED_PHONE_NUMBERS.length > 0;
  const hasEndpoints = AUTHORIZED_ENDPOINTS.length > 0;
  const canRun = hasNumbers && hasEndpoints && !isRunning && cooldownRemaining === 0;

  const addLog = useCallback((log: LogEntry) => {
    setLogs(prev => {
      const next = [...prev, log];
      if (next.length > 500) next.shift();
      return next;
    });

    setStats(prev => {
      const next = { ...prev, totalSent: prev.totalSent + 1 };
      if (log.status === RequestStatus.SUCCESS) next.success++;
      if (log.status === RequestStatus.FAILED) next.failed++;
      if (log.status === RequestStatus.RATE_LIMITED) next.rateLimited++;
      return next;
    });

    const name = log.serviceName;
    setActiveServices(prev => (prev.includes(name) ? prev : [...prev, name]));
    const existing = activeTimeoutsRef.current.get(name);
    if (existing) clearTimeout(existing);
    activeTimeoutsRef.current.set(
      name,
      setTimeout(() => {
        activeTimeoutsRef.current.delete(name);
        setActiveServices(prev => prev.filter(s => s !== name));
      }, 400),
    );
  }, []);

  const applyResult = useCallback(
    (endpointId: string, result: LogEntry) => {
      addLog(result);
      setEndpointHealth(prev =>
        prev.map(health =>
          health.id === endpointId
            ? {
                ...health,
                status:
                  result.status === RequestStatus.SUCCESS
                    ? 'working'
                    : result.status === RequestStatus.RATE_LIMITED
                      ? 'limited'
                      : 'dead',
                upstreamStatus: Number(result.message.match(/\b(\d{3})\b/)?.[1] ?? 0),
              }
            : health,
        ),
      );
    },
    [addLog],
  );

  /**
   * TEK GEÇİŞ: yetkili her uç noktaya tam olarak bir istek, sıralı olarak.
   * Döngü yok, paralel havuz yok, proxy yok — bitince durur.
   */
  const handleRun = useCallback(async () => {
    if (!canRun) return;

    setIsRunning(true);
    setLogs([]);
    setStats(INITIAL_STATS);
    setEndpointHealth(initialHealth());
    setLastRunAt(Date.now());

    const abort = new AbortController();
    abortRef.current = abort;

    for (const endpoint of AUTHORIZED_ENDPOINTS) {
      if (abort.signal.aborted) break;
      const result = await runSmokeTest(endpoint, { phone: target, email, signal: abort.signal });
      applyResult(endpoint.id, result);
      if (abort.signal.aborted) break;
      await sleep(STEP_DELAY_MS);
    }

    setIsRunning(false);
    abortRef.current = null;
  }, [applyResult, canRun, email, target]);

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setStats(INITIAL_STATS);
    setEndpointHealth(initialHealth());
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-900 rounded text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">OTP Smoke Test</h1>
              <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-400 font-mono">
                SINGLE PASS · NO PROXY
              </span>
              {isRunning && (
                <span className="px-2 py-0.5 bg-sky-900/40 border border-sky-800 rounded text-xs text-sky-300 font-mono animate-pulse">
                  ÇALIŞIYOR
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm mt-2 ml-1">
              {AUTHORIZED_ENDPOINTS.length} yetkili uç nokta · uç nokta başına 1 istek · {STEP_DELAY_MS / 1000}s arayla sıralı ·{' '}
              {RUN_COOLDOWN_MS / 1000}s bekleme
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border bg-zinc-900/50 border-zinc-800 text-zinc-400">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-sky-400' : 'bg-zinc-600'}`} />
              {isRunning ? 'Tek geçiş sürüyor' : 'Beklemede'}
            </div>
          </div>
        </header>

        <main className="space-y-6">
          <StatsBoard stats={stats} endpointHealth={endpointHealth} lastRunAt={lastRunAt} />

          {(!hasNumbers || !hasEndpoints) && (
            <div className="bg-amber-950/20 border border-amber-900/60 rounded-xl p-5 flex gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/90 space-y-2">
                <p className="font-semibold text-amber-300">Araç yapılandırılmadı — hiçbir istek gönderilmez.</p>
                {!hasEndpoints && (
                  <p>
                    <code className="font-mono text-amber-300">constants.ts</code> içindeki{' '}
                    <code className="font-mono text-amber-300">AUTHORIZED_ENDPOINTS</code> listesi boş. Yalnızca size ait ya da
                    yazılı izinli uç noktaları ekleyin.
                  </p>
                )}
                {!hasNumbers && (
                  <p>
                    <code className="font-mono text-amber-300">.env</code> içine{' '}
                    <code className="font-mono text-amber-300">VITE_AUTHORIZED_PHONE_NUMBERS=5XXXXXXXXX</code> ekleyin. Numara
                    listesi boşken araç istek atmaz.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <ControlPanel
                isRunning={isRunning}
                canRun={canRun}
                onRun={handleRun}
                onStop={handleStop}
                target={target}
                setTarget={setTarget}
                authorizedNumbers={AUTHORIZED_PHONE_NUMBERS}
                email={email}
                setEmail={setEmail}
                cooldownRemaining={cooldownRemaining}
                endpointCount={AUTHORIZED_ENDPOINTS.length}
              />

              <div className="h-[400px] lg:h-[450px] bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                <NetworkVisualizer
                  endpoints={AUTHORIZED_ENDPOINTS}
                  activeServices={activeServices}
                  endpointHealth={endpointHealth}
                />
              </div>
            </div>

            <div className="lg:col-span-8 h-[600px] lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
              <LogConsole logs={logs} onClear={handleClearLogs} />
            </div>
          </div>

          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Bu araç yalnızca kendi servislerinizin OTP akışını doğrulamak için tasarlandı. Üçüncü taraf sistemlerde izinsiz test
            Türkiye&apos;de TCK 243/244 kapsamına girebilir. Bir zafiyet bulduğunuzda doğru yol, ilgili şirketin bug-bounty
            programı ya da güvenlik iletişim adresi üzerinden sorumlu ifşadır.
          </p>
        </main>
      </div>
    </div>
  );
};

export default App;
