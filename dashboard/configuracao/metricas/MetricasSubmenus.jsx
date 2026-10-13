import React from 'react';

export const MetricasCrescimento = () => (
  <div className="p-6 text-white">
    <h3 className="text-lg font-bold mb-4">Crescimento</h3>
    <p className="text-white/60">Acompanhamento de seguidores, inscritos e membros.</p>
  </div>
);

export const MetricasAudiencia = () => (
  <div className="p-6 text-white">
    <h3 className="text-lg font-bold mb-4">Audiência</h3>
    <p className="text-white/60">Histórico de espectadores por transmissão.</p>
  </div>
);

export const MetricasEngajamento = () => (
  <div className="p-6 text-white">
    <h3 className="text-lg font-bold mb-4">Engajamento</h3>
    <p className="text-white/60">Análise de mensagens e atividade.</p>
  </div>
);

export const MetricasMonetizacao = () => (
  <div className="p-6 text-white">
    <h3 className="text-lg font-bold mb-4">Monetização</h3>
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Placeholder para métricas financeiras */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <p className="text-sm text-white/60">Total (Financeiro)</p>
          <p className="text-xl font-bold text-emerald-400">R$ 0,00</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <p className="text-sm text-white/60">Bits (Twitch)</p>
          <p className="text-xl font-bold text-violet-400">0</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <p className="text-sm text-white/60">Super Chats</p>
          <p className="text-xl font-bold text-sky-400">0</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <p className="text-sm text-white/60">Assinaturas</p>
          <p className="text-xl font-bold text-amber-400">0</p>
        </div>
      </div>
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h4 className="text-md font-semibold mb-2">Histórico</h4>
        <p className="text-white/60 text-sm">Nenhum evento registrado no período.</p>
      </div>
    </div>
  </div>
);
