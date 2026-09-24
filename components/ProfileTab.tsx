'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { SystemUser } from '@/lib/types';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Trash2, 
  Eye, 
  EyeOff,
  Database,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';

interface ProfileTabProps {
  onBackToDashboard?: () => void;
}

export default function ProfileTab({ onBackToDashboard }: ProfileTabProps) {
  const { systemUser, loading, updateUserProfile } = useAuth();

  if (loading || !systemUser) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-2xl border border-[#e2eae5]">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#61776b]">A carregar dados do perfil a partir da base de dados...</p>
      </div>
    );
  }

  return (
    <ProfileFormContent 
      key={systemUser.id + '-' + (systemUser.email || '')} 
      user={systemUser} 
      onBackToDashboard={onBackToDashboard}
      updateUserProfile={updateUserProfile}
    />
  );
}

interface ProfileFormContentProps {
  user: SystemUser;
  onBackToDashboard?: () => void;
  updateUserProfile: (payload: {
    name?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
    photoURL?: string;
  }) => Promise<void>;
}

function ProfileFormContent({ user, onBackToDashboard, updateUserProfile }: ProfileFormContentProps) {
  const [name, setName] = useState(user.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState(user.password || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregamento e compressão da foto para Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecione um ficheiro de imagem válido (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('A imagem é muito grande. Escolha uma foto com menos de 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensiona para max 300x300 px para guardar de forma leve no Firestore
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Url = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoURL(base64Url);
          setSuccessMessage('Foto preparada. Clique em "Guardar na Base de Dados" para confirmar.');
          setErrorMessage(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setErrorMessage('O nome do administrador é obrigatório.');
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('O e-mail é obrigatório.');
      setLoading(false);
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('A palavra-passe não pode ficar em branco.');
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('A palavra-passe deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      await updateUserProfile({
        name: cleanName,
        phoneNumber: cleanPhone,
        email: cleanEmail,
        password: cleanPassword,
        photoURL
      });

      const nowTime = new Date().toLocaleTimeString('pt-MZ');
      setLastSavedAt(nowTime);
      setSuccessMessage(`Perfil e credenciais guardados com sucesso na base de dados às ${nowTime}!`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 7000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Erro ao gravar as alterações na base de dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (n: string) => {
    if (!n) return 'AD';
    const parts = n.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e2eae5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Segurança &amp; Conta
            </span>
            <span className="text-xs text-[#61776b]">Base de Dados Firestore</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0e1613]">
            {user.role === 'admin' ? 'Editar Perfil do Administrador' : 'Editar Perfil de Utilizador'}
          </h1>
          <p className="text-xs text-[#61776b] mt-0.5">
            As alterações gravadas aqui atualizam directamente o seu registo na base de dados da igreja.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 text-xs font-semibold text-[#394a40] hover:text-[#0e1613] bg-[#f2f6f4] hover:bg-[#e7ece9] rounded-xl transition-colors cursor-pointer"
          >
            ← Voltar ao Dashboard
          </button>
        )}
      </div>

      {/* Database State Banner */}
      <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#dce8e0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[#3c5044] font-medium">Documento na Base de Dados: </span>
            <span className="font-mono text-[#0e1613] font-bold">system_users/{user.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#566f61]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sincronização em Tempo Real Activa</span>
          {lastSavedAt && (
            <span className="text-emerald-700 font-medium font-mono">• Última gravação: {lastSavedAt}</span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-2xl border border-[#e2eae5] shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Foto de Perfil */}
          <div>
            <h2 className="text-sm font-bold text-[#0e1613] mb-1">Foto de Perfil do Administrador</h2>
            <p className="text-xs text-[#61776b] mb-4">
              A foto é guardada directamente na base de dados e reflecte na barra lateral e em todo o sistema.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#f8faf9] border border-[#eaf0ec]">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-emerald-500/40 bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {photoURL ? (
                    <img 
                      src={photoURL} 
                      alt="Foto de Perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(name)}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Alterar foto"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-500 transition-transform active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons for Photo */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Carregar Nova Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-2 text-xs font-semibold text-[#445b4f] hover:text-[#182a20] bg-white border border-[#d2ded7] hover:bg-[#f1f6f3] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Inserir Link de Imagem</span>
                  </button>

                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>

                {showUrlInput && (
                  <div className="mt-3">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-[#c8d8ce] rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <p className="text-[11px] text-[#71877b]">
                  A imagem é otimizada e guardada no registo da base de dados Firestore.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-[#eef3f0]" />

          {/* Section 2: Dados Pessoais e de Contacto */}
          <div>
            <h2 className="text-sm font-bold text-[#0e1613] mb-4">Informações Pessoais &amp; Contactos</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-[#2d3f35] mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do administrador"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-[#2d3f35] mb-1.5">
                  Número de Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+258 84 100 2026"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Cargo / Papel Litúrgico (Informativo) */}
              <div>
                <label className="block text-xs font-bold text-[#2d3f35] mb-1.5">
                  Nível de Acesso &amp; Privilégios
                </label>
                <div className={`flex items-center gap-2 p-2.5 border rounded-xl text-xs ${
                  user.role === 'admin'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}>
                  <ShieldCheck className={`w-4 h-4 ${user.role === 'admin' ? 'text-emerald-600' : 'text-zinc-500'}`} />
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    {user.role === 'admin' ? 'Administrador • Acesso Total' : 'Utilizador Normal • Sem Privilégios'}
                  </span>
                </div>
              </div>

              {/* Estado do Acesso */}
              <div>
                <label className="block text-xs font-bold text-[#2d3f35] mb-1.5">
                  Estado do Registo
                </label>
                <div className="flex items-center justify-between p-2.5 bg-[#f5f8f6] border border-[#d8e3dc] rounded-xl text-xs text-[#526a5d]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-medium text-[#1e2e26]">Ativo e Autorizado</span>
                  </div>
                  <span className="text-[10px] text-[#738a7e] font-mono">ID: {user.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[#eef3f0]" />

          {/* Section 3: Credenciais de Acesso (Email & Password) */}
          <div>
            <h2 className="text-sm font-bold text-[#0e1613] mb-1">Credenciais de Autenticação (Login)</h2>
            <p className="text-xs text-[#61776b] mb-4">
              Apenas o e-mail e a palavra-passe guardados aqui serão aceites no ecrã de início de sessão.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#2d3f35] mb-1.5">
                  Email de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="luciano.luis@igreja"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-[#71877b] mt-1">
                  Se alterar o e-mail, deve utilizá-lo no próximo início de sessão.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#2d3f35] mb-1.5">
                  Palavra-passe Registada
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738a7e]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Palavra-passe de acesso..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-[#cddad2] rounded-xl text-[#0e1613] placeholder-[#8a9f94] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#738a7e] hover:text-[#0e1613] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#71877b] mt-1">
                  Apenas esta palavra-passe será aceite no ecrã de login.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#eef3f0]">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-4 py-2.5 text-xs font-semibold text-[#5a7266] hover:text-[#0e1613] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>A gravar na base de dados...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar na Base de Dados</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
