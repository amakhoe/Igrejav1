'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FinanceRecord, Member } from '@/lib/types';
import { Plus, Trash2, FileDown, ChevronDown, ChevronUp, Printer, Lock } from 'lucide-react';
import MonthlyFinanceChart from '@/components/MonthlyFinanceChart';
import { useAuth } from '@/lib/AuthContext';

export default function FinancesTab() {
  const { isAdmin } = useAuth();
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
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para efetuar lançamentos financeiros.');
      return;
    }
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
    if (!isAdmin) {
      alert('Apenas administradores têm permissão para eliminar lançamentos financeiros.');
      return;
    }
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

  const generatePDF = async () => { console.log("PDF generated"); };;

  const toggleGroup = (key: string) => {
    setExpandedGroup(expandedGroup === key ? null : key);
  };

  const [seeding, setSeeding] = useState(false);
  const handleSeedSampleFinances = async () => {
    setSeeding(true);
    const nowTime = Date.now();
    const currentYear = new Date().getFullYear();
    const sampleData = [
      { type: 'tithe' as const, amount: 14200, serviceDate: `${currentYear}-01-11`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 5600, serviceDate: `${currentYear}-01-11`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 16800, serviceDate: `${currentYear}-02-08`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 6900, serviceDate: `${currentYear}-02-08`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 19500, serviceDate: `${currentYear}-03-15`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 7800, serviceDate: `${currentYear}-03-15`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 15300, serviceDate: `${currentYear}-04-12`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 6200, serviceDate: `${currentYear}-04-12`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 18400, serviceDate: `${currentYear}-05-10`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 7400, serviceDate: `${currentYear}-05-10`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 22800, serviceDate: `${currentYear}-06-14`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 8900, serviceDate: `${currentYear}-06-14`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 20100, serviceDate: `${currentYear}-07-12`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 7600, serviceDate: `${currentYear}-07-12`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 21500, serviceDate: `${currentYear}-08-09`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 8200, serviceDate: `${currentYear}-08-09`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'tithe' as const, amount: 23900, serviceDate: `${currentYear}-09-13`, serviceNumber: '1º Culto', createdAt: nowTime },
      { type: 'offering' as const, amount: 9400, serviceDate: `${currentYear}-09-13`, serviceNumber: '1º Culto', createdAt: nowTime },
    ];

    try {
      for (const item of sampleData) {
        await addDoc(collection(db, 'finances'), item);
      }
    } catch (err) {
      console.error('Erro ao adicionar dados de exemplo:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#0e1613]">Dízimos e Ofertas</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Por Culto
            </span>
          </div>
          <p className="text-sm text-[#61776b] mt-0.5">Gestão e consolidação das contribuições da congregação</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {isAdmin && finances.length === 0 && (
            <button 
              onClick={handleSeedSampleFinances}
              disabled={seeding}
              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-colors text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {seeding ? 'A carregar exemplos...' : 'Carregar Dados Exemplo'}
            </button>
          )}
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white border border-[#dce6df] text-[#1b2a22] px-3.5 py-2 rounded-xl hover:bg-[#edf4ef] transition-colors text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#587365]" />
            Imprimir
          </button>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-1.5 bg-white border border-[#dce6df] text-[#1b2a22] px-3.5 py-2 rounded-xl hover:bg-[#edf4ef] transition-colors text-xs font-semibold shadow-sm cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#587365]" />
            Exportar
          </button>
          {isAdmin ? (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-[#0e1613] hover:bg-[#1a2821] text-white px-4 py-2 rounded-xl transition-all text-xs font-semibold shadow-sm hover:shadow-emerald-950/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Novo Registo
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Modo de Consulta</span>
            </div>
          )}
        </div>
      </div>

      {/* Componente de Visualização de Dados (Recharts) */}
      <MonthlyFinanceChart finances={finances} />

      <div className="bg-white rounded-2xl shadow-sm border border-[#e2eae5] overflow-hidden">
        {groupedArray.length === 0 ? (
          <div className="p-10 text-center text-[#61776b] text-xs">
            Nenhum registo financeiro encontrado.
          </div>
        ) : (
          <div className="flex flex-col text-xs">
            {/* Header */}
            <div className="grid grid-cols-5 print:grid-cols-4 bg-[#f4f7f5] text-[#55695e] font-semibold uppercase tracking-wider p-4 border-b border-[#e2eae5]">
              <div>Data e Culto</div>
              <div className="text-right">Dízimos</div>
              <div className="text-right">Ofertas</div>
              <div className="text-right">Total</div>
              <div className="text-right print:hidden">Detalhes</div>
            </div>
            
            {/* Rows */}
            {groupedArray.map((group) => (
              <React.Fragment key={group.key}>
                <div 
                  className="grid grid-cols-5 print:grid-cols-4 items-center p-4 border-b border-[#f0f5f2] hover:bg-[#f8faf9] transition-colors cursor-pointer"
                  onClick={() => toggleGroup(group.key)}
                >
                  <div>
                    <div className="font-bold text-[#0e1613] text-sm">{new Date(group.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-0.5">{group.serviceNumber}</div>
                  </div>
                  <div className="text-right text-[#526a5d] font-medium">{group.tithes.toFixed(2)} MT</div>
                  <div className="text-right text-[#526a5d] font-medium">{group.offerings.toFixed(2)} MT</div>
                  <div className="text-right font-extrabold text-[#0e1613] text-sm">{group.total.toFixed(2)} MT</div>
                  <div className="text-right flex justify-end print:hidden">
                    {expandedGroup === group.key ? (
                      <ChevronUp className="w-4 h-4 text-[#6c8577]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6c8577]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGroup === group.key && (
                  <div className="col-span-5 bg-[#fbfdfc] p-4 border-b border-[#eaf1ec]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[#657d70] border-b border-[#eaf1ec] font-semibold uppercase tracking-wider">
                          <th className="pb-2.5">Tipo</th>
                          <th className="pb-2.5">Membro</th>
                          <th className="pb-2.5 text-right">Valor</th>
                          <th className="pb-2.5 text-right print:hidden">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.records.map((record: FinanceRecord) => {
                          const member = members.find(m => m.id === record.memberId);
                          return (
                            <tr key={record.id} className="border-b border-[#f0f5f2] last:border-0 hover:bg-[#f4f7f5]/50">
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 text-[11px] rounded-md font-semibold ${
                                  record.type === 'tithe' 
                                    ? 'bg-[#e3f4e9] text-[#0d6b38] border border-[#c6e9d2]' 
                                    : 'bg-[#eaf4fc] text-[#1e5a8a] border border-[#cde2f5]'
                                }`}>
                                  {record.type === 'tithe' ? 'Dízimo' : 'Oferta'}
                                </span>
                              </td>
                              <td className="py-2.5 text-[#3b5246] font-medium">
                                {record.type === 'tithe' ? (member?.name || 'Não identificado') : '-'}
                              </td>
                              <td className="py-2.5 text-right font-bold text-[#0e1613]">
                                {record.amount.toFixed(2)} MT
                              </td>
                              <td className="py-2.5 text-right print:hidden">
                                {isAdmin ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(record.id);
                                    }}
                                    className="text-[#9dafa5] hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Remover Registo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-zinc-400 italic">Consulta</span>
                                )}
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
            {groupedArray.length > 0 && (
              <div className="bg-[#f4f7f5] border-t border-[#e2eae5] p-4 font-bold text-[#0e1613] grid grid-cols-5 print:grid-cols-4 items-center">
                <div className="col-span-3 text-right pr-4 text-xs uppercase tracking-wider text-[#526a5d]">Total Geral do Período:</div>
                <div className="text-right text-emerald-800 text-base font-extrabold">
                  {groupedArray.reduce((sum, g) => sum + g.total, 0).toFixed(2)} MT
                </div>
                <div className="print:hidden"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e2eae5]">
            <div className="p-6 border-b border-[#eaf1ec] bg-[#fbfdfc]">
              <h3 className="text-lg font-bold text-[#0e1613]">Registar Contribuição</h3>
              <p className="text-xs text-[#61776b]">Registo de dízimos e ofertas por culto</p>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Data do Culto</label>
                  <input 
                    type="date" 
                    required
                    value={newRecord.serviceDate}
                    onChange={(e) => setNewRecord({...newRecord, serviceDate: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Qual Culto?</label>
                  <select 
                    value={newRecord.serviceNumber}
                    onChange={(e) => setNewRecord({...newRecord, serviceNumber: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Tipo de Contribuição</label>
                <select 
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({...newRecord, type: e.target.value as 'tithe' | 'offering'})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="offering">Oferta</option>
                  <option value="tithe">Dízimo</option>
                </select>
              </div>

              {newRecord.type === 'tithe' && (
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Membro (Dizimista)</label>
                  <select 
                    value={newRecord.memberId}
                    onChange={(e) => setNewRecord({...newRecord, memberId: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="">Selecione o membro...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Valor (MT)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({...newRecord, amount: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-[#f0f5f2]">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-[#61776b] font-semibold hover:bg-[#edf4ef] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-500 transition-colors shadow-sm"
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
