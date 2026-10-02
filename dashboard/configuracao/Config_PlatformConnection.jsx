import { useState } from 'react';
import { Radio, Wifi, WifiOff, ShieldCheck, Link2, RefreshCw, AlertTriangle } from 'lucide-react';
import ChannelLinkDialog from '@dashboard/configuracao/Config_ChannelLinkDialog';
import RenewChannelDialog from '@dashboard/configuracao/Config_RenewChannelDialog';
import { channelVerify } from '@dashboard/configuracao/Config_channelVerify';

const accents = { Twitch: 'violet', Kick: 'emerald', YouTube: 'red' };
const classes = {
  violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  red: 'border-red-400/30 bg-red-400/10 text-red-200',
};

export default function PlatformConnection({ platform, config, onChange, onToggle, linked }) {
  const connected = config.status === 'connected';
  const connecting = config.status === 'connecting';
  const reconnecting = config.status === 'reconnecting';
  const rateLimited = config.status === 'rate_limited';
  const [linkOpen, setLinkOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const isLinked = linked?.status === 'verified';
  const linkedChannel = linked?.channelIdentifier;
  const invalid = linked?.status === 'invalid';

  async function handleVerified(data) {
    setLinkOpen(false);
    linked?.onVerified?.(data);
  }

  async function handleRenewConfirm() {
    console.log('[LIVENEXUS-RENEW] RENEW_CONFIRM_START', { platform, channelIdentifier: linkedChannel, status: linked?.status, ts: new Date().toISOString() });
    setRenewing(true);
    try {
      if (linked?.verificationProof) {
        await channelVerify.revoke(linked.verificationProof, linked.challengeKey).catch(() => {});
      }
      await linked?.onRenew?.(platform);
    } finally {
      setRenewing(false);
      setRenewOpen(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-black/80 p-4 transition hover:bg-white/[0.06]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl border ${classes[accents[platform]] || classes.violet}`}><Radio size={18}/></span>
          <div>
            <h3 className="font-semibold text-white">{platform}</h3>
            <p className="text-xs text-slate-400">
              {isLinked ? '✓ Canal vinculado' : invalid ? 'Vínculo inválido' : 'Canal não vinculado'}
            </p>
          </div>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${isLinked ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : connected ? 'bg-emerald-400' : rateLimited ? 'animate-pulse bg-amber-400' : reconnecting ? 'animate-pulse bg-amber-400' : connecting ? 'animate-pulse bg-amber-400' : 'bg-slate-600'}`}/>
      </div>

      {isLinked ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-100">
            <ShieldCheck size={15} className="text-emerald-300"/>
            <span className="truncate font-medium">{linkedChannel}</span>
          </div>
          <button onClick={onToggle} disabled={connecting} className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${connecting ? 'cursor-not-allowed bg-white/5 text-slate-600' : connected ? 'bg-white/10 text-slate-200 hover:bg-white/15' : 'bg-violet-500 text-white hover:bg-violet-400'}`}>
            {connected ? <WifiOff size={16}/> : <Wifi size={16}/>} {rateLimited ? 'Aguardando…' : reconnecting ? 'Reconectando…' : connecting ? 'Conectando…' : connected ? 'Desconectar' : 'Conectar'}
          </button>
          <button onClick={() => { console.log('[LIVENEXUS-RENEW] RENEW_CLICK', { platform, channelIdentifier: linkedChannel, status: linked?.status, ts: new Date().toISOString() }); setRenewOpen(true); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200">
            <RefreshCw size={13}/> Renovar canal
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {invalid && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-300"><AlertTriangle size={12}/> O vínculo salvo não é mais válido. Vincule novamente.</p>
          )}
          <button onClick={() => setLinkOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20">
            <Link2 size={16}/> Vincular canal
          </button>
          <p className="text-center text-[11px] text-slate-600">A conexão ao chat exige canal verificado.</p>
        </div>
      )}

      {config.error && <p className={`mt-2 text-xs ${connecting || reconnecting || rateLimited ? 'text-amber-300' : 'text-red-300'}`}>{config.error}</p>}

      <ChannelLinkDialog open={linkOpen} onOpenChange={setLinkOpen} platform={platform} onVerified={handleVerified} />
      <RenewChannelDialog open={renewOpen} onOpenChange={setRenewOpen} platform={platform} channelIdentifier={linkedChannel} onConfirm={handleRenewConfirm} loading={renewing} />
    </article>
  );
}