'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Visit, Member } from '@/lib/types';
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function VisitsTab() {
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
    const newStatus = visit.status === 'scheduled' ? 'completed' : 'scheduled';
    try {
      await updateDoc(doc(db, 'visits', visit.id), { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar estado da visita:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este agendamento?')) {
      try {
        await deleteDoc(doc(db, 'visits', id));
      } catch (err) {
        console.error('Erro ao remover visita:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Visitas Pastorais</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Agendar Visita
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visits.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500">
            Nenhuma visita agendada.
          </div>
        ) : (
          visits.map((visit) => {
            const member = members.find(m => m.id === visit.memberId);
            const isCompleted = visit.status === 'completed';
            
            return (
              <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className={`p-4 border-b ${isCompleted ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 truncate pr-2">
                      {member?.name || 'Membro não encontrado'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-md font-medium flex-shrink-0 ${
                      isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isCompleted ? 'Realizada' : 'Agendada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(visit.visitDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div className="p-4 flex-1 text-sm text-gray-600">
                  {visit.notes ? (
                    <p className="line-clamp-3">{visit.notes}</p>
                  ) : (
                    <p className="italic text-gray-400">Sem observações.</p>
                  )}
                </div>

                <div className="p-4 border-t border-gray-50 bg-gray-50 flex justify-between items-center mt-auto">
                  <button 
                    onClick={() => toggleStatus(visit)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      isCompleted ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {isCompleted ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {isCompleted ? 'Marcar Pendente' : 'Marcar Realizada'}
                  </button>
                  <button 
                    onClick={() => handleDelete(visit.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                    title="Remover Visita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Agendar Visita Pastoral</h3>
            </div>
            <form onSubmit={handleAddVisit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membro a Visitar</label>
                <select 
                  required
                  value={newVisit.memberId}
                  onChange={(e) => setNewVisit({...newVisit, memberId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione o membro...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Visita</label>
                <input 
                  type="date" 
                  required
                  value={newVisit.visitDate}
                  onChange={(e) => setNewVisit({...newVisit, visitDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea 
                  rows={3}
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Motivo da visita, assuntos a abordar..."
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
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
