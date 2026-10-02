import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Mail, 
  Star, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function RecordDetailModal({
  isOpen,
  onClose,
  type, // 'sessions' | 'reviews' | 'contacts'
  record,
  onSave,
  onDelete,
  readOnly = false
}) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!record) return;
    setFormData({ ...record });
    setFeedback(null);
  }, [record, type]);

  if (!isOpen || !record) return null;

  const handleFieldChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      let payload = { ...formData };
      await onSave(payload);
      setFeedback({ type: 'success', text: 'Alterações salvas com sucesso no banco!' });
      setTimeout(() => {
        setFeedback(null);
      }, 3500);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Erro ao salvar: ' + (err.message || 'Falha na conexão') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setFeedback(null);
    try {
      await onDelete(record.id);
      onClose();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Erro ao excluir: ' + (err.message || 'Falha na conexão') });
      setIsDeleting(false);
    }
  };

  const typeLabels = {
    sessions: 'Sessão / VOD',
    reviews: 'Avaliação',
    contacts: 'Mensagem de Contato'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {typeLabels[type] || 'Registro'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {record.id || '—'}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 truncate">
              {record.name || record.title || (record.email ? `Mensagem de ${record.name}` : 'Detalhes do Registro')}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-3 text-xs ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-300">
          
          {/* Metadados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Data de Criação</p>
              <p className="text-xs font-mono text-slate-300 mt-0.5">
                {record.created_date ? new Date(record.created_date).toLocaleString('pt-BR') : '—'}
              </p>
            </div>
            {record.updated_date && (
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Última Atualização</p>
                <p className="text-xs font-mono text-slate-300 mt-0.5">
                  {new Date(record.updated_date).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* CAMPOS ESPECÍFICOS DE MENSAGENS / CONTATOS */}
          {type === 'contacts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria / Assunto</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status da Mensagem</label>
                  <select
                    value={formData.status || 'novo'}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="novo">Novo</option>
                    <option value="lido">Lido</option>
                    <option value="respondido">Respondido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mensagem Completa</label>
                <textarea
                  rows={5}
                  value={formData.message || ''}
                  disabled={readOnly}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-violet-500 leading-relaxed font-sans"
                />
              </div>

              {/* Botão de Resposta usando e-mail nativo (mailto) */}
              {formData.email && (
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-violet-400" />
                    <span className="text-xs text-violet-200">Responder remetente ({formData.email})</span>
                  </div>
                  <a
                    href={`mailto:${formData.email}?subject=${encodeURIComponent('Resposta LiveNexus — ' + (formData.category || 'Contato'))}&body=${encodeURIComponent('Olá ' + (formData.name || '') + ',\n\nRecebemos sua mensagem enviada através do LiveNexus:\n\n"' + (formData.message || '') + '"\n\nAtenciosamente,\nEquipe LiveNexus')}`}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    Abrir E-mail
                  </a>
                </div>
              )}
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS DE AVALIAÇÕES */}
          {type === 'reviews' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Avaliador</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nota (Classificação 1 a 5 estrelas)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleFieldChange('rating', star)}
                      className={`p-1.5 rounded transition ${
                        (formData.rating || 0) >= star ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      <Star size={20} fill={(formData.rating || 0) >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-white ml-2">{formData.rating || 0} de 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Comentário / Depoimento</label>
                <textarea
                  rows={4}
                  value={formData.message || ''}
                  disabled={readOnly}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-violet-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS DE SESSÕES / VODS */}
          {type === 'sessions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Título da Sessão</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Jogo / Categoria</label>
                  <input
                    type="text"
                    value={formData.game || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('game', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Plataforma</label>
                  <input
                    type="text"
                    value={formData.platform || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('platform', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status do VOD</label>
                  <select
                    value={formData.vodStatus || 'ready'}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('vodStatus', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="ready">Pronto / Ready</option>
                    <option value="processing">Processando</option>
                    <option value="live">Ao Vivo</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duração</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    disabled={readOnly}
                    onChange={(e) => handleFieldChange('duration', e.target.value)}
                    placeholder="Ex: 02:45:00"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL da Transmissão / VOD</label>
                <input
                  type="text"
                  value={formData.url || formData.vodUrl || ''}
                  disabled={readOnly}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0 bg-zinc-950/40">
          <div>
            {!readOnly && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Excluir Registro
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Fechar
            </button>
            {!readOnly && onSave && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDeleting || Boolean(jsonError)}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-violet-600/20"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar Alterações
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
