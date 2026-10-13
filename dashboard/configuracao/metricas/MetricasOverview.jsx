import React, { useEffect, useState } from 'react';
import { metricasRamal } from '../../conexao/ramal/metricas_ramal';
import { useAuth } from '@dashboard/login/AuthContext';

export default function MetricasOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user?.id) {
        metricasRamal('list', user.id).then(setData);
    }
  }, [user]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Visão Geral das Métricas</h3>
      <p className="text-sm text-slate-400">
        Registros totais: {data ? data.length : 'Carregando...'}
      </p>
    </div>
  );
}
