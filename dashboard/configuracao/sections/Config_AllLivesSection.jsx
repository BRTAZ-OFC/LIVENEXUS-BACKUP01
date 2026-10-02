// AllLivesSection — tela interna "TODAS AS LIVES".
import { useState, useRef } from 'react';
import { Radio, Loader2 } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { liveSessionService } from '@dashboard/configuracao/Config_liveSessionService';
import LiveSessionCard from '@dashboard/configuracao/Config_LiveSessionCard';
import LiveSessionDialog from '@dashboard/configuracao/Config_LiveSessionDialog';

export default function AllLivesSection() {
  const { sessions: lives, isLoading: loading, sessionRepo } = useNewUserDataCentral();
  const [openSession, setOpenSession] = useState(null);
  const [editSession, setEditSession] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const scrollRef = useRef(null);

  const handleWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    el.scrollTop += e.deltaY * 2;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await liveSessionService.deleteSession(deleteId, null);
      const updated = lives.filter(l => l.id !== deleteId);
      setLives(updated);
      setDeleteId(null);
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const handleDialogSave = (updated) => {
    const updatedList = lives.map(l => l.id === updated.id ? updated : l);
    setLives(updatedList);
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">TODAS AS LIVES</h2>
            <p className="text-xs text-slate-400">Histórico completo das suas transmissões gravadas</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
          {lives.length} {lives.length === 1 ? 'live' : 'lives'}
        </span>
      </div>

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3 custom-scrollbar"
      >
        {loading ? (
          <div className="flex items-center justify-center h-48 text-purple-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium text-slate-400">Carregando lives...</span>
          </div>
        ) : lives.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center">
            <Radio className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">Nenhuma live gravada no momento.</p>
          </div>
        ) : (
          lives.map((session) => (
            <LiveSessionCard
              key={session.id}
              session={session}
              onOpen={() => setOpenSession(session)}
              onEdit={() => setEditSession(session)}
              onDelete={() => setDeleteId(session.id)}
            />
          ))
        )}
      </div>

      {openSession && (
        <LiveSessionDialog
          session={openSession}
          readOnly
          onClose={() => setOpenSession(null)}
        />
      )}

      {editSession && (
        <LiveSessionDialog
          session={editSession}
          onClose={() => setEditSession(null)}
          onSave={handleDialogSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Excluir LiveSession</h3>
            <p className="text-xs text-slate-400">Tem certeza que deseja excluir esta transmissão do seu histórico?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
