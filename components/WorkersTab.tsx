'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChurchWorker, WorkerRole } from '@/lib/types';
import { 
  Plus, 
  Search, 
  Trash2, 
  UserCheck, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Music, 
  Users2, 
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const INITIAL_SAMPLE_WORKERS = [
  { name: 'Rev. Manuel Sitoe', role: 'pastor' as WorkerRole, subRole: 'Pastor Titular', phoneNumber: '+258 84 123 4567', email: 'rev.manuel@igrejanazareno.mz', active: true, notes: 'Ministério Pastoral e Doutrinário' },
  { name: 'Pr. Tomás Cossa', role: 'pastor' as WorkerRole, subRole: 'Pastor Auxiliar', phoneNumber: '+258 82 234 5678', email: 'pr.tomas@igrejanazareno.mz', active: true, notes: 'Ministério de Jovens e Evangelismo' },
  { name: 'Diác. Fernando Matsinhe', role: 'obreiro' as WorkerRole, subRole: 'Diácono Líder • Recepção', phoneNumber: '+258 84 345 6789', active: true, notes: 'Responsável pela ordem e portaria' },
  { name: 'Diac. Albertina Mabunda', role: 'obreiro' as WorkerRole, subRole: 'Diaconisa • Apoio e Recolha', phoneNumber: '+258 86 456 7890', active: true, notes: 'Apoio aos enfermos e mesa de comunhão' },
  { name: 'Ir. João Tembe', role: 'obreiro' as WorkerRole, subRole: 'Cooperador • Protocolo', phoneNumber: '+258 85 567 8901', active: true, notes: 'Acolhimento de visitantes' },
  { name: 'Ir. Marta Langa', role: 'obreiro' as WorkerRole, subRole: 'Cooperadora • Protocolo', phoneNumber: '+258 84 678 9012', active: true, notes: 'Coordenação de ofertas' },
  { name: 'David Mondlane', role: 'musico' as WorkerRole, subRole: 'Líder de Louvor • Vocalista', phoneNumber: '+258 82 789 0123', active: true, notes: 'Voz Principal e Direcção de Cânticos' },
  { name: 'Sara Macuácua', role: 'musico' as WorkerRole, subRole: 'Cantora • Soprano', phoneNumber: '+258 84 890 1234', active: true, notes: 'Grupo de Louvor Principal' },
  { name: 'Elísio Guambe', role: 'musico' as WorkerRole, subRole: 'Músico • Tecladista', phoneNumber: '+258 86 901 2345', active: true, notes: 'Teclado e arranjos harmónicos' },
  { name: 'Isac Zandamela', role: 'musico' as WorkerRole, subRole: 'Músico • Baixista', phoneNumber: '+258 84 109 8765', active: true, notes: 'Baixo e violão acústico' },
];

function getDefaultSubRole(role: WorkerRole): string {
  if (role === 'pastor') return 'Pastor Auxiliar';
  if (role === 'obreiro') return 'Diácono / Cooperador';
  return 'Cantor / Louvor';
}

export default function WorkersTab() {
  const { isAdmin } = useAuth();
  const [workers, setWorkers] = useState<ChurchWorker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | WorkerRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'obreiro' as WorkerRole,
    subRole: '',
    phoneNumber: '',
    email: '',
    active: true,
    notes: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'workers'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChurchWorker));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setWorkers(list);
      },
      (err) => console.warn('Erro ao carregar servos:', err)
    );

    return () => unsubscribe();
  }, []);

  const handleOpenAdd = (defaultRole?: WorkerRole) => {
    const role = defaultRole || 'obreiro';
    setEditingWorkerId(null);
    setFormData({
      name: '',
      role,
      subRole: getDefaultSubRole(role),
      phoneNumber: '',
      email: '',
      active: true,
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (worker: ChurchWorker) => {
    setEditingWorkerId(worker.id);
    setFormData({
      name: worker.name,
      role: worker.role,
      subRole: worker.subRole || '',
      phoneNumber: worker.phoneNumber || '',
      email: worker.email || '',
      active: worker.active,
      notes: worker.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para registar ou editar servos.');
      return;
    }
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingWorkerId) {
        await updateDoc(doc(db, 'workers', editingWorkerId), {
          name: formData.name.trim(),
          role: formData.role,
          subRole: formData.subRole.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          active: formData.active,
          notes: formData.notes.trim()
        });
      } else {
        await addDoc(collection(db, 'workers'), {
          name: formData.name.trim(),
          role: formData.role,
          subRole: formData.subRole.trim() || getDefaultSubRole(formData.role),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          active: formData.active,
          notes: formData.notes.trim(),
          createdAt: Date.now()
        });
      }

      setShowModal(false);
    } catch (err) {
      console.error('Erro ao guardar servo:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (worker: ChurchWorker) => {
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para alternar o estado do servo.');
      return;
    }
    try {
      await updateDoc(doc(db, 'workers', worker.id), {
        active: !worker.active
      });
    } catch (err) {
      console.error('Erro ao alternar status do servo:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert('Apenas administradores têm permissão para eliminar servos.');
      return;
    }
    if (confirm(`Tem certeza que deseja remover o servo "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'workers', id));
      } catch (err) {
        console.error('Erro ao eliminar servo:', err);
      }
    }
  };

  const handlePopulateSampleWorkers = async () => {
    if (!isAdmin) return;
    if (!confirm('Deseja carregar a equipa padrão de Pastores, Obreiros e Músicos?')) return;
    try {
      for (const w of INITIAL_SAMPLE_WORKERS) {
        await addDoc(collection(db, 'workers'), {
          ...w,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error('Erro ao carregar equipa modelo:', err);
    }
  };

  const pastorsCount = workers.filter(w => w.role === 'pastor').length;
  const obreirosCount = workers.filter(w => w.role === 'obreiro').length;
  const musicosCount = workers.filter(w => w.role === 'musico').length;
  const activeCount = workers.filter(w => w.active).length;

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.subRole && worker.subRole.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (worker.phoneNumber && worker.phoneNumber.includes(searchTerm));
    
    const matchesRole = selectedRole === 'all' || worker.role === selectedRole;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' ? worker.active : !worker.active;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0f1714]">
            Pastores, Obreiros & Músicos
          </h2>
          <p className="text-sm text-[#526359] mt-1">
            Registo e gestão de líderes, equipa de serviço e ministério de adoração da Igreja do Nazareno.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {workers.length === 0 && (
              <button
                onClick={handlePopulateSampleWorkers}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Carregar Equipa de Exemplo
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenAdd('pastor')}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300/60 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Pastor
              </button>
              <button
                onClick={() => handleOpenAdd('obreiro')}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Obreiro
              </button>
              <button
                onClick={() => handleOpenAdd('musico')}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Músico / Cantor
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Modo de Consulta (Sem privilégios de registo)</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setSelectedRole(selectedRole === 'pastor' ? 'all' : 'pastor')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedRole === 'pastor' 
              ? 'bg-emerald-900 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500' 
              : 'bg-white border-[#e2eae5] text-[#121c17] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${selectedRole === 'pastor' ? 'text-emerald-200' : 'text-[#5a6e63]'}`}>
              Pastores
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'pastor' ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">{pastorsCount}</div>
          <p className={`text-[11px] mt-0.5 ${selectedRole === 'pastor' ? 'text-emerald-300' : 'text-[#708579]'}`}>
            Púlpito e doutrinação
          </p>
        </div>

        <div 
          onClick={() => setSelectedRole(selectedRole === 'obreiro' ? 'all' : 'obreiro')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedRole === 'obreiro' 
              ? 'bg-blue-900 text-white border-blue-800 shadow-md ring-2 ring-blue-500' 
              : 'bg-white border-[#e2eae5] text-[#121c17] hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${selectedRole === 'obreiro' ? 'text-blue-200' : 'text-[#5a6e63]'}`}>
              Obreiros
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'obreiro' ? 'bg-white/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">{obreirosCount}</div>
          <p className={`text-[11px] mt-0.5 ${selectedRole === 'obreiro' ? 'text-blue-300' : 'text-[#708579]'}`}>
            Diáconos e cooperadores
          </p>
        </div>

        <div 
          onClick={() => setSelectedRole(selectedRole === 'musico' ? 'all' : 'musico')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedRole === 'musico' 
              ? 'bg-purple-900 text-white border-purple-800 shadow-md ring-2 ring-purple-500' 
              : 'bg-white border-[#e2eae5] text-[#121c17] hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${selectedRole === 'musico' ? 'text-purple-200' : 'text-[#5a6e63]'}`}>
              Músicos & Cantores
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'musico' ? 'bg-white/10 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">{musicosCount}</div>
          <p className={`text-[11px] mt-0.5 ${selectedRole === 'musico' ? 'text-purple-300' : 'text-[#708579]'}`}>
            Louvor, instrumentos e coro
          </p>
        </div>

        <div className="p-4 rounded-2xl border bg-white border-[#e2eae5] text-[#121c17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5a6e63]">
              Activos / Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">
            {activeCount} <span className="text-xs font-normal text-[#708579]">/ {workers.length}</span>
          </div>
          <p className="text-[11px] text-[#708579] mt-0.5">
            Disponíveis para escalas
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2eae5] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8a9f93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, cargo ou contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-[#121c17]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="inline-flex p-1 bg-[#f0f4f1] rounded-xl text-xs font-medium border border-[#dce5df]">
            <button
              onClick={() => setSelectedRole('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRole === 'all' 
                  ? 'bg-white text-emerald-950 shadow-xs font-bold' 
                  : 'text-[#5a6e63] hover:text-[#121c17]'
              }`}
            >
              Todos ({workers.length})
            </button>
            <button
              onClick={() => setSelectedRole('pastor')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRole === 'pastor' 
                  ? 'bg-emerald-700 text-white shadow-xs font-bold' 
                  : 'text-[#5a6e63] hover:text-[#121c17]'
              }`}
            >
              Pastores ({pastorsCount})
            </button>
            <button
              onClick={() => setSelectedRole('obreiro')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRole === 'obreiro' 
                  ? 'bg-blue-700 text-white shadow-xs font-bold' 
                  : 'text-[#5a6e63] hover:text-[#121c17]'
              }`}
            >
              Obreiros ({obreirosCount})
            </button>
            <button
              onClick={() => setSelectedRole('musico')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRole === 'musico' 
                  ? 'bg-purple-700 text-white shadow-xs font-bold' 
                  : 'text-[#5a6e63] hover:text-[#121c17]'
              }`}
            >
              Músicos ({musicosCount})
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-xs font-medium text-[#121c17] focus:outline-none"
          >
            <option value="all">Status: Todos</option>
            <option value="active">Apenas Activos</option>
            <option value="inactive">Apenas Inactivos</option>
          </select>
        </div>
      </div>

      {/* Workers Grid / Cards */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#d2dfd8] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Users2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#14231b]">Nenhum servo encontrado</h3>
          <p className="text-xs text-[#6a8074] max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || selectedRole !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de pesquisa para visualizar outros membros da equipa.'
              : 'Cadastre os pastores da igreja, os obreiros de apoio e os membros do ministério de louvor.'}
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleOpenAdd('pastor')}
              className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
            >
              + Adicionar Pastor
            </button>
            <button
              onClick={() => handleOpenAdd('obreiro')}
              className="px-3.5 py-2 bg-blue-700 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
            >
              + Adicionar Obreiro
            </button>
            <button
              onClick={() => handleOpenAdd('musico')}
              className="px-3.5 py-2 bg-purple-700 text-white text-xs font-bold rounded-xl hover:bg-purple-800 transition-colors shadow-sm"
            >
              + Adicionar Músico
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => {
            const isPastor = worker.role === 'pastor';
            const isObreiro = worker.role === 'obreiro';
            const isMusico = worker.role === 'musico';

            return (
              <div
                key={worker.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between hover:shadow-md ${
                  !worker.active ? 'opacity-65 border-[#e2eae5] bg-[#fafcfb]' : 'border-[#dbe5df]'
                }`}
              >
                <div>
                  {/* Card Header: Role Badge & Active Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        isPastor 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : isObreiro 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {isPastor && <ShieldCheck className="w-3 h-3" />}
                      {isObreiro && <Users2 className="w-3 h-3" />}
                      {isMusico && <Music className="w-3 h-3" />}
                      {isPastor ? 'Pastor' : isObreiro ? 'Obreiro' : 'Músico / Cantor'}
                    </span>

                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleActive(worker)}
                        title={worker.active ? 'Clique para marcar como inactivo' : 'Clique para marcar como activo'}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          worker.active 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {worker.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        worker.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {worker.active ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </div>

                  {/* Worker Name & Specific Sub-Role */}
                  <h3 className="text-base font-bold text-[#101b15] leading-snug">
                    {worker.name}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {worker.subRole || (isPastor ? 'Pastor' : isObreiro ? 'Diácono' : 'Louvor')}
                  </p>

                  {/* Contact Info */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-[#4c5f54]">
                    {worker.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#869b8f]" />
                        <span className="font-mono">{worker.phoneNumber}</span>
                      </div>
                    )}
                    {worker.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#869b8f]" />
                        <span className="truncate">{worker.email}</span>
                      </div>
                    )}
                    {worker.notes && (
                      <div className="flex items-start gap-2 pt-1 border-t border-[#f0f4f1] mt-2">
                        <FileText className="w-3.5 h-3.5 text-[#869b8f] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[#63796d] italic line-clamp-2">
                          {worker.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#edf2ee] flex items-center justify-between">
                  <span className="text-[10px] text-[#8ea498]">
                    ID: {worker.id.slice(0, 6)}...
                  </span>

                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(worker)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#3b5044] hover:bg-[#edf2ee] rounded-lg transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(worker.id, worker.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover servo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400 italic">Consulta</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-[#e2eae5] relative">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#101b15]">
                  {editingWorkerId ? 'Editar Servo / Líder' : 'Registar Servo / Líder'}
                </h3>
                <p className="text-xs text-[#63796d] mt-0.5">
                  Preencha os dados do pastor, obreiro ou membro do louvor.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#f4f7f5] hover:bg-[#e6ede8] flex items-center justify-center text-[#55695e] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Função Principal */}
              <div>
                <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-2">
                  Função / Ministério *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'pastor', subRole: getDefaultSubRole('pastor') })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      formData.role === 'pastor' 
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20' 
                        : 'bg-[#fafcfb] border-[#d8e4dd] text-[#556b5f]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Pastor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'obreiro', subRole: getDefaultSubRole('obreiro') })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      formData.role === 'obreiro' 
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20' 
                        : 'bg-[#fafcfb] border-[#d8e4dd] text-[#556b5f]'
                    }`}
                  >
                    <Users2 className="w-4 h-4 text-blue-700" />
                    <span>Obreiro / Diácono</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'musico', subRole: getDefaultSubRole('musico') })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      formData.role === 'musico' 
                        ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-500/20' 
                        : 'bg-[#fafcfb] border-[#d8e4dd] text-[#556b5f]'
                    }`}
                  >
                    <Music className="w-4 h-4 text-purple-700" />
                    <span>Músico / Cantor</span>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rev. Manuel Sitoe ou Ir. Sara Macuácua"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-[#121c17]"
                />
              </div>

              {/* Cargo / Especialidade Litúrgica */}
              <div>
                <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                  Cargo / Especialidade no Culto
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.role === 'pastor' 
                      ? 'Ex: Pastor Titular, Pastor Auxiliar, Pregador Convidado' 
                      : formData.role === 'obreiro' 
                      ? 'Ex: Diácono de Serviço, Chefe de Portaria, Apoio à Mesa' 
                      : 'Ex: Vocalista Líder, Soprano, Tecladista, Baixista'
                  }
                  value={formData.subRole}
                  onChange={(e) => setFormData({ ...formData, subRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-[#121c17]"
                />
              </div>

              {/* Contactos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                    Telefone / Celular (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="+258 84 000 0000"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-[#121c17]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.mz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-[#121c17]"
                  />
                </div>
              </div>

              {/* Activo / Inactivo Switch */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <label htmlFor="activeToggle" className="text-xs font-medium text-[#2d4035] cursor-pointer">
                  Disponível activamente para escalas litúrgicas e serviços dominicais
                </label>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                  Notas / Disponibilidade
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, horários preferenciais, instrumentos..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-xs focus:outline-none focus:border-emerald-600 text-[#121c17]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf2ee]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#485c50] hover:bg-[#edf2ee] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
                >
                  {submitting ? 'A guardar...' : editingWorkerId ? 'Actualizar Servo' : 'Registar Servo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
