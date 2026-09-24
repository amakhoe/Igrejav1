'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { SystemUser } from '@/lib/types';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Search, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  Sparkles,
  Users,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface UsersManagementTabProps {
  onNavigate?: (tab: string) => void;
}

export default function UsersManagementTab({ onNavigate }: UsersManagementTabProps) {
  const { 
    systemUser, 
    isAdmin, 
    createNewUser, 
    deleteSystemUser, 
    changeUserRole, 
    toggleUserActiveStatus, 
    resetUserPassword 
  } = useAuth();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'usuario'>('all');

  // Form states for creating a new user
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'usuario'>('usuario');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<SystemUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Escuta em tempo real da coleção system_users
  useEffect(() => {
    const q = query(collection(db, 'system_users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemUser));
      setUsers(list);
      setLoadingUsers(false);
    }, (error) => {
      console.error('Erro ao ler utilizadores:', error);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  const showFeedbackMsg = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 6000);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedbackMsg('error', 'Apenas administradores podem criar utilizadores.');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await createNewUser({
        name,
        email,
        password,
        role,
        phoneNumber
      });

      showFeedbackMsg('success', `Utilizador "${name}" (${role === 'admin' ? 'Administrador' : 'Utilizador Normal'}) criado com sucesso na base de dados!`);
      // Reset form
      setName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setRole('usuario');
      setIsFormOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showFeedbackMsg('error', err.message);
      } else {
        showFeedbackMsg('error', 'Ocorreu um erro ao criar o utilizador na base de dados.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRole = async (targetUser: SystemUser) => {
    const newRole = targetUser.role === 'admin' ? 'usuario' : 'admin';
    const confirmMessage = newRole === 'admin' 
      ? `Tem a certeza que deseja conceder privilégios totais de ADMINISTRADOR ao utilizador "${targetUser.name}"?`
      : `Tem a certeza que deseja retirar os privilégios e tornar "${targetUser.name}" um UTILIZADOR NORMAL (sem privilégios)?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await changeUserRole(targetUser.id, newRole);
      showFeedbackMsg('success', `Nível de acesso de "${targetUser.name}" alterado para ${newRole === 'admin' ? 'Administrador' : 'Utilizador Normal'}.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showFeedbackMsg('error', err.message);
      }
    }
  };

  const handleToggleActive = async (targetUser: SystemUser) => {
    const newStatus = !targetUser.active;
    const actionText = newStatus ? 'ativar' : 'desativar';

    if (!window.confirm(`Deseja ${actionText} o acesso de "${targetUser.name}" ao sistema?`)) return;

    try {
      await toggleUserActiveStatus(targetUser.id, newStatus);
      showFeedbackMsg('success', `Utilizador "${targetUser.name}" ${newStatus ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showFeedbackMsg('error', err.message);
      }
    }
  };

  const handleDeleteUser = async (targetUser: SystemUser) => {
    if (!window.confirm(`ATENÇÃO: Deseja eliminar permanentemente o utilizador "${targetUser.name}" da base de dados da igreja? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteSystemUser(targetUser.id);
      showFeedbackMsg('success', `Utilizador "${targetUser.name}" eliminado com sucesso.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showFeedbackMsg('error', err.message);
      }
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModalUser) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      alert('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    setResettingPassword(true);
    try {
      await resetUserPassword(resetModalUser.id, newPasswordInput.trim());
      showFeedbackMsg('success', `Palavra-passe de "${resetModalUser.name}" redefinida com sucesso.`);
      setResetModalUser(null);
      setNewPasswordInput('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showFeedbackMsg('error', err.message);
      }
    } finally {
      setResettingPassword(false);
    }
  };

  // Se o utilizador atual NÃO for administrador, exibe ecrã de restrição
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-[#e2eae5] text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0e1613]">Acesso Restrito a Administradores</h2>
        <p className="text-xs text-[#61776b] mt-2 leading-relaxed">
          O seu utilizador actual (<strong className="text-[#0e1613]">{systemUser?.email}</strong>) está registado com o perfil de <strong>Utilizador Normal</strong> (sem privilégios administrativos).
        </p>
        <p className="text-xs text-[#789384] mt-1">
          Apenas contas com papel de Administrador têm autorização para criar novos utilizadores e gerir permissões.
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-6 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            ← Voltar ao Dashboard
          </button>
        )}
      </div>
    );
  }

  // Filtragem dos utilizadores
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phoneNumber || '').includes(searchQuery);

    if (!matchesSearch) return false;

    if (roleFilter === 'admin') return u.role === 'admin';
    if (roleFilter === 'usuario') return u.role === 'usuario';
    return true;
  });

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalNormalUsers = users.filter(u => u.role === 'usuario').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e2eae5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Painel de Controlo de Acessos
            </span>
            <span className="text-xs text-[#61776b]">Base de Dados Firestore</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0e1613]">Criar &amp; Gerir Utilizadores</h1>
          <p className="text-xs text-[#61776b] mt-0.5">
            Crie novos utilizadores e escolha quem tem acesso de <strong>Administrador (Acesso Total)</strong> ou de <strong>Utilizador Normal (Sem Privilégios)</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isFormOpen
              ? 'bg-[#edf3f0] text-[#2c3d33] hover:bg-[#e1ece6]'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{isFormOpen ? 'Fechar Formulário' : '+ Novo Utilizador'}</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* FORM: Criar Novo Utilizador (Desdobrável ou Aberto) */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl border border-[#cbe1d3] shadow-md overflow-hidden animate-fadeIn">
          <div className="p-6 bg-gradient-to-r from-[#f0f7f3] to-[#fafdfb] border-b border-[#e2ece5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0e1613]">Adicionar Novo Utilizador à Base de Dados</h2>
                <p className="text-xs text-[#61776b]">Defina as credenciais de login e o nível de privilégio</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-semibold text-[#61776b] hover:text-[#0e1613] px-2.5 py-1 rounded-lg hover:bg-white cursor-pointer"
            >
              ✕ Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="p-6 sm:p-8 space-y-6">
            
            {/* Linha 1: Nome e Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#203127] mb-1.5">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Mabunda Sitoe"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#203127] mb-1.5">
                  E-mail de Acesso (Login) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: maria.sitoe@igreja ou maria@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
                <p className="text-[10px] text-[#71877b] mt-1">Este e-mail será usado no ecrã de início de sessão.</p>
              </div>
            </div>

            {/* Linha 2: Palavra-passe e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#203127]">
                    Palavra-passe de Acesso <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gerar Senha</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#738a7e] hover:text-[#0e1613] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#203127] mb-1.5">
                  Número de Telefone / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Linha 3: ESCOLHA DE PRIVILÉGIOS (ADMIN vs USUÁRIO NORMAL) */}
            <div>
              <label className="block text-xs font-bold text-[#203127] mb-2">
                Nível de Privilégio &amp; Tipo de Utilizador <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Opção 1: Utilizador Normal (Sem privilégios) */}
                <div 
                  onClick={() => setRole('usuario')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    role === 'usuario'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-[#dce6df] hover:border-[#b8cfc0] bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'usuario' ? 'bg-emerald-600 text-white' : 'bg-[#eef3f0] text-[#556e60]'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#0e1613]">Utilizador Normal</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                          Sem Privilégios
                        </span>
                      </div>
                      <p className="text-[11px] text-[#576e62] mt-1 leading-relaxed">
                        Acesso estritamente de consulta/visualização. Não pode criar ou excluir utilizadores, nem alterar registos financeiros ou configurações da igreja.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opção 2: Administrador (Acesso total) */}
                <div 
                  onClick={() => setRole('admin')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    role === 'admin'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-[#dce6df] hover:border-[#b8cfc0] bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'admin' ? 'bg-emerald-600 text-white' : 'bg-[#eef3f0] text-[#556e60]'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#0e1613]">Administrador</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">
                          Acesso Total
                        </span>
                      </div>
                      <p className="text-[11px] text-[#576e62] mt-1 leading-relaxed">
                        Pode criar e gerir utilizadores, conceder privilégios, gerir finanças (ofertas/dízimos), registar/eliminar membros e cultos.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Ação de Submissão */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#eaf0ec]">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-[#5a7266] hover:text-[#0e1613] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A registar na base de dados...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Registar Utilizador</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e2eae5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#61776b] font-medium">Total de Utilizadores</p>
            <h3 className="text-2xl font-bold text-[#0e1613] mt-1">{users.length}</h3>
            <span className="text-[10px] text-[#71877b]">Registo no Firestore</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#f0f6f2] flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e2eae5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#61776b] font-medium">Administradores (Acesso Total)</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{totalAdmins}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold">Com privilégios totais</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e2eae5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#61776b] font-medium">Utilizadores Normais</p>
            <h3 className="text-2xl font-bold text-zinc-700 mt-1">{totalNormalUsers}</h3>
            <span className="text-[10px] text-zinc-500 font-semibold">Sem nenhum privilégio</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2eae5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              roleFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#f0f4f2] text-[#4d6356] hover:bg-[#e4ece7]'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              roleFilter === 'admin'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#f0f4f2] text-[#4d6356] hover:bg-[#e4ece7]'
            }`}
          >
            Administradores ({totalAdmins})
          </button>
          <button
            onClick={() => setRoleFilter('usuario')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              roleFilter === 'usuario'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#f0f4f2] text-[#4d6356] hover:bg-[#e4ece7]'
            }`}
          >
            Utilizadores Normais ({totalNormalUsers})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#738a7e]" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#f7faf8] border border-[#d6e3db] rounded-xl text-[#0e1613] placeholder-[#7a9486] focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-3xl border border-[#e2eae5] shadow-xs overflow-hidden">
        {loadingUsers ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#61776b]">A carregar utilizadores da base de dados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-[#8ba395] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#2c3d33]">Nenhum utilizador encontrado</p>
            <p className="text-xs text-[#71877b] mt-1">Ajuste os filtros ou adicione um novo utilizador no botão acima.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf3ef]">
            {filteredUsers.map((u) => {
              const isCurrentUser = u.id === systemUser?.id;
              const isUserAdmin = u.role === 'admin';

              return (
                <div 
                  key={u.id} 
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    !u.active ? 'bg-zinc-50/70 opacity-75' : 'hover:bg-[#fafcfb]'
                  }`}
                >
                  {/* Left: Avatar & User Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                        isUserAdmin
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-500/40'
                          : 'bg-gradient-to-tr from-zinc-500 to-slate-400 border-2 border-zinc-300'
                      }`}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name?.substring(0, 2).toUpperCase() || 'US'}</span>
                        )}
                      </div>
                      <span className={`w-3 h-3 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                        u.active ? 'bg-emerald-500' : 'bg-zinc-400'
                      }`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#0e1613] truncate">{u.name}</h4>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                            Sua Conta
                          </span>
                        )}
                        {!u.active && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                            Inativo
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#61776b]">
                        <span className="font-mono text-[#26372d]">{u.email}</span>
                        {u.phoneNumber && (
                          <span>• {u.phoneNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Role Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isUserAdmin ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ADMINISTRADOR</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span>UTILIZADOR NORMAL</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    
                    {/* Role Toggle Button */}
                    <button
                      onClick={() => handleToggleRole(u)}
                      disabled={isCurrentUser}
                      title={isCurrentUser ? "Não pode alterar o seu próprio papel" : isUserAdmin ? "Tornar Utilizador Normal" : "Promover a Administrador"}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isUserAdmin
                          ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isUserAdmin ? 'Tornar Normal' : 'Promover a Admin'}
                    </button>

                    {/* Reset Password Button */}
                    <button
                      onClick={() => {
                        setResetModalUser(u);
                        setNewPasswordInput('');
                      }}
                      title="Redefinir palavra-passe"
                      className="p-2 rounded-xl text-[#526a5d] hover:text-[#0e1613] bg-[#f2f6f4] hover:bg-[#e4ede7] transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* Active/Deactivate Button */}
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={isCurrentUser}
                      title={isCurrentUser ? "Não pode desativar a sua própria conta" : u.active ? "Desativar conta" : "Ativar conta"}
                      className={`p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        u.active 
                          ? 'text-[#526a5d] hover:text-amber-600 bg-[#f2f6f4] hover:bg-amber-50' 
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {u.active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={isCurrentUser}
                      title={isCurrentUser ? "Não pode eliminar a sua própria conta" : "Eliminar utilizador"}
                      className="p-2 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Redefinir Palavra-passe */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#dce8e0] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0e1613]">Redefinir Palavra-passe</h3>
                <p className="text-xs text-[#61776b]">Utilizador: <strong className="text-[#0e1613]">{resetModalUser.name}</strong></p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#203127] mb-1.5">
                Nova Palavra-passe
              </label>
              <input
                type="text"
                placeholder="Insira a nova palavra-passe (mín. 6 caracteres)..."
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-[#71877b] mt-1">
                A nova palavra-passe é gravada diretamente na base de dados e entra em vigor no próximo login.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#edf3ef]">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5a7266] hover:text-[#0e1613] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resettingPassword}
                onClick={handleConfirmResetPassword}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
              >
                {resettingPassword ? 'A gravar...' : 'Guardar Nova Palavra-passe'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
