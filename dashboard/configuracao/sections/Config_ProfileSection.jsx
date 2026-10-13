// ProfileSection — área de Perfil do usuário no LiveNexus.
// Exibe perfil do usuário, troca de avatar via Galeria e Alteração de Senha.
import React, { useState, useEffect } from 'react';
import { useAuth } from '@dashboard/login/AuthContext';
import { User, Camera, Save, X, Loader2, Pencil, Trash2, KeyRound, Check, AlertCircle } from 'lucide-react';
import { useAvatar, setAvatarUrl, removeAvatar } from '@dashboard/configuracao/avatar/Config_avatarStorageAdapter';
import GalleryPicker from '@dashboard/componentes/GalleryPicker';
import MetricasOverview from '../metricas/MetricasOverview';
import { MetricasCrescimento, MetricasAudiencia, MetricasEngajamento, MetricasMonetizacao } from '../metricas/MetricasSubmenus';


export default function ProfileSection() {
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarUrl = useAvatar();
  const [nameWarning, setNameWarning] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Estados da troca de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Estados da deleção de conta
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Inicializa campos do formulário a partir dos dados do usuário
  useEffect(() => {
    if (user) {
      setDisplayName(user.data?.display_name || user.full_name || '');
    }
  }, [user]);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { authClient } = await import('@dashboard/login/authClient');
      await authClient.deleteAccount();
      // O redirecionamento já é tratado no authClient.js
    } catch (err) {
      console.error('Falha ao deletar conta:', err);
      alert(err.message || 'Erro ao deletar conta. Tente novamente.');
      setDeletingAccount(false);
    }
  };

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > 8) return;
    const originalName = user?.data?.display_name || user?.full_name || '';
    if (trimmed === originalName) { setEditing(false); return; }
    setSaving(true);
    try {
      const newData = { ...(user.data || {}), display_name: trimmed };
      await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: newData }),
      });
      updateUser({ data: newData });
      setEditing(false);
      setNameWarning('');
    } catch (e) {
      console.error('Profile save failed:', e);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setDisplayName(user?.data?.display_name || user?.full_name || '');
    setEditing(false);
    setNameWarning('');
  };

  const handleSelectAvatar = async (url) => {
    setAvatarUrl(url);
    try {
      const newData = { ...(user.data || {}), avatar_url: url };
      await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: newData }),
      });
      updateUser({ data: newData });
    } catch (e) {
      console.error('Avatar save failed:', e);
    }
  };

  const handleRemoveAvatar = async () => {
    removeAvatar();
    try {
      const newData = { ...(user.data || {}), avatar_url: null };
      await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: newData }),
      });
      updateUser({ data: newData });
    } catch (e) {
      console.error('Avatar remove failed:', e);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPassError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem.');
      return;
    }

    setPassSaving(true);
    try {
      const res = await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!res.ok) {
        throw new Error('Erro ao alterar senha.');
      }
      setPassSuccess('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Falha ao alterar senha.');
    } finally {
      setPassSaving(false);
    }
  };

  const avatar = avatarUrl || user?.data?.avatar_url;
  const name = user?.data?.display_name || user?.full_name || user?.email || 'Usuário';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho do Perfil */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          {/* Avatar com Botão de Foto da Galeria */}
          <div className="relative shrink-0 group">
            {avatar ? (
              <img src={avatar} alt={name} className="h-20 w-20 rounded-full object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 ring-2 ring-violet-500/30">
                <User size={32} className="text-violet-300" />
              </div>
            )}
            {/* Botão de foto na foto do usuário para mudar da galeria */}
            <button
              onClick={() => setGalleryOpen(true)}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition hover:bg-violet-500 hover:scale-105"
              title="Mudar foto da galeria"
            >
              <Camera size={15} />
            </button>
            {avatar && (
              <button
                onClick={handleRemoveAvatar}
                className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                title="Remover foto"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Nome + Email */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {editing ? (
              <div>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.length > 8) {
                      setDisplayName(val.slice(0, 8));
                      setNameWarning('Excedeu o limite de 8 caracteres.');
                    } else {
                      setDisplayName(val);
                      setNameWarning('');
                    }
                  }}
                  placeholder="Nome de exibição"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-lg font-semibold text-white outline-none focus:border-violet-500"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[11px] ${nameWarning ? 'text-amber-400' : 'text-slate-500'}`}>
                    {nameWarning || '\u00A0'}
                  </span>
                  <span className="text-[11px] text-slate-500">{displayName.length}/8</span>
                </div>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-white truncate">{name}</h2>
            )}
            <p className="mt-0.5 text-sm text-slate-400 truncate">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="mt-1 inline-block rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-medium text-violet-300 border border-violet-500/30">
                Administrador
              </span>
            )}
          </div>

          {/* Botões Editar / Alterar Senha / Excluir Conta */}
          <div className="shrink-0">
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !displayName.trim() || displayName.trim().length > 8}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-violet-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  <X size={14} /> Cancelar
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <Pencil size={14} /> Editar perfil
                </button>
                <button
                  onClick={() => {
                    setPassError('');
                    setPassSuccess('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPasswordModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <KeyRound size={14} /> Alterar senha
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 size={14} /> Excluir conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegação de Métricas */}
      <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto pb-px">
        {['Visão Geral', 'Crescimento', 'Audiência', 'Engajamento', 'Monetização'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'text-violet-400 border-b-2 border-violet-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conteúdo Ativo */}
      <div className="mt-6">
        {activeTab === 'Visão Geral' && <MetricasOverview />}
        {activeTab === 'Crescimento' && <MetricasCrescimento />}
        {activeTab === 'Audiência' && <MetricasAudiencia />}
        {activeTab === 'Engajamento' && <MetricasEngajamento />}
        {activeTab === 'Monetização' && <MetricasMonetizacao />}
      </div>

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-violet-300" />
                <h3 className="text-lg font-semibold text-white">Alterar Senha</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {passError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertCircle size={14} />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
                <Check size={14} />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={passSaving || !newPassword || newPassword !== confirmPassword}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {passSaving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Atualizar Senha
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Deleção */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h4 className="text-lg font-bold text-white">Você realmente quer deletar sua conta?</h4>
              <p className="mt-2 text-sm text-slate-400">
                Esta ação é irreversível e você perderá acesso imediato ao sistema.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {deletingAccount ? <Loader2 size={16} className="animate-spin" /> : 'Sim, deletar minha conta'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Não, manter minha conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Galeria para Avatar */}
      <GalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleSelectAvatar}
        title="Escolher Foto da Galeria"
      />
    </div>
  );
}
