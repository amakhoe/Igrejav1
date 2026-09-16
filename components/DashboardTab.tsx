'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, FinanceRecord } from '@/lib/types';
import { Users, TrendingUp, HandCoins, Droplets } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function DashboardTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);

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

    return () => {
      unsubsMembers();
      unsubsFinances();
    };
  }, []);

  const totalMembers = members.length;
  const baptizedMembers = members.filter(m => m.isBaptized).length;
  const newMembersThisMonth = members.filter(m => {
    const d = new Date(m.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalFinances = finances.reduce((sum, f) => sum + Number(f.amount), 0);

  // Growth Data
  const currentYear = new Date().getFullYear();
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
      .reduce((sum, f) => sum + Number(f.amount), 0);
    return { name: month, valor: total };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Membros</p>
            <p className="text-3xl font-bold text-gray-900">{totalMembers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-cyan-50 text-cyan-600 rounded-lg">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Membros Batizados</p>
            <p className="text-3xl font-bold text-gray-900">{baptizedMembers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Novos este Mês</p>
            <p className="text-3xl font-bold text-gray-900">{newMembersThisMonth}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg">
            <HandCoins className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Contribuições ({currentYear})</p>
            <p className="text-3xl font-bold text-gray-900">{totalFinances} MT</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Crescimento da Congregação</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="membros" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Finanças por Mês (MT)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
