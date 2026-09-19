'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, FinanceRecord, Visit } from '@/lib/types';
import { 
  Users, 
  TrendingUp, 
  HandCoins, 
  Droplets,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    const qMembers = query(collection(db, 'members'));
    const unsubsMembers = onSnapshot(
      qMembers,
      (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
      },
      (err) => {
        console.warn('Erro ao carregar membros no dashboard:', err);
      }
    );

    const qFinances = query(collection(db, 'finances'));
    const unsubsFinances = onSnapshot(
      qFinances,
      (snapshot) => {
        setFinances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRecord)));
      },
      (err) => {
        console.warn('Erro ao carregar finanças no dashboard:', err);
      }
    );

    const qVisits = query(collection(db, 'visits'));
    const unsubsVisits = onSnapshot(
      qVisits,
      (snapshot) => {
        setVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit)));
      },
      (err) => {
        console.warn('Erro ao carregar visitas:', err);
      }
    );

    return () => {
      unsubsMembers();
      unsubsFinances();
      unsubsVisits();
    };
  }, []);

  const totalMembers = members.length;
  const baptizedMembers = members.filter(m => m.isBaptized).length;
  const baptismRate = totalMembers > 0 ? Math.round((baptizedMembers / totalMembers) * 100) : 0;
  
  const currentYear = new Date().getFullYear();
  const now = new Date();
  
  const newMembersThisMonth = members.filter(m => {
    const d = new Date(m.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === currentYear;
  }).length;

  const totalFinances = finances.reduce((sum, f) => sum + Number(f.amount || 0), 0);

  // Growth Data
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const growthData = months.map((month, index) => {
    const mCount = members.filter(m => {
      const d = new Date(m.createdAt);
      return d.getMonth() === index && d.getFullYear() === currentYear;
    }).length;
    return { name: month, membros: mCount };
  });

  const financeData = months.map((month, index) => {
    const total = finances
      .filter(f => {
        const d = new Date(f.serviceDate);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      })
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return { name: month, valor: total };
  });

  // Recent 5 activities
  const recentFinances = [...finances]
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0e1613] tracking-tight">Dashboard Geral</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Activo
            </span>
          </div>
          <p className="text-sm text-[#61776b] mt-0.5">Visão unificada de membros, finanças e visitas da Igreja do Nazareno</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#dce6df] text-[#1b2a22] hover:bg-[#edf4ef] transition-colors text-xs font-semibold shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#587365]" />
            Exportar
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1613] text-white text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Ano {currentYear}
          </div>
        </div>
      </div>
      
      {/* 4 Cards Grid - Styled directly after the reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Featured Dark Obsidian Card (Mirrors Air Pollution card in reference) */}
        <div className="bg-[#0e1613] text-white p-5 rounded-2xl border border-[#1b2b23] shadow-md flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle green ambient light */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8da597]">Total de Membros</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                Congregação
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">{totalMembers}</span>
              <span className="text-xs text-[#8da597]">crentes</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1a2821] flex items-end justify-between">
            <div>
              <p className="text-[11px] text-[#718b7d]">Novos este mês</p>
              <p className="text-xs font-semibold text-emerald-400">+{newMembersThisMonth} adicionados</p>
            </div>
            {/* Mini Equalizer Bars (inspired by the green bar visualization in the reference image) */}
            <div className="flex items-end gap-1 h-6">
              {[40, 70, 50, 90, 60, 100, 75].map((height, i) => (
                <div 
                  key={i} 
                  style={{ height: `${height}%` }} 
                  className={`w-1 rounded-full ${i === 5 ? 'bg-emerald-400' : 'bg-emerald-600/70'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Clean White Card (Mirrors Environmental Quality Index) */}
        <div className="bg-white p-5 rounded-2xl border border-[#e2eae5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#61776b]">Membros Batizados</span>
              <span className="w-8 h-8 rounded-xl bg-[#eef8f2] text-emerald-700 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#0e1613]">{baptizedMembers}</span>
              <span className="text-xs text-[#61776b]">de {totalMembers}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold text-[#61776b] mb-1.5">
              <span>Taxa de Batismo</span>
              <span className="text-emerald-700">{baptismRate}%</span>
            </div>
            <div className="w-full bg-[#eaf2ed] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(baptismRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Clean White Card with Warm Amber/Peach Accent */}
        <div className="bg-white p-5 rounded-2xl border border-[#e2eae5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#61776b]">Visitas Pastorais</span>
              <span className="w-8 h-8 rounded-xl bg-[#fef5e7] text-amber-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#0e1613]">{visits.length}</span>
              <span className="text-xs text-[#61776b]">registadas</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0f5f2] flex items-center justify-between text-xs">
            <span className="text-[#61776b]">Realizadas:</span>
            <span className="font-semibold text-emerald-700 bg-[#e7f5ec] px-2 py-0.5 rounded-md">
              {visits.filter(v => v.status === 'completed').length} visitas
            </span>
          </div>
        </div>

        {/* Card 4: Signature Pale Sage Feature Card (Mirrors 99,681m TONS card from reference) */}
        <div className="bg-[#e7f3ec] p-5 rounded-2xl border border-[#d0e5d7] shadow-sm flex flex-col justify-between text-[#0c2216]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#294c37]">Arrecadação Anual</span>
              <span className="w-8 h-8 rounded-xl bg-white/80 text-emerald-700 flex items-center justify-center shadow-xs">
                <HandCoins className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold tracking-tight text-[#0c2216]">
                {totalFinances.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold ml-1 text-[#294c37]">MT</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#d2e7d9] flex items-center justify-between">
            <span className="text-[11px] text-[#3e604d] font-medium">Dízimos & Ofertas</span>
            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {finances.length} registos
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section with Reference Image Color Scheme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Membership Trend (Emerald Curve Area) */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2eae5] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#0e1613]">Crescimento da Congregação</h3>
              <p className="text-xs text-[#61776b]">Novos crentes registados por mês em {currentYear}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#f4f7f5] text-[#344d3e] border border-[#e0eae3]">
              Mensal
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf3ef" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6c8577', fontSize: 11 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6c8577', fontSize: 11 }} 
                  dx={-5} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0e1613',
                    borderRadius: '12px',
                    border: '1px solid #1c2b23',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="membros" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#emeraldGradient)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Monthly Contributions (Emerald Bars) */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2eae5] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#0e1613]">Finanças por Mês (MT)</h3>
              <p className="text-xs text-[#61776b]">Total de dízimos e ofertas consolidados em {currentYear}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#f4f7f5] text-[#344d3e] border border-[#e0eae3]">
              Moçambique (MT)
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf3ef" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6c8577', fontSize: 11 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6c8577', fontSize: 11 }} 
                  dx={-5} 
                />
                <Tooltip 
                  cursor={{ fill: '#f4f7f5', radius: 6 }}
                  contentStyle={{
                    backgroundColor: '#0e1613',
                    borderRadius: '12px',
                    border: '1px solid #1c2b23',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Bar 
                  dataKey="valor" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Contributions & Activity (Styled like Region table in image) */}
      <div className="bg-white rounded-2xl border border-[#e2eae5] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0e1613]">Últimas Contribuições Registadas</h3>
            <p className="text-xs text-[#61776b]">Histórico recente de entradas por culto na congregação</p>
          </div>
          <span className="text-xs text-[#61776b] font-medium">Sede Central - Maputo</span>
        </div>

        {recentFinances.length === 0 ? (
          <p className="text-center py-8 text-xs text-[#61776b]">Nenhum registo financeiro encontrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eaf1ec] text-[#657d70] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Data do Culto</th>
                  <th className="py-3 px-4">Culto / Ocasião</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f5f2]">
                {recentFinances.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8faf9] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111d17]">
                      {new Date(item.serviceDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-[#445b4f]">
                      {item.serviceNumber || 'Culto Geral'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        item.type === 'tithe' 
                          ? 'bg-[#e3f4e9] text-[#0d6b38] border border-[#c6e9d2]' 
                          : 'bg-[#eaf4fc] text-[#1e5a8a] border border-[#cde2f5]'
                      }`}>
                        {item.type === 'tithe' ? 'Dízimo' : 'Oferta'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0e1613]">
                      {Number(item.amount).toFixed(2)} MT
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e7f5ec] text-[#136a3d]">
                        Registado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
