'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FinanceRecord, Member } from '@/lib/types';
import { Plus, Trash2, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FinancesTab() {
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [newRecord, setNewRecord] = useState({
    type: 'offering' as 'tithe' | 'offering',
    amount: '',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceNumber: '1º Culto',
    memberId: ''
  });

  useEffect(() => {
    const qFinances = query(collection(db, 'finances'));
    const unsubsFinances = onSnapshot(
      qFinances,
      (snapshot) => {
        setFinances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRecord))
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()));
      },
      (err) => {
        console.warn('Erro ao carregar finanças:', err);
      }
    );

    const qMembers = query(collection(db, 'members'));
    const unsubsMembers = onSnapshot(
      qMembers,
      (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
      },
      (err) => {
        console.warn('Erro ao carregar membros:', err);
      }
    );

    return () => {
      unsubsFinances();
      unsubsMembers();
    };
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.amount || !newRecord.serviceDate || !newRecord.serviceNumber) return;
    
    try {
      await addDoc(collection(db, 'finances'), {
        ...newRecord,
        amount: parseFloat(newRecord.amount),
        createdAt: Date.now()
      });
      
      setShowModal(false);
      setNewRecord({
        type: 'offering',
        amount: '',
        serviceDate: newRecord.serviceDate, // Keep the same date for easier consecutive entries
        serviceNumber: newRecord.serviceNumber,
        memberId: ''
      });
    } catch (err) {
      console.error('Erro ao registar contribuição:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este registo?')) {
      try {
        await deleteDoc(doc(db, 'finances', id));
      } catch (err) {
        console.error('Erro ao remover registo financeiro:', err);
      }
    }
  };

  // Agrupar finanças por data e culto
  const groupedFinances = finances.reduce((acc, f) => {
    const key = `${f.serviceDate}_${f.serviceNumber || '1º Culto'}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        date: f.serviceDate,
        serviceNumber: f.serviceNumber || '1º Culto',
        tithes: 0,
        offerings: 0,
        total: 0,
        records: []
      };
    }
    if (f.type === 'tithe') acc[key].tithes += f.amount;
    if (f.type === 'offering') acc[key].offerings += f.amount;
    acc[key].total += f.amount;
    acc[key].records.push(f);
    return acc;
  }, {} as Record<string, any>);

  const groupedArray = Object.values(groupedFinances).sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.serviceNumber.localeCompare(b.serviceNumber);
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const currentMonth = new Date().toLocaleString('pt-MZ', { month: 'long', year: 'numeric' });
    
    doc.setFontSize(18);
    doc.text(`Relatório Financeiro por Culto - ${currentMonth.toUpperCase()}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text('Igreja do Nazareno - Maputo', 14, 30);

    const tableData = groupedArray.map(g => [
      new Date(g.date).toLocaleDateString('pt-BR'),
      g.serviceNumber,
      `${g.tithes.toFixed(2)} MT`,
      `${g.offerings.toFixed(2)} MT`,
      `${g.total.toFixed(2)} MT`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Culto', 'Total Dízimos', 'Total Ofertas', 'Total Arrecadado']],
      body: tableData,
    });

    const totalGeral = groupedArray.reduce((sum, g) => sum + g.total, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFontSize(14);
    doc.text(`Total Geral do Período: ${totalGeral.toFixed(2)} MT`, 14, finalY + 10);

    doc.save(`Relatorio_Financeiro_Cultos_${currentMonth}.pdf`);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroup(expandedGroup === key ? null : key);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dízimos e Ofertas (Por Culto)</h2>
        <div className="flex gap-3">
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <FileDown className="w-5 h-5" />
            Gerar Relatório (PDF)
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Novo Registo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {groupedArray.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum registo financeiro encontrado.
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div className="grid grid-cols-5 bg-gray-50 text-gray-500 text-sm font-medium p-4 border-b border-gray-100">
              <div>Data e Culto</div>
              <div className="text-right">Dízimos</div>
              <div className="text-right">Ofertas</div>
              <div className="text-right">Total</div>
              <div className="text-right">Detalhes</div>
            </div>
            
            {/* Rows */}
            {groupedArray.map((group) => (
              <React.Fragment key={group.key}>
                <div 
                  className="grid grid-cols-5 items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleGroup(group.key)}
                >
                  <div>
                    <div className="font-bold text-gray-900">{new Date(group.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-sm text-emerald-600 font-medium">{group.serviceNumber}</div>
                  </div>
                  <div className="text-right text-gray-600">{group.tithes.toFixed(2)} MT</div>
                  <div className="text-right text-gray-600">{group.offerings.toFixed(2)} MT</div>
                  <div className="text-right font-bold text-gray-900">{group.total.toFixed(2)} MT</div>
                  <div className="text-right flex justify-end">
                    {expandedGroup === group.key ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGroup === group.key && (
                  <div className="col-span-5 bg-gray-50/50 p-4 border-b border-gray-100">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-200">
                          <th className="pb-2 font-medium">Tipo</th>
                          <th className="pb-2 font-medium">Membro</th>
                          <th className="pb-2 font-medium text-right">Valor</th>
                          <th className="pb-2 font-medium text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.records.map((record: FinanceRecord) => {
                          const member = members.find(m => m.id === record.memberId);
                          return (
                            <tr key={record.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-2">
                                <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${
                                  record.type === 'tithe' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {record.type === 'tithe' ? 'Dízimo' : 'Oferta'}
                                </span>
                              </td>
                              <td className="py-2 text-gray-600">
                                {record.type === 'tithe' ? (member?.name || 'Desconhecido') : '-'}
                              </td>
                              <td className="py-2 text-right font-medium text-gray-900">
                                {record.amount.toFixed(2)} MT
                              </td>
                              <td className="py-2 text-right">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(record.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Registar Contribuição</h3>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Culto</label>
                  <input 
                    type="date" 
                    required
                    value={newRecord.serviceDate}
                    onChange={(e) => setNewRecord({...newRecord, serviceDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qual Culto?</label>
                  <select 
                    value={newRecord.serviceNumber}
                    onChange={(e) => setNewRecord({...newRecord, serviceNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1º Culto">1º Culto</option>
                    <option value="2º Culto">2º Culto</option>
                    <option value="3º Culto">3º Culto</option>
                    <option value="4º Culto">4º Culto</option>
                    <option value="Culto Jovem">Culto Jovem</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contribuição</label>
                <select 
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({...newRecord, type: e.target.value as 'tithe' | 'offering'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="offering">Oferta</option>
                  <option value="tithe">Dízimo</option>
                </select>
              </div>

              {newRecord.type === 'tithe' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membro (Dizimista)</label>
                  <select 
                    value={newRecord.memberId}
                    onChange={(e) => setNewRecord({...newRecord, memberId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecione o membro...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (MT)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({...newRecord, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Registar Valor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
