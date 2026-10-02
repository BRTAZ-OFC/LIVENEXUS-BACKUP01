import React, { useEffect, useState } from 'react';
import { triggerReloadRTC } from '@dashboard/conexao/rtc/ReloadRTC';

const zones = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : ['America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon', 'UTC'];

export default function ManualWidgetConfig({ instance, onUpdateInstance }) {
  const id = instance.widgetId;
  const config = instance.config || {};
  const save = patch => onUpdateInstance(instance.id, { config: { ...config, ...patch } });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (id !== 'manual-timer' || !config.timerRunning) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [id, config.timerRunning]);

  if (id === 'manual-pix-widget') {
    const title = config.title || 'Apoie com Pix';
    const pixKey = config.pixKey || '';
    const pixName = config.pixName || 'LIVENEXUS STREAMER';
    const pixCity = config.pixCity || 'SAO PAULO';
    const pixAmount = config.pixAmount || '';

    const handleSavePix = (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const testTitle = formData.get('title') || 'Apoie com Pix';
      const testKey = formData.get('pixKey') || '';
      const testName = formData.get('pixName') || 'LIVENEXUS STREAMER';
      const testCity = formData.get('pixCity') || 'SAO PAULO';
      const testAmount = formData.get('pixAmount') || '';

      save({
        title: testTitle,
        pixKey: testKey,
        pixName: testName,
        pixCity: testCity,
        pixAmount: testAmount
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('livenexus:trigger-tempo-visivel', {
          detail: { instanceId: instance.id }
        }));
      }
    };

    return (
      <form key={instance.id} onSubmit={handleSavePix} className="space-y-3 text-xs text-slate-300">
        <span className="block font-semibold text-white text-sm">Configuração do Pix</span>
        
        <label className="block space-y-1">
          <span className="text-slate-400 font-medium">Título do Widget</span>
          <input
            type="text"
            name="title"
            defaultValue={title}
            placeholder="Ex: Apoie com Pix"
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-slate-400 font-medium">Chave Pix (CPF, CNPJ, E-mail ou Aleatória)</span>
          <input
            type="text"
            name="pixKey"
            defaultValue={pixKey}
            placeholder="Digite sua chave Pix"
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-slate-400 font-medium">Valor do Pix (Opcional - ex: 5.00 ou 10)</span>
          <input
            type="text"
            name="pixAmount"
            defaultValue={pixAmount}
            placeholder="Deixe em branco para o pagador digitar"
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1 font-medium">
            <span className="text-slate-400">Nome</span>
            <input
              type="text"
              name="pixName"
              defaultValue={pixName}
              placeholder="Nome"
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
            />
          </label>
          <label className="block space-y-1 font-medium">
            <span className="text-slate-400">Cidade</span>
            <input
              type="text"
              name="pixCity"
              defaultValue={pixCity}
              placeholder="Ex: SAO PAULO"
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full mt-2 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold py-2 transition"
        >
          Gerar QR Code &amp; Salvar
        </button>

        <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
          O QR Code Pix é gerado localmente em conformidade com o Banco Central e acionado pelo comando de chat <strong className="text-purple-400 font-mono">!pix</strong>.
        </p>
      </form>
    );
  }

  if (id === 'manual-death-counter') {
    const count = Math.max(0, Number(config.deathCount) || 0);
    const handleDelta = (delta) => {
      const next = Math.max(0, count + delta);
      save({ deathCount: next });
      triggerReloadRTC('visual-button-death-counter');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('livenexus:death-counter-updated', {
            detail: { count: next, instanceId: instance.id, timestamp: Date.now() }
          })
        );
      }
    };
    const handleReset = () => {
      save({ deathCount: 0 });
      triggerReloadRTC('visual-button-death-counter');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('livenexus:death-counter-updated', {
            detail: { count: 0, instanceId: instance.id, timestamp: Date.now() }
          })
        );
      }
    };

    return (
      <div className="space-y-3 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="block font-semibold text-white">Contador de Mortes</span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-white/10">
            Numpad + / - / Del
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Diminuir mortes (-1)"
            onClick={() => handleDelta(-1)}
            className="flex-1 rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white font-bold hover:bg-slate-800 transition"
          >
            −1
          </button>
          <output className="min-w-14 text-center text-xl font-bold tabular-nums text-white bg-slate-950 px-3 py-1.5 rounded-lg border border-white/10">
            {count}
          </output>
          <button
            type="button"
            aria-label="Aumentar mortes (+1)"
            onClick={() => handleDelta(1)}
            className="flex-1 rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white font-bold hover:bg-slate-800 transition"
          >
            +1
          </button>
          <button
            type="button"
            aria-label="Zerar mortes (0)"
            onClick={handleReset}
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 hover:bg-rose-500/20 transition font-medium"
          >
            Zerar (Del)
          </button>
        </div>
      </div>
    );
  }

  if (id === 'multi-viewers-counter') {
    const showTotal = config.showTotal !== false;
    const showTwitch = config.showTwitch !== false;
    const showKick = config.showKick !== false;
    const showYouTube = config.showYouTube !== false;

    return (
      <div className="space-y-3 text-xs text-slate-300">
        <span className="block font-semibold">Configuração — Espectadores Multiplataforma</span>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Exibir Soma Total</span>
            <input
              type="checkbox"
              checked={showTotal}
              onChange={(e) => save({ showTotal: e.target.checked })}
              className="rounded border-white/20 bg-slate-900 text-violet-500 focus:ring-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Exibir Twitch</span>
            <input
              type="checkbox"
              checked={showTwitch}
              onChange={(e) => save({ showTwitch: e.target.checked })}
              className="rounded border-white/20 bg-slate-900 text-violet-500 focus:ring-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Exibir Kick</span>
            <input
              type="checkbox"
              checked={showKick}
              onChange={(e) => save({ showKick: e.target.checked })}
              className="rounded border-white/20 bg-slate-900 text-violet-500 focus:ring-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Exibir YouTube</span>
            <input
              type="checkbox"
              checked={showYouTube}
              onChange={(e) => save({ showYouTube: e.target.checked })}
              className="rounded border-white/20 bg-slate-900 text-violet-500 focus:ring-0"
            />
          </label>
        </div>
      </div>
    );
  }

  if (id === 'manual-clock') return <label className="block space-y-2 text-xs text-slate-300">
    <span>Fuso horário do relógio</span>
    <select value={config.timeZone || ''} onChange={event => save({ timeZone: event.target.value })}
      className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white">
      <option value="">Fuso do dispositivo</option>
      {!zones.includes('UTC') && <option value="UTC">UTC</option>}
      {zones.map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}
    </select>
  </label>;

  if (id !== 'manual-timer') return null;

  const duration = Math.max(0, Number(config.durationSeconds ?? 300));
  const remaining = config.timerRunning && Number.isFinite(Number(config.timerEndAt))
    ? Math.max(0, (Number(config.timerEndAt) - now) / 1000)
    : Math.max(0, Number(config.remainingSeconds ?? duration));
  const running = Boolean(config.timerRunning && remaining > 0);
  const updateDuration = (minutes, seconds) => {
    const total = Math.max(0, Math.floor(minutes) * 60 + Math.floor(seconds));
    save({ durationSeconds: total, remainingSeconds: total, timerRunning: false, timerEndAt: null });
  };
  const start = () => {
    const seconds = remaining > 0 ? remaining : duration;
    if (seconds <= 0) return;
    const currentTime = Date.now();
    setNow(currentTime);
    save({ timerRunning: true, timerEndAt: currentTime + seconds * 1000, remainingSeconds: seconds });
  };
  const pause = () => save({ timerRunning: false, remainingSeconds: remaining, timerEndAt: null });
  const reset = () => save({ timerRunning: false, remainingSeconds: duration, timerEndAt: null });
  return <div className="space-y-2 text-xs text-slate-300">
    <span>Tempo inicial do temporizador</span>
    <div className="grid grid-cols-2 gap-2">
      <label className="space-y-1"><span className="block">Minutos</span>
        <input type="number" min="0" max="9999" value={Math.floor(duration / 60)}
          onChange={event => updateDuration(Number(event.target.value) || 0, duration % 60)}
          className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white" />
      </label>
      <label className="space-y-1"><span className="block">Segundos</span>
        <input type="number" min="0" max="59" value={duration % 60}
          onChange={event => updateDuration(Math.floor(duration / 60), Math.min(59, Number(event.target.value) || 0))}
          className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white" />
      </label>
    </div>
    <div className="flex items-center gap-2 pt-1">
      <output className="min-w-16 text-base font-bold tabular-nums text-white">{Math.ceil(remaining)}s</output>
      <button type="button" onClick={running ? pause : start} disabled={!running && duration <= 0}
        className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50">
        {running ? 'Pausar' : 'Iniciar'}
      </button>
      <button type="button" onClick={reset}
        className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white hover:bg-slate-800">Resetar</button>
    </div>
  </div>;
}
