export const platformColors = {
  Twitch: { dot: 'bg-violet-500', text: 'text-violet-300' },
  Kick: { dot: 'bg-emerald-500', text: 'text-emerald-300' },
  YouTube: { dot: 'bg-red-500', text: 'text-red-300' },
  Teste: { dot: 'bg-slate-500', text: 'text-slate-300' },
};

export const colorOf = (p) => platformColors[p] || platformColors.Teste;