'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Visit, Member } from '@/lib/types';
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle, Clock, Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function VisitsTab() {
  const { isAdmin } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newVisit, setNewVisit] = useState({
    memberId: '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed'
  });

  useEffect(() => {
    const qVisits = query(collection(db, 'visits'));
    const unsubsVisits = onSnapshot(
      qVisits,
      (snapshot) => {
        setVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit))
        .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
      },
      (err) => {
        console.warn('Erro ao carregar visitas:', err);
      }
    );

    const qMembers = query(collection(db, 'members'));
    const unsubsMembers = onSnapshot(
      qMembers,
      (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
      },
      (err) => {
        console.warn('Erro ao carregar membros em visitas:', err);
      }
    );

    return () => {
      unsubsVisits();
      unsubsMembers();
    };
  }, []);

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para agendar visitas.');
      return;
    }
    if (!newVisit.memberId || !newVisit.visitDate) return;
    
    try {
      await addDoc(collection(db, 'visits'), {
        ...newVisit,
        createdAt: Date.now()
      });
      
      setShowModal(false);
      setNewVisit({
        memberId: '',
        visitDate: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'scheduled'
      });
    } catch (err) {
      console.error('Erro ao agendar visita:', err);
    }
  };

  const toggleStatus = async (visit: Visit) => {
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para atualizar o estado da visita.');
      return;
    }
    const newStatus = visit.status === 'scheduled' ? 'completed' : 'scheduled';
    try {
      await updateDoc(doc(db, 'visits', visit.id), { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar estado da visita:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Apenas administradores têm permissão para remover visitas.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este agendamento?')) {
      try {
        await deleteDoc(doc(db, 'visits', id));
      } catch (err) {
        console.error('Erro ao remover visita:', err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#0e1613]">Visitas Pastorais</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              {visits.length} registadas
            </span>
          </div>
          <p className="text-sm text-[#61776b] mt-0.5">Agendamento e acompanhamento de visitas aos crentes e famílias</p>
        </div>

        {isAdmin ? (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#0e1613] hover:bg-[#1a2821] text-white px-4 py-2.5 rounded-xl transition-all font-semibold text-xs shadow-sm hover:shadow-emerald-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Agendar Visita
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Modo de Consulta</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visits.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#e2eae5] shadow-sm text-xs text-[#61776b]">
            Nenhuma visita pastoral agendada até ao momento.
          </div>
        ) : (
          visits.map((visit) => {
            const member = members.find(m => m.id === visit.memberId);
            const isCompleted = visit.status === 'completed';
            
            return (
              <div key={visit.id} className="bg-white rounded-2xl shadow-sm border border-[#e2eae5] overflow-hidden flex flex-col justify-between hover:border-[#cfe0d5] transition-all">
                <div className={`p-5 border-b border-[#f0f5f2] ${isCompleted ? 'bg-[#fbfdfc]' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#0e1613] text-sm truncate pr-2">
                      {member?.name || 'Membro não encontrado'}
                    </h3>
                    <span className={`px-2 py-0.5 text-[11px] rounded-md font-semibold flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-[#e3f4e9] text-[#0d6b38] border border-[#c6e9d2]' 
                        : 'bg-[#fef3e2] text-[#9a4e0a] border border-[#fde4be]'
                    }`}>
                      {isCompleted ? 'Realizada' : 'Agendada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5f786b] mt-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{new Date(visit.visitDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 text-xs text-[#4b6355] leading-relaxed">
                  {visit.notes ? (
                    <p className="line-clamp-3">{visit.notes}</p>
                  ) : (
                    <p className="italic text-[#91a89c]">Sem observações adicionais.</p>
                  )}
                </div>

                <div className="p-4 border-t border-[#f0f5f2] bg-[#fbfdfc] flex justify-between items-center mt-auto">
                  {isAdmin ? (
                    <>
                      <button 
                        onClick={() => toggleStatus(visit)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                          isCompleted ? 'text-[#61776b] hover:text-[#0e1613]' : 'text-emerald-700 hover:text-emerald-800'
                        }`}
                      >
                        {isCompleted ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        {isCompleted ? 'Marcar Pendente' : 'Marcar Realizada'}
                      </button>
                      <button 
                        onClick={() => handleDelete(visit.id)}
                        className="text-[#9dafa5] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remover Visita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className={`inline-flex items-center gap-1 font-semibold ${isCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {isCompleted ? 'Realizada' : 'Pendente'}
                      </span>
                      <span className="text-[11px] text-zinc-400 italic">Consulta</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e2eae5]">
            <div className="p-6 border-b border-[#eaf1ec] bg-[#fbfdfc]">
              <h3 className="text-lg font-bold text-[#0e1613]">Agendar Visita Pastoral</h3>
              <p className="text-xs text-[#61776b]">Marque uma visita para aconselhamento, oração ou apoio pastoral</p>
            </div>
            <form onSubmit={handleAddVisit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Membro a Visitar</label>
                <select 
                  required
                  value={newVisit.memberId}
                  onChange={(e) => setNewVisit({...newVisit, memberId: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">Selecione o membro...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Data da Visita</label>
                <input 
                  type="date" 
                  required
                  value={newVisit.visitDate}
                  onChange={(e) => setNewVisit({...newVisit, visitDate: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Observações (Opcional)</label>
                <textarea 
                  rows={3}
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                  placeholder="Motivo da visita, assuntos a abordar..."
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
                  Agendar Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
