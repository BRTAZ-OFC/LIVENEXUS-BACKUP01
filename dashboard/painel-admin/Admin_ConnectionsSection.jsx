import { useState } from 'react';
import { Radio, Wifi, WifiOff, AlertTriangle, ShieldCheck, FlaskConical, RadioTower, Trash2 } from 'lucide-react';
import { isConnectionActive } from '@dashboard/configuracao/Config_StreamingContext';

const PLATFORMS = ['Twitch', 'Kick', 'YouTube'];

const platformMeta = {
  Twitch: {
    icon: RadioTower,
    accent: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
    placeholder: 'Nome do canal (ex: gaules, alanzoka)',
  },
  Kick: {
    icon: Radio,
    accent: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    placeholder: 'Slug do canal (ex: xqc, coringa)',
  },
  YouTube: {
    icon: RadioTower,
    accent: 'border-red-400/30 bg-red-400/10 text-red-200',
    placeholder: 'Identificador do canal (ex: @gaules, URL ou Video ID)',
  },
};

export default function AdminConnectionsSection({
  connections = {},
  linkedChannels = {},
  adminTestIdentity = {},
  adminTestMode = {},
  onToggleAdminTest,
  onSetAdminTestIdentity,
  onClearConnections,
}) {
  const [clearedMessage, setClearedMessage] = useState(false);

  const handleClear = () => {
    if (typeof onClearConnections === 'function') {
      onClearConnections();
      setClearedMessage(true);
      setTimeout(() => setClearedMessage(false), 3000);
    }
  };

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <FlaskConical size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Conexões Administrativas</h2>
            <p className="text-xs text-slate-400">
              Conexão manual de canais e testes de streaming sem alterar o vínculo oficial do usuário
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-95"
          title="Desconecta todas as plataformas e limpa o cache de conexões"
        >
          <Trash2 size={15} />
          <span>{clearedMessage ? 'Conexões Limpas!' : 'Limpar Conexões'}</span>
        </button>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((platform) => {
          const config = connections[platform] || {};
          const meta = platformMeta[platform];
          const Icon = meta.icon;
          const isTestActive = adminTestMode[platform] || false;
          const testInput = adminTestIdentity[platform] || '';
          const linked = linkedChannels[platform];
          const officialChannel = linked?.status === 'verified' ? linked.channelIdentifier : null;
          const isActive = isConnectionActive(config.status);
          const isConnecting = config.status === 'connecting';
          const isConnected = config.status === 'connected';

          return (
            <article
              key={platform}
              className="rounded-2xl border border-amber-500/20 bg-[#0a0d15] p-5 space-y-4 transition hover:border-amber-500/30"
            >
              {/* Header do Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl border ${meta.accent}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{platform}</h3>
                    <p className="text-[11px] text-amber-300/80 font-medium">Modo Administrativo / Teste</p>
                  </div>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isTestActive && isConnected
                      ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                      : isConnecting
                      ? 'animate-pulse bg-amber-400'
                      : 'bg-slate-600'
                  }`}
                />
              </div>

              {/* Informação do canal oficial preservado */}
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-slate-500 shrink-0" />
                <span className="truncate">
                  Canal oficial vinculado: <strong className="text-slate-200">{officialChannel || 'Nenhum'}</strong>
                </span>
              </div>

              {/* Bloco de Ação do Teste */}
              {isTestActive ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      TESTE ADMIN ATIVO
                    </div>
                    <p className="truncate font-mono text-xs text-amber-200">{testInput}</p>
                    <p className="text-[10px] text-amber-300/70 pt-0.5">
                      Status da conexão: <span className="font-semibold uppercase">{config.status || 'ativo'}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleAdminTest(platform)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-400"
                  >
                    <WifiOff size={15} /> Desconectar teste
                  </button>
                </div>
              ) : isActive ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300">
                      <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                      CONEXÃO ATIVA DETECTADA
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Canal: <strong className="text-white">{config.channel || platform}</strong> ({config.status})
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleAdminTest(platform)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-semibold text-white transition active:scale-95 shadow"
                  >
                    <WifiOff size={15} /> Forçar Desconexão
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-400">Canal de teste manual</label>
                    <input
                      value={testInput}
                      onChange={(e) => onSetAdminTestIdentity(platform, e.target.value)}
                      placeholder={meta.placeholder}
                      disabled={isActive}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400/50 disabled:opacity-40"
                    />
                  </div>

                  <button
                    onClick={() => onToggleAdminTest(platform)}
                    disabled={isActive || !testInput.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Wifi size={15} /> Conectar canal de teste
                  </button>

                  <p className="text-center text-[10px] text-slate-500">
                    O teste se conecta diretamente ao chat sem substituir o canal oficial da conta.
                  </p>
                </div>
              )}

              {/* Erros da conexão se houver */}
              {config.error && (
                <p className="flex items-center gap-1.5 text-xs text-amber-300 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>{config.error}</span>
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
