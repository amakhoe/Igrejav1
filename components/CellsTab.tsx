'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChurchCell, CellTargetAudience } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  Home, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  X, 
  Share2, 
  MessageCircle, 
  Layers, 
  Info,
  Check,
  ChevronRight,
  ExternalLink,
  Lock
} from 'lucide-react';

const WEEKDAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

const TARGET_AUDIENCES: CellTargetAudience[] = [
  'Geral',
  'Jovens',
  'Mulheres',
  'Homens',
  'Casais',
  'Famílias',
  'Crianças'
];

const SAMPLE_CELLS: Omit<ChurchCell, 'id' | 'createdAt'>[] = [
  {
    name: 'Célula Betel',
    leaderName: 'Irmão Carlos Cossa',
    leaderPhone: '+258 84 213 4455',
    viceLeaderName: 'Irmã Maria Sitoe',
    hostName: 'Família Cossa',
    neighborhood: 'Malhangalene',
    address: 'Rua da Resistência, nº 420 (próximo à Escola Secundária)',
    meetingDay: 'Quarta-feira',
    meetingTime: '18:30',
    membersCount: 14,
    targetAudience: 'Geral',
    active: true,
    notes: 'Grupo em crescimento. Meta de multiplicação para Dezembro.'
  },
  {
    name: 'Célula Ebenézer',
    leaderName: 'Diácono Paulo Manhique',
    leaderPhone: '+258 82 901 8822',
    viceLeaderName: 'Irmão João Matsinhe',
    hostName: 'Família Manhique',
    neighborhood: 'Maxaquene',
    address: 'Av. Vladimir Lenine, Rua 4, Casa 18',
    meetingDay: 'Terça-feira',
    meetingTime: '19:00',
    membersCount: 11,
    targetAudience: 'Famílias',
    active: true,
    notes: 'Foco no acolhimento de novos convertidos e oração intercessória.'
  },
  {
    name: 'Célula Geração Eleita (Jovens)',
    leaderName: 'Líder Nelson Macuácua',
    leaderPhone: '+258 87 554 1120',
    viceLeaderName: 'Irmã Sara Langa',
    hostName: 'Casa da Juventude / Anexo',
    neighborhood: 'Polana Caniço',
    address: 'Próximo ao Mercado Janet',
    meetingDay: 'Sábado',
    meetingTime: '17:00',
    membersCount: 18,
    targetAudience: 'Jovens',
    active: true,
    notes: 'Célula dinâmica de louvor, estudo bíblico para estudantes e comunhão jovem.'
  },
  {
    name: 'Célula Maná Celeste (Mulheres)',
    leaderName: 'Pastora Ana Mondlane',
    leaderPhone: '+258 84 771 9933',
    viceLeaderName: 'Irmã Ruth Chissano',
    hostName: 'Irmã Teresa Nhantumbo',
    neighborhood: 'Alto Maé',
    address: 'Av. Eduardo Mondlane, Edifício 24 de Julho, Bloco B',
    meetingDay: 'Quinta-feira',
    meetingTime: '18:00',
    membersCount: 15,
    targetAudience: 'Mulheres',
    active: true,
    notes: 'Reunião semanal da Sociedade de Mulheres: oração pelo lar e discipulado.'
  },
  {
    name: 'Célula Monte das Oliveiras',
    leaderName: 'Irmão Marcos Guambe',
    leaderPhone: '+258 84 330 0011',
    viceLeaderName: 'Irmão António Bila',
    hostName: 'Família Guambe',
    neighborhood: 'Sommerschield',
    address: 'Rua do Palmar, Vivenda 12',
    meetingDay: 'Quarta-feira',
    meetingTime: '19:30',
    membersCount: 9,
    targetAudience: 'Geral',
    active: true,
    notes: 'Célula bíblica com foco em profissionais e estudo do livro de Romanos.'
  }
];

