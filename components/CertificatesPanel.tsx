import React from 'react';
import { Award, ExternalLink, Calendar } from 'lucide-react';
import { CERTIFICATES } from '../constants';

export const CertificatesPanel: React.FC = () => {
  return (
    <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
        <Award size={16} className="text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">Certificates</h2>
        <span className="ml-auto text-[10px] text-zinc-500 font-mono">{CERTIFICATES.length} Total</span>
      </div>

      <div className="space-y-2">
        {CERTIFICATES.map((cert) => (
          <a
            key={cert.id}
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500/70 shrink-0 group-hover:bg-emerald-400 transition-colors" />

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                {cert.title}
              </p>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{cert.issuer}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
                <Calendar size={10} />
                {cert.date}
              </span>
              <ExternalLink
                size={12}
                className="text-zinc-600 group-hover:text-zinc-300 transition-colors"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
