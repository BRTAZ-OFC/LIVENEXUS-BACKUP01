// Helper para manipulação de histórico de métricas
// Futuramente integrado a um storage persistente
export const metricsStorage = {
  saveMetric: (category, data) => {
    const history = JSON.parse(localStorage.getItem(`ln_metrics_${category}`) || '[]');
    history.push({ ...data, timestamp: Date.now() });
    localStorage.setItem(`ln_metrics_${category}`, JSON.stringify(history.slice(-100))); // Mantém histórico recente
  },
  getHistory: (category) => {
    return JSON.parse(localStorage.getItem(`ln_metrics_${category}`) || '[]');
  }
};
