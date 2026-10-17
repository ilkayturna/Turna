import React from 'react';
import { Play, Square, ShieldCheck, Phone } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  canRun: boolean;
  onRun: () => void;
  onStop: () => void;
  target: string;
  setTarget: (val: string) => void;
  authorizedNumbers: string[];
  email: string;
  setEmail: (val: string) => void;
  cooldownRemaining: number;
  endpointCount: number;
}

const formatPhone = (national: string): string =>
  national.length === 10 ? `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 8)} ${national.slice(8)}` : national;

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  canRun,
  onRun,
  onStop,
  target,
  setTarget,
  authorizedNumbers,
  email,
  setEmail,
  cooldownRemaining,
  endpointCount,
}) => {
  return (
    <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
        <ShieldCheck size={16} className="text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">Yetkili Test Yapılandırması</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-2">Doğrulanmış Numara</label>
          {authorizedNumbers.length > 0 ? (
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={target}
                onChange={e => setTarget(e.target.value)}
                disabled={isRunning}
                className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 font-mono disabled:opacity-60"
              >
                {authorizedNumbers.map(number => (
                  <option key={number} value={number}>
                    {formatPhone(number)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full bg-zinc-900/60 border border-dashed border-zinc-800 rounded-lg px-3 py-2 text-zinc-600 text-xs font-mono">
              Numara tanımlı değil
            </div>
          )}
          <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
            Serbest numara girişi kapalı. Liste <span className="font-mono text-zinc-500">VITE_AUTHORIZED_PHONE_NUMBERS</span> ile
            tanımlanır; araç listede olmayan numaraya istek atmayı reddeder.
          </p>
        </div>

        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-2">Kendi E-postanız (opsiyonel)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isRunning}
            placeholder="siz@sirketiniz.example"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 font-mono placeholder:text-zinc-700 disabled:opacity-60"
          />
          <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
            Uç nokta e-posta alanı istiyorsa zorunludur; araç sahte adres üretmez.
          </p>
        </div>

        <div className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-3 py-2.5 border border-zinc-800 text-xs">
          <span className="text-zinc-400">Test edilecek uç nokta</span>
          <span className="font-mono text-zinc-300">{endpointCount}</span>
        </div>

        {cooldownRemaining > 0 && !isRunning && (
          <p className="text-[11px] text-amber-400/90 font-mono">
            Sonraki çalıştırma: {Math.ceil(cooldownRemaining / 1000)}s
          </p>
        )}

        <div className="pt-2">
          {isRunning ? (
            <button
              onClick={onStop}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
            >
              <Square size={16} fill="currentColor" /> Durdur
            </button>
          ) : (
            <button
              onClick={onRun}
              disabled={!canRun}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-lg text-sm transition-colors ${
                canRun
                  ? 'bg-white text-black hover:bg-zinc-200 shadow-sm'
                  : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <Play size={16} fill="currentColor" /> Tek Geçiş Smoke Test
            </button>
          )}
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-500 leading-relaxed">
          Bu araç döngü kurmaz, paralel istek atmaz, proxy kullanmaz. Bir çalıştırma = uç nokta başına tek istek.
        </div>
      </div>
    </div>
  );
};
