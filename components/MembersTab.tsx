'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/lib/types';
import { Search, Plus, Trash2 } from 'lucide-react';

export default function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    dateOfBirth: '',
    phoneNumber: '',
    isBaptized: false,
    isTransferred: false,
  });

  useEffect(() => {
    const q = query(collection(db, 'members'));
    const unsubs = onSnapshot(
      q,
      (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
      },
      (err) => {
        console.warn('Erro ao carregar membros:', err);
      }
    );
    return () => unsubs();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;
    
    try {
      await addDoc(collection(db, 'members'), {
        ...newMember,
        createdAt: Date.now()
      });
      
      setShowModal(false);
      setNewMember({
        name: '',
        dateOfBirth: '',
        phoneNumber: '',
        isBaptized: false,
        isTransferred: false,
      });
    } catch (err) {
      console.error('Erro ao registar membro:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      try {
        await deleteDoc(doc(db, 'members', id));
      } catch (err) {
        console.error('Erro ao remover membro:', err);
      }
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#0e1613]">Gestão de Membros</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              {filteredMembers.length} crentes
            </span>
          </div>
          <p className="text-sm text-[#61776b] mt-0.5">Registo e acompanhamento dos membros da congregação</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#0e1613] hover:bg-[#1a2821] text-white px-4 py-2.5 rounded-xl transition-all font-semibold text-xs shadow-sm hover:shadow-emerald-950/20"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          Novo Membro
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e2eae5] overflow-hidden">
        <div className="p-4 border-b border-[#eaf1ec] bg-[#fbfdfc]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#657d70]" />
            <input 
              type="text" 
              placeholder="Buscar por nome do membro..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] placeholder-[#7d9487] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f4f7f5] text-[#55695e] border-b border-[#e2eae5] font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Nome</th>
                <th className="px-6 py-3.5">Telefone</th>
                <th className="px-6 py-3.5">Data de Nascimento</th>
                <th className="px-6 py-3.5">Situação</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f5f2]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#61776b]">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#f8faf9] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0e1613]">{member.name}</td>
                    <td className="px-6 py-4 text-[#526a5d]">{member.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-[#526a5d]">
                      {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {member.isBaptized && (
                          <span className="px-2 py-0.5 bg-[#e3f4e9] text-[#0d6b38] border border-[#c6e9d2] text-[11px] rounded-md font-semibold">
                            Batizado
                          </span>
                        )}
                        {member.isTransferred && (
                          <span className="px-2 py-0.5 bg-[#fef3e2] text-[#9a4e0a] border border-[#fde4be] text-[11px] rounded-md font-semibold">
                            Transferido
                          </span>
                        )}
                        {!member.isBaptized && !member.isTransferred && (
                          <span className="px-2 py-0.5 bg-[#edf2ef] text-[#475b51] border border-[#dce6d0] text-[11px] rounded-md font-semibold">
                            Regular
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="text-[#9dafa5] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remover Membro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e2eae5]">
            <div className="p-6 border-b border-[#eaf1ec] bg-[#fbfdfc]">
              <h3 className="text-lg font-bold text-[#0e1613]">Registar Novo Membro</h3>
              <p className="text-xs text-[#61776b]">Adicione um membro ao livro da congregação</p>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: João Manuel Silva"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Data de Nascimento</label>
                <input 
                  type="date" 
                  required
                  value={newMember.dateOfBirth}
                  onChange={(e) => setNewMember({...newMember, dateOfBirth: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">Número de Telefone</label>
                <input 
                  type="tel" 
                  placeholder="+258 84 000 0000"
                  value={newMember.phoneNumber}
                  onChange={(e) => setNewMember({...newMember, phoneNumber: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-[#f4f7f5] transition-colors">
                  <input 
                    type="checkbox"
                    checked={newMember.isBaptized}
                    onChange={(e) => setNewMember({...newMember, isBaptized: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-[#dce6df]"
                  />
                  <span className="text-xs font-medium text-[#293d32]">Já é Batizado?</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-[#f4f7f5] transition-colors">
                  <input 
                    type="checkbox"
                    checked={newMember.isTransferred}
                    onChange={(e) => setNewMember({...newMember, isTransferred: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-[#dce6df]"
                  />
                  <span className="text-xs font-medium text-[#293d32]">Transferido de outra Congregação?</span>
                </label>
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
                  Registar Membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
