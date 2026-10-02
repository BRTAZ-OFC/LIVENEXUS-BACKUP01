import { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Filter } from 'lucide-react';
import { useReadingFilterConfig, setReadingFilterConfig, toggleUserBlock, clearFlaggedUser } from '@dashboard/configuracao/TTS_ttsReadingFilter';

function FilterRow({ checked, onChange, name, description }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer py-1">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-violet-500" />
      <div className="min-w-0">
        <div className="text-[13px] text-white leading-tight">{name}</div>
        {description && <div className="text-[11px] text-slate-500 leading-tight">{description}</div>}
      </div>
    </label>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-300">{title}</h3>
      {children}
    </div>
  );
}

function BannedWords() {
  const config = useReadingFilterConfig();
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const atBottomRef = useRef(true);
  const add = () => {
    const w = input.trim(); if (!w) return;
    setReadingFilterConfig({ ...config, bannedWords: [...config.bannedWords, w] }); setInput('');
  };
  const remove = (i) => setReadingFilterConfig({ ...config, bannedWords: config.bannedWords.filter((_, idx) => idx !== i) });
  const handleScroll = () => {
    const el = listRef.current; if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
  };
  useEffect(() => {
    const el = listRef.current; if (!el || !atBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [config.bannedWords.length]);
  return (
    <div className="flex flex-col">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-300">Palavras Proibidas</h3>
      <p className="mb-2 text-[11px] text-slate-500">Mensagens com estas palavras não são lidas. Sem distinção de maiúsculas.</p>
      <div className="flex gap-1.5">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="palavra ou frase" className="flex-1 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-[13px] text-white outline-none" />
        <button onClick={add} className="flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-600"><Plus size={13} /></button>
      </div>
      <div ref={listRef} onScroll={handleScroll} className="mt-2 space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '260px' }}>
        {config.bannedWords.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-slate-600">Nenhuma palavra adicionada.</p>
        ) : config.bannedWords.map((w, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-red-500/10 px-2.5 py-1 text-xs">
            <span className="truncate text-red-300">{w}</span>
            <button onClick={() => remove(i)} className="ml-2 shrink-0 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlaggedUsers() {
  const config = useReadingFilterConfig();
  const entries = Object.entries(config.flaggedUsers);
  const listRef = useRef(null);
  const atBottomRef = useRef(true);
  const handleScroll = () => {
    const el = listRef.current; if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
  };
  useEffect(() => {
    const el = listRef.current; if (!el || !atBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length]);
  return (
    <div className="flex flex-col">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-300">Usuários Sinalizados</h3>
      <p className="mb-2 text-[11px] text-slate-500">Detectados automaticamente por flood ou links. Marque para bloquear manualmente do TTS.</p>
      <div ref={listRef} onScroll={handleScroll} className="space-y-1.5 overflow-y-auto custom-scrollbar" style={{ maxHeight: '260px' }}>
        {entries.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-slate-600">Nenhum usuário sinalizado ainda.</p>
        ) : entries.map(([key, u]) => (
          <div key={key} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${u.blocked ? 'bg-red-500/15' : 'bg-white/5'}`}>
            <input type="checkbox" checked={u.blocked || false} onChange={() => toggleUserBlock(key)} className="h-3.5 w-3.5 shrink-0 rounded accent-red-500" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-white">{u.name}</div>
              <div className="flex gap-2 text-[10px] text-slate-500">
                {u.floodCount > 0 && <span className="text-amber-400">Flood: {u.floodCount}</span>}
                {u.linkCount > 0 && <span className="text-cyan-400">Links: {u.linkCount}</span>}
                <span className="text-slate-600">{u.platform}</span>
              </div>
            </div>
            <button onClick={() => clearFlaggedUser(key)} className="shrink-0 text-slate-500 hover:text-red-300"><Trash2 size={11} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AntiFloodControls() {
  const config = useReadingFilterConfig();
  return (
    <FilterGroup title="Anti-Flood e Intervalo">
      <div className="space-y-2">
        <div>
          <label className="text-[11px] text-slate-400">Repetições iguais toleradas: <b className="text-white">{config.floodLimit}</b></label>
          <input type="range" min="0" max="10" step="1" value={config.floodLimit} onChange={e => setReadingFilterConfig({ ...config, floodLimit: Number(e.target.value) })} className="mt-1 w-full accent-violet-500" />
          <p className="text-[10px] text-slate-600">0 = desativado. Acima do limite, a repetição é suprimida do TTS e conta como flood.</p>
        </div>
        <div className="border-t border-white/5 pt-2">
          <FilterRow checked={config.userCooldownEnabled} onChange={v => setReadingFilterConfig({ ...config, userCooldownEnabled: v })} name="Intervalo entre mensagens do mesmo usuário" description="Suprime mensagens muito seguidas sem bloquear permanentemente" />
          {config.userCooldownEnabled && (
            <div className="ml-7 mt-1">
              <label className="text-[11px] text-slate-400">Segundos: <b className="text-white">{config.userCooldownSec}s</b></label>
              <input type="range" min="1" max="30" step="1" value={config.userCooldownSec} onChange={e => setReadingFilterConfig({ ...config, userCooldownSec: Number(e.target.value) })} className="mt-1 w-full accent-violet-500" />
            </div>
          )}
        </div>
      </div>
    </FilterGroup>
  );
}

export default function FiltersSection() {
  const config = useReadingFilterConfig();
  const toggle = (group, key) => setReadingFilterConfig({ ...config, [group]: { ...config[group], [key]: !config[group][key] } });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-violet-300" />
        <h2 className="text-lg font-semibold text-white">Filtros de Leitura</h2>
      </div>
      <p className="text-[11px] text-slate-500">Marcado = permitido. Desmarcado = bloqueado. Tudo local, sem backend.</p>

      {/* Camada 1 — filtros compactos em grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <FilterGroup title="Quem Pode Ser Lido">
          <FilterRow checked={config.roles.normal} onChange={() => toggle('roles', 'normal')} name="Usuários comuns" description="Espectadores sem função especial" />
          <FilterRow checked={config.roles.moderator} onChange={() => toggle('roles', 'moderator')} name="Moderadores" description="Mensagens de moderadores" />
          <FilterRow checked={config.roles.subscriber} onChange={() => toggle('roles', 'subscriber')} name="Membros / Subscribers" description="Inscritos ou membros" />
          <FilterRow checked={config.roles.broadcaster} onChange={() => toggle('roles', 'broadcaster')} name="Streamer / Dono" description="Dono do canal" />
          <FilterRow checked={config.roles.vip} onChange={() => toggle('roles', 'vip')} name="VIP" description="Selo VIP (Twitch e Kick)" />
        </FilterGroup>

        <FilterGroup title="Conteúdo">
          <FilterRow checked={config.content.messages} onChange={() => toggle('content', 'messages')} name="Mensagens comuns" description="Texto do chat" />
          <FilterRow checked={config.content.links} onChange={() => toggle('content', 'links')} name="Links" description="Endereços web" />
          <FilterRow checked={config.content.mentions} onChange={() => toggle('content', 'mentions')} name="Menções" description="Menções (@)" />
          <FilterRow checked={config.content.commands} onChange={() => toggle('content', 'commands')} name="Comandos" description="Iniciados com !" />
        </FilterGroup>

        <FilterGroup title="Emotes">
          <FilterRow checked={config.emotes.Twitch} onChange={() => toggle('emotes', 'Twitch')} name="Twitch" description="Emotes da Twitch" />
          <FilterRow checked={config.emotes.YouTube} onChange={() => toggle('emotes', 'YouTube')} name="YouTube" description="Emojis e stickers" />
          <FilterRow checked={config.emotes.Kick} onChange={() => toggle('emotes', 'Kick')} name="Kick" description="Emotes do Kick" />
        </FilterGroup>

        <FilterGroup title="Eventos — Twitch">
          <FilterRow checked={config.twitchEvents.twitch_sub} onChange={() => toggle('twitchEvents', 'twitch_sub')} name="Sub" description="Nova inscrição" />
          <FilterRow checked={config.twitchEvents.twitch_resub} onChange={() => toggle('twitchEvents', 'twitch_resub')} name="Resub" description="Renovação" />
          <FilterRow checked={config.twitchEvents.twitch_subgift} onChange={() => toggle('twitchEvents', 'twitch_subgift')} name="Gift Sub" description="Inscrição presenteada" />
          <FilterRow checked={config.twitchEvents.twitch_bits} onChange={() => toggle('twitchEvents', 'twitch_bits')} name="Bits" description="Cheer" />
          <FilterRow checked={config.twitchEvents.twitch_raid} onChange={() => toggle('twitchEvents', 'twitch_raid')} name="Raid" description="Raid" />
        </FilterGroup>

        <FilterGroup title="Eventos — YouTube">
          <FilterRow checked={config.youtubeEvents.youtube_membership} onChange={() => toggle('youtubeEvents', 'youtube_membership')} name="Novo membro" description="Membership" />
          <FilterRow checked={config.youtubeEvents.youtube_superchat} onChange={() => toggle('youtubeEvents', 'youtube_superchat')} name="Super Chat" description="Mensagem paga" />
          <FilterRow checked={config.youtubeEvents.youtube_supersticker} onChange={() => toggle('youtubeEvents', 'youtube_supersticker')} name="Super Sticker" description="Sticker pago" />
        </FilterGroup>

        <AntiFloodControls />
      </div>

      {/* Camada 2 — duas colunas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="max-h-[380px] rounded-xl border border-white/10 bg-white/5 p-3">
          <FlaggedUsers />
        </div>
        <div className="max-h-[380px] rounded-xl border border-white/10 bg-white/5 p-3">
          <BannedWords />
        </div>
      </div>
    </div>
  );
}