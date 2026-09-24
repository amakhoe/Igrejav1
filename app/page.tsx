'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { 
  Users, 
  Wallet, 
  Calendar, 
  BarChart3, 
  Menu,
  X,
  Church,
  Sparkles,
  Search,
  ChevronDown,
  LogOut,
  CalendarDays,
  Users2,
  UserCog
} from 'lucide-react';
import MembersTab from '@/components/MembersTab';
import dynamic from 'next/dynamic';
const FinancesTab = dynamic(() => import('@/components/FinancesTab'), { ssr: false });
import VisitsTab from '@/components/VisitsTab';
import DashboardTab from '@/components/DashboardTab';
import WorkersTab from '@/components/WorkersTab';
import SchedulesTab from '@/components/SchedulesTab';
import ProfileTab from '@/components/ProfileTab';
import LoginPage from '@/components/LoginPage';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user, systemUser, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Se estiver a carregar o estado da sessão no Firebase
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-[#789384] font-medium tracking-wide">A carregar autenticação...</p>
      </div>
    );
  }

  // Se não estiver autenticado como o usuário único permitido, apresenta apenas a página de Login
  if (!user) {
    return <LoginPage />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'schedules', label: 'Escala de Trabalho', icon: CalendarDays, badge: 'Cultos' },
    { id: 'workers', label: 'Pastores & Servos', icon: Users2, badge: null },
    { id: 'members', label: 'Membros', icon: Users, badge: null },
    { id: 'finances', label: 'Finanças', icon: Wallet, badge: null },
    { id: 'visits', label: 'Visitas Pastorais', icon: Calendar, badge: null },
    { id: 'profile', label: 'Editar Perfil', icon: UserCog, badge: 'Admin' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onNavigate={setActiveTab} />;
      case 'schedules':
        return <SchedulesTab />;
      case 'workers':
        return <WorkersTab />;
      case 'members':
        return <MembersTab />;
      case 'finances':
        return <FinancesTab />;
      case 'visits':
        return <VisitsTab />;
      case 'profile':
        return <ProfileTab key={systemUser?.id || systemUser?.email || 'profile'} onBackToDashboard={() => setActiveTab('dashboard')} />;
      default:
        return <DashboardTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7f5] text-[#121c17] font-sans antialiased print:bg-white print:h-auto print:block">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0e1613] border-r border-[#1a2922] print:hidden select-none">
        {/* Brand / Church Header */}
        <div className="p-5 border-b border-[#182620]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 flex-shrink-0">
              <Church className="w-5 h-5 text-[#071d13]" strokeWidth={2.4} />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight leading-tight">Nazareno</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Maputo</span>
              </div>
              <p className="text-xs text-[#738a7e] truncate mt-0.5">Gestão Congregacional</p>
            </div>
          </div>

          {/* Congregation Switcher / Workspace Pill */}
          <div className="mt-4 p-2.5 rounded-xl bg-[#14201a] border border-[#20332a] flex items-center justify-between text-xs text-[#d1e0d7] hover:border-emerald-500/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-white truncate">Sede Central - Malhangalene</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6c8578]" />
          </div>

          {/* Quick Search */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#587365]" />
            <input 
              type="text" 
              placeholder="Pesquisar no sistema..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-[#121c17] border border-[#1e2e26] rounded-xl text-xs text-white placeholder-[#587365] focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#587365] bg-[#1a2721] px-1 rounded">⌘K</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#587365] px-3 mb-2">Menu Principal</p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                        isActive 
                          ? 'bg-[#192721] text-white border border-emerald-500/25 shadow-sm shadow-emerald-950/40' 
                          : 'text-[#879f93] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-[#688274]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-emerald-500/25 text-emerald-300' 
                            : 'bg-[#16231c] text-[#789384] border border-[#23352b]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Notice Card */}
          <div className="p-3.5 rounded-2xl bg-[#131e18] border border-[#1f3027]">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Moçambique Sul</span>
            </div>
            <p className="text-[11px] text-[#81998d] leading-relaxed">
              Distrito de Maputo • Ano Eclesiástico 2026
            </p>
          </div>
        </nav>

        {/* User Account / Footer in Sidebar with Logout */}
        <div className="p-3.5 border-t border-[#182620] bg-[#0b120f]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#121c17] border border-[#1a2922] hover:border-emerald-500/30 transition-colors">
            <button
              onClick={() => setActiveTab('profile')}
              title="Editar Perfil do Administrador"
              className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer group"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm border border-emerald-500/40">
                  {systemUser?.photoURL ? (
                    <img 
                      src={systemUser.photoURL} 
                      alt="Foto de Perfil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{systemUser?.name?.substring(0, 2).toUpperCase() || 'LL'}</span>
                  )}
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 border-2 border-[#0b120f] absolute bottom-0 right-0"></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                  {systemUser?.name || 'Luciano Luís'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                    {systemUser?.role || 'Admin'}
                  </span>
                  <p className="text-[10px] text-emerald-400/90 font-mono truncate">{systemUser?.email || user.email}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => logout()}
              title="Terminar Sessão"
              className="p-1.5 text-[#738a7e] hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0e1613] border-b border-[#1b2621] flex items-center justify-between px-4 z-20 print:hidden text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-[#061910]">
            <Church className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Igreja do Nazareno</h1>
            <p className="text-[10px] text-emerald-400">{systemUser?.name || 'Luciano Luís'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            title="Editar Perfil"
            className="p-2 text-[#9bb0a5] hover:text-emerald-400 cursor-pointer"
          >
            <UserCog className="w-5 h-5" />
          </button>
          <button
            onClick={() => logout()}
            title="Terminar Sessão"
            className="p-2 text-[#9bb0a5] hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#9bb0a5] hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>


      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#0e1613] z-10 overflow-y-auto p-4 border-t border-[#1b2621]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isActive 
                      ? 'bg-[#192721] text-emerald-300 border border-emerald-500/30' 
                      : 'text-[#879f93] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-emerald-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0 print:h-auto print:overflow-visible print:pt-0 print:block bg-[#f4f7f5]">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:overflow-visible print:p-0 print:block">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