export default function CellsTab() {
  const { isAdmin, systemUser } = useAuth();
  const [cells, setCells] = useState<ChurchCell[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('todos');
  const [selectedAudience, setSelectedAudience] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todas');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCellId, setCurrentCellId] = useState<string | null>(null);
  const [detailCell, setDetailCell] = useState<ChurchCell | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    leaderName: '',
    leaderPhone: '',
    viceLeaderName: '',
    hostName: '',
    neighborhood: '',
    address: '',
    meetingDay: 'Quarta-feira',
    meetingTime: '18:30',
    membersCount: 8,
    targetAudience: 'Geral' as CellTargetAudience,
    active: true,
    notes: ''
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Real-time listener for cells collection
  useEffect(() => {
    const q = query(collection(db, 'cells'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ChurchCell[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        } as ChurchCell));
        // Sort active first, then by name
        loaded.sort((a, b) => {
          if (a.active === b.active) {
            return (a.name || '').localeCompare(b.name || '');
          }
          return a.active ? -1 : 1;
        });
        setCells(loaded);
        setLoading(false);
      },
      (error) => {
        console.warn('Erro ao carregar células:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered cells
  const filteredCells = useMemo(() => {
    return cells.filter((cell) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        cell.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cell.leaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cell.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cell.hostName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDay =
        selectedDay === 'todos' ||
        cell.meetingDay?.toLowerCase() === selectedDay.toLowerCase();

      const matchAudience =
        selectedAudience === 'todas' ||
        cell.targetAudience === selectedAudience;

      const matchStatus =
        selectedStatus === 'todas' ||
        (selectedStatus === 'ativas' && cell.active) ||
        (selectedStatus === 'inativas' && !cell.active);

      return matchSearch && matchDay && matchAudience && matchStatus;
    });
  }, [cells, searchQuery, selectedDay, selectedAudience, selectedStatus]);

  // Statistics
  const totalCells = cells.length;
  const activeCells = cells.filter((c) => c.active).length;
  const totalMembersInCells = cells.reduce((sum, c) => sum + (Number(c.membersCount) || 0), 0);
  const uniqueNeighborhoods = Array.from(new Set(cells.map((c) => c.neighborhood).filter(Boolean)));

  // Handlers
  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setIsEditing(false);
    setCurrentCellId(null);
    setFormData({
      name: '',
      leaderName: '',
      leaderPhone: '',
      viceLeaderName: '',
      hostName: '',
      neighborhood: '',
      address: '',
      meetingDay: 'Quarta-feira',
      meetingTime: '18:30',
      membersCount: 8,
      targetAudience: 'Geral',
      active: true,
      notes: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cell: ChurchCell) => {
    if (!isAdmin) return;
    setIsEditing(true);
    setCurrentCellId(cell.id);
    setFormData({
      name: cell.name || '',
      leaderName: cell.leaderName || '',
      leaderPhone: cell.leaderPhone || '',
      viceLeaderName: cell.viceLeaderName || '',
      hostName: cell.hostName || '',
      neighborhood: cell.neighborhood || '',
      address: cell.address || '',
      meetingDay: cell.meetingDay || 'Quarta-feira',
      meetingTime: cell.meetingTime || '18:30',
      membersCount: cell.membersCount || 8,
      targetAudience: (cell.targetAudience as CellTargetAudience) || 'Geral',
      active: cell.active !== false,
      notes: cell.notes || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Apenas utilizadores com perfil de administrador podem salvar células.');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Por favor informe o nome da célula.');
      return;
    }
    if (!formData.leaderName.trim()) {
      setFormError('Por favor informe o nome do líder.');
      return;
    }
    if (!formData.neighborhood.trim()) {
      setFormError('Por favor informe o bairro.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        name: formData.name.trim(),
        leaderName: formData.leaderName.trim(),
        leaderPhone: formData.leaderPhone.trim() || '',
        viceLeaderName: formData.viceLeaderName.trim() || '',
        hostName: formData.hostName.trim() || '',
        neighborhood: formData.neighborhood.trim(),
        address: formData.address.trim() || '',
        meetingDay: formData.meetingDay,
        meetingTime: formData.meetingTime,
        membersCount: Number(formData.membersCount) || 0,
        targetAudience: formData.targetAudience,
        active: Boolean(formData.active),
        notes: formData.notes.trim() || '',
        updatedAt: Date.now()
      };

      if (isEditing && currentCellId) {
        await updateDoc(doc(db, 'cells', currentCellId), payload);
      } else {
        await addDoc(collection(db, 'cells'), {
          ...payload,
          createdAt: Date.now()
        });
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const e = err as Error;
      setFormError('Erro ao gravar célula: ' + (e?.message || 'Tente novamente.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cell: ChurchCell) => {
    if (!isAdmin) return;
    try {
      const now = new Date().getTime();
      await updateDoc(doc(db, 'cells', cell.id), {
        active: !cell.active,
        updatedAt: now
      });
    } catch (err) {
      console.warn('Erro ao alternar estado da célula:', err);
    }
  };

  const handleDelete = async (cellId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'cells', cellId));
      setDeleteConfirmId(null);
      if (detailCell?.id === cellId) {
        setDetailCell(null);
      }
    } catch (err) {
      console.warn('Erro ao eliminar célula:', err);
    }
  };

  const handleSeedSamples = async () => {
    if (!isAdmin) return;
    try {
      setSubmitting(true);
      for (const item of SAMPLE_CELLS) {
        await addDoc(collection(db, 'cells'), {
          ...item,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      console.warn('Erro ao povoar células:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Células da Igreja
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeCells} Ativas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Pequenos grupos nos lares, comunhão e discipulado da congregação
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin ? (
            <>
              {cells.length === 0 && !loading && (
                <button
                  onClick={handleSeedSamples}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Povoar Exemplos</span>
                </button>
              )}
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Célula</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Modo de Consulta (Apenas Admin pode criar/editar)</span>
            </div>
          )}
        </div>
      </div>

      {/* Permission Reminder for Non-Admins */}
      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold">Perfil de Acesso Geral:</span> Está ligado com um utilizador comum sem privilégios de administração. Pode consultar todas as células da igreja, líderes, contactos e locais de reunião, mas não tem permissão para adicionar, alterar ou remover registos.
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-gray-600">Total de Células</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCells}</div>
          <p className="text-[11px] text-gray-500 mt-1">Grupos cadastrados</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-gray-600">Células Ativas</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {activeCells}
            <span className="text-xs font-normal text-gray-400 ml-1.5">
              ({totalCells > 0 ? Math.round((activeCells / totalCells) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Em funcionamento semanal</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-gray-600">Membros em Célula</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalMembersInCells}</div>
          <p className="text-[11px] text-gray-500 mt-1">Participantes assíduos estimados</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-gray-600">Bairros Cobertos</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{uniqueNeighborhoods.length}</div>
          <p className="text-[11px] text-gray-500 mt-1 truncate">
            {uniqueNeighborhoods.slice(0, 2).join(', ')}{uniqueNeighborhoods.length > 2 ? '...' : ''}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar célula, líder, bairro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Day of Week */}
          <div>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            >
              <option value="todos">Todos os Dias de Reunião</option>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            >
              <option value="todas">Todas as Redes / Públicos</option>
              {TARGET_AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  Rede: {a}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            >
              <option value="todas">Todos os Estados</option>
              <option value="ativas">Apenas Ativas</option>
              <option value="inativas">Apenas Inativas</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>
            A mostrar <strong className="text-gray-900">{filteredCells.length}</strong> de {cells.length} células
          </span>
          {(searchQuery || selectedDay !== 'todos' || selectedAudience !== 'todas' || selectedStatus !== 'todas') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDay('todos');
                setSelectedAudience('todas');
                setSelectedStatus('todas');
              }}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Cells Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">A carregar células da congregação...</p>
        </div>
      ) : filteredCells.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Nenhuma célula encontrada</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {cells.length === 0
              ? 'Ainda não existem células cadastradas no sistema. Clique em "+ Nova Célula" ou adicione os exemplos.'
              : 'Nenhum resultado corresponde aos filtros de pesquisa aplicados.'}
          </p>
          {isAdmin && cells.length === 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={handleSeedSamples}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Povoar Células de Exemplo
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Cadastrar Primeira Célula
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCells.map((cell) => {
            const cleanPhone = cell.leaderPhone?.replace(/[^0-9]/g, '');
            const whatsappUrl = cleanPhone 
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`A paz do Senhor Jesus, amado líder ${cell.leaderName}! Contacto da liderança da Igreja do Nazareno a respeito da ${cell.name}.`)}`
              : null;

            return (
              <div
                key={cell.id}
                className={`flex flex-col justify-between p-5 rounded-2xl bg-white border transition-all hover:shadow-md ${
                  cell.active
                    ? 'border-gray-200/90 hover:border-emerald-500/50'
                    : 'border-gray-200 bg-gray-50/70 opacity-75'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        cell.active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-200 text-gray-600 border border-gray-300'
                      }`}>
                        {cell.active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {cell.targetAudience || 'Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                        <Users className="w-3 h-3 text-emerald-600" />
                        {cell.membersCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Cell Name */}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
                    {cell.name}
                  </h3>

                  {/* Neighborhood & Location */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-gray-800">{cell.neighborhood}</span>
                    {cell.address && (
                      <span className="text-gray-400 truncate">• {cell.address}</span>
                    )}
                  </div>

                  {/* Leader Info */}
                  <div className="mt-3.5 p-3 rounded-xl bg-gray-50/90 border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Líder:</span>
                      <span className="font-bold text-gray-900 truncate max-w-[180px]">{cell.leaderName}</span>
                    </div>
                    {cell.viceLeaderName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Co-Líder:</span>
                        <span className="text-gray-700 truncate max-w-[180px]">{cell.viceLeaderName}</span>
                      </div>
                    )}
                    {cell.hostName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Anfitrião:</span>
                        <span className="text-gray-700 truncate max-w-[180px]">{cell.hostName}</span>
                      </div>
                    )}
                  </div>

                  {/* Meeting Time & Day */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/60 text-emerald-900 border border-emerald-100">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{cell.meetingDay}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/60 text-emerald-900 border border-emerald-100">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{cell.meetingTime}</span>
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {cell.notes && (
                    <p className="text-[11px] text-gray-500 mt-2.5 line-clamp-2 italic">
                      &ldquo;{cell.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Contactar Líder via WhatsApp"
                        className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setDetailCell(cell)}
                      className="text-xs font-semibold text-gray-600 hover:text-emerald-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>

                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(cell)}
                        title={cell.active ? 'Desativar Célula' : 'Ativar Célula'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          cell.active
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {cell.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(cell)}
                        title="Editar Célula"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(cell.id)}
                        title="Eliminar Célula"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">Leitura</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar / Editar Célula */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {isEditing ? 'Editar Célula' : 'Cadastrar Nova Célula'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Defina os dados do pequeno grupo, dia de reunião e líder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome da Célula & Rede */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome da Célula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Célula Betel"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rede / Faixa Etária *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as CellTargetAudience })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {TARGET_AUDIENCES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Líder & Telefone WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Líder da Célula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do líder"
                    value={formData.leaderName}
                    onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contacto / WhatsApp do Líder
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +258 84 123 4567"
                    value={formData.leaderPhone}
                    onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Co-Líder & Anfitrião */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Co-Líder / Auxiliar
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do co-líder (opcional)"
                    value={formData.viceLeaderName}
                    onChange={(e) => setFormData({ ...formData, viceLeaderName: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Anfitrião da Casa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Família Cossa / Irmão João"
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Bairro & Endereço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bairro (Maputo / Matola) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Malhangalene, Maxaquene, Alto Maé..."
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Morada / Ponto de Referência
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número da casa, referência"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Dia da Reunião, Horário & Participantes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dia da Reunião *
                  </label>
                  <select
                    value={formData.meetingDay}
                    onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Horário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 18:30"
                    value={formData.meetingTime}
                    onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Membros Frequentes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="Qtd estimada"
                    value={formData.membersCount}
                    onChange={(e) => setFormData({ ...formData, membersCount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-xs sm:text-sm font-semibold text-gray-800 cursor-pointer">
                  Célula Ativa (Reuniões em curso semanalmente)
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observações, Metas & Motivos de Oração
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Metas de multiplicação, orações específicas, perfil dos membros acolhidos..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'A salvar...' : isEditing ? 'Guardar Alterações' : 'Criar Célula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes da Célula */}
      {detailCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    detailCell.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {detailCell.active ? 'Ativa' : 'Inativa'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {detailCell.targetAudience}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{detailCell.name}</h3>
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Bairro {detailCell.neighborhood}
                </p>
              </div>
              <button
                onClick={() => setDetailCell(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium block">Dia da Reunião</span>
                <span className="text-gray-900 font-bold mt-0.5 block">{detailCell.meetingDay}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium block">Horário</span>
                <span className="text-gray-900 font-bold mt-0.5 block">{detailCell.meetingTime}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium block">Líder Responsável</span>
                <span className="text-gray-900 font-bold mt-0.5 block">{detailCell.leaderName}</span>
                {detailCell.leaderPhone && (
                  <span className="text-emerald-700 font-mono text-[11px] block mt-0.5">
                    {detailCell.leaderPhone}
                  </span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium block">Membros Frequentes</span>
                <span className="text-gray-900 font-bold mt-0.5 block">{detailCell.membersCount} participantes</span>
              </div>
            </div>

            {/* Additional details */}
            <div className="space-y-2 text-xs">
              {detailCell.viceLeaderName && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Co-Líder / Auxiliar:</span>
                  <span className="font-semibold text-gray-800">{detailCell.viceLeaderName}</span>
                </div>
              )}
              {detailCell.hostName && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Anfitrião da Casa:</span>
                  <span className="font-semibold text-gray-800">{detailCell.hostName}</span>
                </div>
              )}
              {detailCell.address && (
                <div className="py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium block">Endereço / Referência:</span>
                  <span className="font-semibold text-gray-800 block mt-0.5">{detailCell.address}</span>
                </div>
              )}
              {detailCell.notes && (
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-emerald-900 font-bold block mb-1">Observações & Metas</span>
                  <p className="text-gray-700 leading-relaxed italic">{detailCell.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              {detailCell.leaderPhone ? (
                <a
                  href={`https://wa.me/${detailCell.leaderPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp do Líder</span>
                </a>
              ) : <div />}

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const c = detailCell;
                      setDetailCell(null);
                      handleOpenEdit(c);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => setDetailCell(null)}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">Eliminar Célula?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tem a certeza que deseja remover este registo de célula? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
