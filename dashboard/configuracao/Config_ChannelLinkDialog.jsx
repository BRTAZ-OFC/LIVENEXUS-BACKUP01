import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@dashboard/componentes/dialog';
import { Button } from '@dashboard/componentes/ui/button';
import { Input } from '@dashboard/componentes/ui/input';
import { Label } from '@dashboard/componentes/ui/label';
import { Copy, Check, Loader2, ExternalLink, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { channelVerify } from '@dashboard/configuracao/Config_channelVerify';
import { normalizeChannelInput, channelUrl, placeholderFor, hintFor } from '@dashboard/configuracao/Config_channelCode';
import { GerarCodigoVinculo } from '@dashboard/configuracao/gerar_cod/GerarCodigoVinculo';

const tutorials = {
  Twitch: [
    'Copie o código Live Nexus.',
    'Abra seu canal da Twitch.',
    'Entre nas configurações / edit profile.',
    'Coloque temporariamente o código na bio/descrição pública do canal.',
    'Salve.',
    'Volte ao Live Nexus.',
    'Clique em "Validar canal".',
    'Aguarde a confirmação.',
    'Após aprovado, o canal ficará vinculado à sua conta.',
  ],
  Kick: [
    'Copie o código Live Nexus.',
    'Abra seu perfil/canal da Kick.',
    'Edite a bio/descrição pública.',
    'Cole o código.',
    'Salve.',
    'Volte ao Live Nexus.',
    'Clique em "Validar canal".',
  ],
  YouTube: [
    'Copie o código Live Nexus.',
    'Abra as configurações do seu canal do YouTube.',
    'Cole o código temporariamente na descrição pública do canal.',
    'Salve.',
    'Volte ao Live Nexus.',
    'Clique em "Validar canal".',
    'Após aprovado, o canal ficará vinculado à sua conta.',
  ],
};

const accent = {
  Twitch: 'text-violet-300',
  Kick: 'text-emerald-300',
  YouTube: 'text-red-300',
};

export default function ChannelLinkDialog({ open, onOpenChange, platform, onVerified }) {
  const [step, setStep] = useState('input'); // input | pending | verifying | verified | error
  const [channelInput, setChannelInput] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [challengeKey, setChallengeKey] = useState('');
  const [code, setCode] = useState('');
  const [resolvedId, setResolvedId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setStep('input'); setChannelInput(''); setChallengeId(''); setChallengeKey('');
    setCode(''); setResolvedId(''); setError(''); setCopied(false); setLoading(false);
  }
  function close() { onOpenChange(false); setTimeout(reset, 200); }

  async function startLink() {
    setError('');
    const norm = normalizeChannelInput(platform, channelInput);
    if (!norm) {
      setError('Informe o nome do canal.');
      return;
    }
    setLoading(true);
    try {
      const r = await GerarCodigoVinculo.gerar({ platform, channelIdentifier: channelInput });
      setChallengeId(r.challengeId);
      setChallengeKey(r.challengeKey);
      setCode(r.verificationCode);
      setResolvedId(r.channelIdentifier);
      setStep('pending');
    } catch (e) { setError(e.message || 'Não foi possível gerar o código.'); }
    finally { setLoading(false); }
  }

  async function reemit() {
    setError(''); setLoading(true);
    try {
      const r = await GerarCodigoVinculo.reemitir(challengeKey);
      setChallengeId(r.challengeId);
      setCode(r.verificationCode);
      setCopied(false);
    } catch (e) { setError(e.message || 'Não foi possível gerar novo código.'); }
    finally { setLoading(false); }
  }

  async function validate() {
    setError(''); setStep('verifying'); setLoading(true);
    try {
      const r = await channelVerify.verify(platform, challengeId);
      setStep('verified');
      onVerified && onVerified({
        platform,
        channelIdentifier: r.channelIdentifier,
        channelUrl: channelUrl(platform, r.channelIdentifier),
        verifiedAt: r.verifiedAt,
        verificationProof: r.verificationProof,
        challengeKey,
      });
      setTimeout(close, 1200);
    } catch (e) {
      setError(e.message || 'Não foi possível validar o canal.');
      setStep('error');
    } finally { setLoading(false); }
  }

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }

  const steps = tutorials[platform];
  const url = channelUrl(platform, resolvedId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto no-scrollbar border border-white/10 bg-black/90 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <span className={accent[platform]}>●</span> Vincular canal — {platform}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Comprove que você é dono do canal colocando um código na bio pública.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Nome do canal</Label>
              <Input
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder={placeholderFor(platform)}
                autoFocus
                className="border-white/10 bg-black/50 text-white placeholder:text-slate-600"
              />
              <p className="text-[11px] text-slate-500">{hintFor(platform)}</p>
            </div>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <Button onClick={startLink} disabled={loading || !channelInput.trim()} className="w-full bg-violet-500 text-white hover:bg-violet-400">
              {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> {platform === 'YouTube' ? 'Verificando…' : 'Gerando código…'}</> : (platform === 'YouTube' ? 'Vincular canal' : 'Gerar código de vinculação')}
            </Button>
          </div>
        )}

        {(step === 'pending' || step === 'verifying' || step === 'verified' || step === 'error') && (
          <div className="space-y-5">
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              <p className="text-[11px] uppercase tracking-wider text-violet-300">Seu código Live Nexus</p>
              <div className="mt-2 flex items-center gap-3">
                <code className="flex-1 rounded-lg bg-black/60 px-3 py-2 font-mono text-lg font-bold tracking-widest text-white">{code}</code>
                <Button onClick={copyCode} variant="outline" className="border-white/10 bg-transparent text-slate-200 hover:bg-white/10">
                  {copied ? <><Check size={15} className="mr-1.5" /> Copiado</> : <><Copy size={15} className="mr-1.5" /> Copiar</>}
                </Button>
              </div>
              {resolvedId && (
                <p className="mt-2 text-[11px] text-slate-400">Canal informado: <span className="text-white">{resolvedId}</span></p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white">Como vincular seu canal</p>
              <ol className="space-y-1.5 text-[13px] text-slate-300">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-slate-500">{i + 1}.</span><span>{s}</span></li>
                ))}
              </ol>
              <p className="mt-3 rounded-lg bg-black/40 px-3 py-2 text-[11px] text-slate-400">
                Código esperado na bio: <span className="font-mono font-bold text-white">{code}</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Depois que o Live Nexus confirmar seu canal, você pode remover o código da sua bio.
              </p>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-violet-300 hover:underline">
                  <ExternalLink size={12} /> Abrir meu canal
                </a>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {step === 'verified' ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-200">
                  <ShieldCheck size={18} /> Canal verificado!
                </div>
              ) : (
                <Button onClick={validate} disabled={loading} className="w-full bg-violet-500 text-white hover:bg-violet-400">
                  {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Validando…</> : 'Validar canal'}
                </Button>
              )}
              {step !== 'verified' && (
                <Button onClick={reemit} disabled={loading} variant="outline" className="w-full border-white/10 bg-transparent text-slate-300 hover:bg-white/10">
                  <RefreshCw size={15} className="mr-2" /> Gerar novo código
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}