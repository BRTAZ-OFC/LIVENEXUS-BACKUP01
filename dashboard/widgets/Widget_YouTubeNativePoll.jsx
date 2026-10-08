import React from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';

// A enquete nativa é um evento do fluxo global, independente de comandos de chat.
export default function YouTubeNativePoll({ config = {}, elementKey = 'full_widget' }) {
  const { liveActivity } = useStreaming();
  const poll = (liveActivity?.items || []).find(item =>
    item.platform === 'YouTube' && item.eventType === 'youtube_poll'
  );
  const meta = poll?.eventMeta || {};
  const question = meta.question || meta.title || poll?.text;
  const options = Array.isArray(meta.options) ? meta.options : [];

  if (!poll) return (
    <div className="flex h-full items-center justify-center text-xs text-slate-400">
      Aguardando enquete do YouTube
    </div>
  );

  const title = <div className="font-semibold text-white break-words">{question || 'Enquete do YouTube'}</div>;
  const choices = options.length ? (
    <div className="space-y-1.5">
      {options.map((option, index) => {
        const label = typeof option === 'string' ? option : option.text || option.label || option.title;
        const votes = typeof option === 'object' && option !== null ? option.voteCount ?? option.votes : null;
        return (
          <div key={typeof option === 'object' && option !== null ? option.id ?? index : index}
            className="flex justify-between gap-3 rounded-md bg-white/10 px-2.5 py-1.5 text-slate-100">
            <span className="break-words">{label}</span>
            {votes != null && <span className="shrink-0 tabular-nums">{votes}</span>}
          </div>
        );
      })}
    </div>
  ) : null;
  const status = meta.status || null;

  if (elementKey === 'poll_question') return title;
  if (elementKey === 'poll_options') return choices;
  if (elementKey === 'poll_status') return status && <span className="text-slate-300">{status}</span>;

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto rounded-xl bg-slate-950/80 p-4 text-sm"
      style={{
        fontFamily: config.fontFamily || 'Inter, sans-serif',
        borderRadius: config.borderRadius || '0px'
      }}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">YouTube · Enquete nativa</span>
      {title}
      {choices}
      {status && <span className="text-xs text-slate-300">{status}</span>}
    </div>
  );
}
