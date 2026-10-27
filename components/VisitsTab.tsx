'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Visit, Member, ChurchWorker } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  CalendarDays,
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Lock,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  MessageCircle,
  MapPin,
  List,
  Sparkles,
  X,
  AlertCircle,
  HeartHandshake,
  Check,
  CalendarCheck2,
  CalendarRange
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const VISIT_PURPOSES = [
  'Oração e Bênção do Lar',
  'Aconselhamento Pastoral',
  'Visita a Enfermo / Saúde',
  'Acompanhamento de Novos Convertidos',
  'Apoio Familiar e Casais',
  'Visita de Fortalecimento / Rotina',
  'Outro Assunto Espiritual'
];

export default function VisitsTab() {
  const { isAdmin } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [workers, setWorkers] = useState<ChurchWorker[]>([]);
  
  // View mode: 'calendar' | 'cards'
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed'>('all');

  // Form state
  const [newVisit, setNewVisit] = useState({
    memberId: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '15:00',
    visitorName: '',
    purpose: 'Oração e Bênção do Lar',
    address: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed'
  });

  // Load visits, members, and church workers (pastors)
  useEffect(() => {
    const qVisits = query(collection(db, 'visits'));
    const unsubsVisits = onSnapshot(
      qVisits,
      (snapshot) => {
        const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Visit));
        setVisits(loaded.sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
      },
      (err) => {
        console.warn('Erro ao carregar visitas:', err);
      }
    );

    const qMembers = query(collection(db, 'members'));
    const unsubsMembers = onSnapshot(
      qMembers,
      (snapshot) => {
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      },
      (err) => {
        console.warn('Erro ao carregar membros:', err);
      }
    );

    const qWorkers = query(collection(db, 'church_workers'));
    const unsubsWorkers = onSnapshot(
      qWorkers,
      (snapshot) => {
        setWorkers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChurchWorker)));
      },
      (err) => {
        console.warn('Erro ao carregar obreiros:', err);
      }
    );

    return () => {
      unsubsVisits();
      unsubsMembers();
      unsubsWorkers();
    };
  }, []);

  // Derived selected visit from ID
  const selectedVisit = useMemo(() => {
    if (!selectedVisitId) return null;
    return visits.find(v => v.id === selectedVisitId) || null;
  }, [visits, selectedVisitId]);

  // Pastors list for quick assignment
  const pastorsList = useMemo(() => {
    return workers.filter(w => w.role === 'pastor' || w.role === 'obreiro');
  }, [workers]);

  // Calendar computations
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Dom) to 6 (Sáb)
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      visits: Visit[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      const dayVisits = visits.filter(v => v.visitDate === dateStr);
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        visits: dayVisits
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const curDate = new Date(year, month, day);
      const dateStr = curDate.toISOString().split('T')[0];
      const dayVisits = visits.filter(v => v.visitDate === dateStr);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        visits: dayVisits
      });
    }

    // Next month filler days to complete rows of 7
    const remainingDays = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = nextDate.toISOString().split('T')[0];
      const dayVisits = visits.filter(v => v.visitDate === dateStr);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        visits: dayVisits
      });
    }

    return cells;
  }, [currentDate, visits]);

  // Upcoming scheduled visits spotlight
  const upcomingVisits = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return visits
      .filter(v => v.status === 'scheduled' && v.visitDate >= today)
      .sort((a, b) => {
        if (a.visitDate === b.visitDate) {
          return (a.visitTime || '').localeCompare(b.visitTime || '');
        }
        return a.visitDate.localeCompare(b.visitDate);
      });
  }, [visits]);

  // Stats
  const scheduledCount = visits.filter(v => v.status === 'scheduled').length;
  const completedCount = visits.filter(v => v.status === 'completed').length;

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Add Visit
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

      setShowAddModal(false);
      setNewVisit({
        memberId: '',
        visitDate: new Date().toISOString().split('T')[0],
        visitTime: '15:00',
        visitorName: '',
        purpose: 'Oração e Bênção do Lar',
        address: '',
        notes: '',
        status: 'scheduled'
      });
    } catch (err) {
      console.error('Erro ao agendar visita:', err);
    }
  };

  // Quick schedule for a specific date from calendar
  const handleOpenAddForDate = (dateStr: string) => {
    if (!isAdmin) return;
    setNewVisit(prev => ({
      ...prev,
      visitDate: dateStr
    }));
    setShowAddModal(true);
  };

  // Toggle status
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

  // Delete visit
  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Apenas administradores têm permissão para remover visitas.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este agendamento pastoral?')) {
      try {
        await deleteDoc(doc(db, 'visits', id));
        if (selectedVisitId === id) {
          setSelectedVisitId(null);
        }
      } catch (err) {
        console.error('Erro ao remover visita:', err);
      }
    }
  };

  // Seed sample data if empty
  const handleSeedVisits = async () => {
    if (!isAdmin) return;
    try {
      let targetMembers = [...members];
      if (targetMembers.length === 0) {
        // create a couple demo members
        const demoM1 = await addDoc(collection(db, 'members'), {
          name: 'Irmão Mateus Tembe',
          dateOfBirth: '1988-06-14',
          phoneNumber: '+258 84 312 9940',
          isBaptized: true,
          isTransferred: false,
          address: 'Bairro de Malhangalene, Rua 12, Casa 45',
          createdAt: Date.now()
        });
        const demoM2 = await addDoc(collection(db, 'members'), {
          name: 'Irmã Albertina Macuácua',
          dateOfBirth: '1975-11-20',
          phoneNumber: '+258 82 891 0022',
          isBaptized: true,
          isTransferred: false,
          address: 'Bairro Maxaquene A, Av. das FPLM',
          createdAt: Date.now()
        });
        const demoM3 = await addDoc(collection(db, 'members'), {
          name: 'Jovem Samuel Sitoe',
          dateOfBirth: '2004-03-05',
          phoneNumber: '+258 86 540 1289',
          isBaptized: false,
          isTransferred: false,
          address: 'Bairro da Polana Caniço B',
          createdAt: Date.now()
        });
        targetMembers = [
          { id: demoM1.id, name: 'Irmão Mateus Tembe', phoneNumber: '+258 84 312 9940', dateOfBirth: '1988-06-14', isBaptized: true, isTransferred: false, createdAt: Date.now() },
          { id: demoM2.id, name: 'Irmã Albertina Macuácua', phoneNumber: '+258 82 891 0022', dateOfBirth: '1975-11-20', isBaptized: true, isTransferred: false, createdAt: Date.now() },
          { id: demoM3.id, name: 'Jovem Samuel Sitoe', phoneNumber: '+258 86 540 1289', dateOfBirth: '2004-03-05', isBaptized: false, isTransferred: false, createdAt: Date.now() }
        ];
      }

      const today = new Date();
      const in2Days = new Date(today);
      in2Days.setDate(today.getDate() + 2);
      const in5Days = new Date(today);
      in5Days.setDate(today.getDate() + 5);
      const in8Days = new Date(today);
      in8Days.setDate(today.getDate() + 8);

      const toDateStr = (d: Date) => d.toISOString().split('T')[0];

      await addDoc(collection(db, 'visits'), {
        memberId: targetMembers[0]?.id || '',
        visitDate: toDateStr(in2Days),
        visitTime: '16:00',
        visitorName: 'Pastor Titular & Diácono Tomás',
        purpose: 'Oração e Bênção do Lar',
        address: 'Bairro de Malhangalene, Próximo à Escola Primária',
        status: 'scheduled',
        notes: 'Família pediu oração pela nova residência e dedicação do novo negócio.',
        createdAt: Date.now()
      });

      if (targetMembers[1]) {
        await addDoc(collection(db, 'visits'), {
          memberId: targetMembers[1].id,
          visitDate: toDateStr(in5Days),
          visitTime: '14:30',
          visitorName: 'Pastora Ana & Irmã Graça',
          purpose: 'Visita a Enfermo / Saúde',
          address: 'Bairro Maxaquene A, Rua das Acácias',
          status: 'scheduled',
          notes: 'Recuperação de cirurgia, levar comunhão e palavras de ânimo espiritual.',
          createdAt: Date.now()
        });
      }

      if (targetMembers[2]) {
        await addDoc(collection(db, 'visits'), {
          memberId: targetMembers[2].id,
          visitDate: toDateStr(in8Days),
          visitTime: '17:00',
          visitorName: 'Líder dos Jovens & Pastor',
          purpose: 'Acompanhamento de Novos Convertidos',
          address: 'Bairro da Polana Caniço B',
          status: 'scheduled',
          notes: 'Decidiu batizar-se no último culto. Conversar sobre o curso de batismo.',
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error('Erro ao gerar dados de exemplo:', err);
    }
  };

  // Helper to format friendly relative date
  const getRelativeDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return { label: 'Hoje', isToday: true, isUrgent: true };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return { label: 'Amanhã', isToday: false, isUrgent: true };

    const visitD = new Date(dateStr + 'T00:00:00');
    const nowD = new Date(today + 'T00:00:00');
    const diffDays = Math.round((visitD.getTime() - nowD.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 1 && diffDays <= 7) {
      return { label: `Em ${diffDays} dias`, isToday: false, isUrgent: false };
    }

    const day = String(visitD.getDate()).padStart(2, '0');
    const month = String(visitD.getMonth() + 1).padStart(2, '0');
    return { label: `${day}/${month}`, isToday: false, isUrgent: false };
  };

  // WhatsApp helper
  const getWhatsAppLink = (phone: string, memberName: string, visit: Visit) => {
    // clean phone numbers (e.g. "+258 84 123 4567" -> "258841234567")
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const dateFormatted = new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeText = visit.visitTime ? ` às ${visit.visitTime}` : '';
    const message = encodeURIComponent(
      `Graça e Paz, prezado(a) ${memberName}! Entramos em contacto da Igreja a respeito da nossa visita pastoral agendada para ${dateFormatted}${timeText}. Que Deus abençoe o vosso lar!`
    );
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  // Find member for the detail modal
  const selectedMember = useMemo(() => {
    if (!selectedVisit) return null;
    return members.find(m => m.id === selectedVisit.memberId) || null;
  }, [selectedVisit, members]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e2eae5] shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#0e1613] tracking-tight">Visitas Pastorais</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  {visits.length} registadas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#61776b] mt-0.5">
                Calendário e acompanhamento pastoral aos lares, famílias e enfermos da igreja
              </p>
            </div>
          </div>
        </div>

        {/* View toggles & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Calendar / Cards */}
          <div className="flex items-center bg-[#f2f7f4] p-1 rounded-2xl border border-[#dfe8e2]">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-[#61776b] hover:text-[#0e1613]'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Calendário</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-[#61776b] hover:text-[#0e1613]'
              }`}
            >
              <List className="w-4 h-4 text-emerald-600" />
              <span>Lista de Visitas</span>
            </button>
          </div>

          {isAdmin ? (
            <button 
              onClick={() => {
                setNewVisit(prev => ({
                  ...prev,
                  visitDate: new Date().toISOString().split('T')[0]
                }));
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-[#0e1613] hover:bg-[#1a2821] text-white px-4 py-2.5 rounded-2xl transition-all font-semibold text-xs shadow-xs hover:shadow-emerald-950/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Agendar Visita</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Modo Consulta</span>
            </div>
          )}
        </div>
      </div>

      {/* Spotlight: Próximos Agendamentos (Upcoming Appointments) */}
      <section className="bg-linear-to-br from-[#0e1613] to-[#17251f] rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-[#23352c]">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <CalendarRange className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Próximos Agendamentos Pastorais
                {upcomingVisits.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] rounded-full font-medium border border-emerald-500/30">
                    {upcomingVisits.length} agendados
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/70">
                Visitas programadas para os próximos dias. Clique em qualquer agendamento para abrir os detalhes do membro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/60">
              {scheduledCount} pendentes • {completedCount} realizadas
            </span>
          </div>
        </div>

        {upcomingVisits.length === 0 ? (
          <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white/90">Não existem visitas pastorais agendadas para as próximas datas.</p>
            <p className="text-xs text-white/60 mt-1 max-w-md">
              Mantenha o rebanho edificado agendando orações nos lares, apoio a famílias em dificuldade ou acompanhamento espiritual.
            </p>
            {isAdmin && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0e1613] rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar Primeira Visita
                </button>
                <button
                  onClick={handleSeedVisits}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Carregar Exemplos
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upcomingVisits.slice(0, 6).map((visit) => {
              const member = members.find(m => m.id === visit.memberId);
              const relative = getRelativeDateLabel(visit.visitDate);

              return (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisitId(visit.id)}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        relative.isToday
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {relative.label}
                      </span>

                      {visit.visitTime && (
                        <span className="text-xs text-white/80 font-mono font-medium">
                          {visit.visitTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-3 mt-1">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                        {member?.name ? member.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-emerald-300 transition-colors">
                          {member?.name || 'Membro não identificado'}
                        </h4>
                        <p className="text-xs text-emerald-200/80 truncate mt-0.5">
                          {visit.purpose || 'Oração e Visita Pastoral'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
                    <span className="truncate max-w-[150px] flex items-center gap-1 text-white/60">
                      <User className="w-3 h-3 text-emerald-400 shrink-0" />
                      {visit.visitorName || 'Pastor Designado'}
                    </span>
                    <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                      Ver Detalhes →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main View: Calendar OR Cards List */}
      {viewMode === 'calendar' ? (
        <section className="bg-white rounded-3xl border border-[#e2eae5] shadow-xs overflow-hidden">
          {/* Calendar Header with Navigation */}
          <div className="p-5 sm:p-6 border-b border-[#eaf1ec] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-[#fbfdfc] to-[#f4f8f5]">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-[#0e1613] tracking-tight">
                {MONTH_NAMES[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </h3>
              <button
                onClick={handleGoToday}
                className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-[#cfe0d5] transition-colors cursor-pointer shadow-2xs"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#61776b] mr-2 hidden md:inline">
                Navegar mês:
              </span>
              <button
                onClick={handlePrevMonth}
                aria-label="Mês Anterior"
                className="p-2 rounded-xl bg-white hover:bg-[#edf4ef] border border-[#dce6df] text-[#0e1613] transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Mês Seguinte"
                className="p-2 rounded-xl bg-white hover:bg-[#edf4ef] border border-[#dce6df] text-[#0e1613] transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 sm:p-6">
            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[#61776b] uppercase tracking-wider py-1">
              {WEEK_DAYS.map((day, idx) => (
                <div key={day} className={idx === 0 ? 'text-rose-600' : ''}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarData.map((cell, index) => {
                const hasVisits = cell.visits.length > 0;
                const hasScheduled = cell.visits.some(v => v.status === 'scheduled');

                return (
                  <div
                    key={`${cell.dateStr}-${index}`}
                    className={`min-h-[96px] sm:min-h-[120px] rounded-2xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between group relative ${
                      cell.isCurrentMonth
                        ? 'bg-white border-[#e5ece8] hover:border-emerald-300 hover:shadow-xs'
                        : 'bg-[#fafcfb]/60 border-[#edf2ef] text-zinc-300'
                    } ${cell.isToday ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}`}
                  >
                    {/* Top bar in cell: Day number and quick add */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-[#0e1613]'
                            : 'text-zinc-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Quick schedule button for admin on hover */}
                      {isAdmin && cell.isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddForDate(cell.dateStr);
                          }}
                          title={`Agendar visita para ${cell.dateStr}`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-emerald-700 hover:bg-emerald-100 rounded-md transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Day visits badges list */}
                    <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                      {cell.visits.slice(0, 3).map((visit) => {
                        const member = members.find(m => m.id === visit.memberId);
                        const isCompleted = visit.status === 'completed';

                        return (
                          <button
                            key={visit.id}
                            onClick={() => setSelectedVisitId(visit.id)}
                            className={`w-full text-left p-1 sm:p-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium leading-tight truncate transition-all cursor-pointer flex items-center gap-1 border ${
                              isCompleted
                                ? 'bg-zinc-100/90 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-semibold'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isCompleted ? 'bg-zinc-400' : 'bg-emerald-500'
                              }`}
                            />
                            {visit.visitTime && (
                              <span className="font-mono text-[9px] text-[#425e4f] shrink-0">
                                {visit.visitTime}
                              </span>
                            )}
                            <span className="truncate">
                              {member?.name ? member.name.split(' ')[0] : 'Visita'}
                            </span>
                          </button>
                        );
                      })}

                      {cell.visits.length > 3 && (
                        <button
                          onClick={() => setSelectedVisitId(cell.visits[0].id)}
                          className="w-full text-center text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer py-0.5"
                        >
                          +{cell.visits.length - 3} mais
                        </button>
                      )}
                    </div>

                    {/* Bottom status dot on mobile */}
                    {hasVisits && (
                      <div className="flex sm:hidden justify-center pt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasScheduled ? 'bg-emerald-600' : 'bg-zinc-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="mt-6 pt-4 border-t border-[#edf2ef] flex flex-wrap items-center justify-between text-xs text-[#61776b] gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Visita Agendada (Pendente)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                  <span>Visita Realizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full ring-2 ring-emerald-500 bg-emerald-100" />
                  <span>Hoje</span>
                </div>
              </div>

              <div className="text-[11px] text-[#7d9286] italic">
                Dica: Clique em qualquer visita no calendário para abrir os detalhes completos do membro e contactá-lo.
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Alternative View: Cards Grid with Filters */
        <section className="space-y-4">
          {/* Status filters */}
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e2eae5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#3d5246]">Filtrar por:</span>
              <div className="flex items-center gap-1.5 bg-[#f2f7f4] p-1 rounded-xl">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-[#61776b] hover:text-[#0e1613]'
                  }`}
                >
                  Todas ({visits.length})
                </button>
                <button
                  onClick={() => setFilterStatus('scheduled')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterStatus === 'scheduled'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-[#61776b] hover:text-[#0e1613]'
                  }`}
                >
                  Agendadas ({scheduledCount})
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterStatus === 'completed'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-[#61776b] hover:text-[#0e1613]'
                  }`}
                >
                  Realizadas ({completedCount})
                </button>
              </div>
            </div>

            <span className="text-xs text-[#7d9286]">
              A mostrar {visits.filter(v => filterStatus === 'all' || v.status === filterStatus).length} visitas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visits
              .filter(v => filterStatus === 'all' || v.status === filterStatus)
              .map((visit) => {
                const member = members.find(m => m.id === visit.memberId);
                const isCompleted = visit.status === 'completed';

                return (
                  <div
                    key={visit.id}
                    onClick={() => setSelectedVisitId(visit.id)}
                    className="bg-white rounded-3xl shadow-xs border border-[#e2eae5] overflow-hidden flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className={`p-5 border-b border-[#f0f5f2] ${isCompleted ? 'bg-[#fbfdfc]' : 'bg-white'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            {member?.name ? member.name.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#0e1613] text-sm group-hover:text-emerald-700 transition-colors">
                              {member?.name || 'Membro não encontrado'}
                            </h3>
                            <p className="text-[11px] text-[#61776b]">
                              {visit.purpose || 'Visita Pastoral'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 text-[11px] rounded-full font-semibold flex-shrink-0 ${
                            isCompleted
                              ? 'bg-[#e3f4e9] text-[#0d6b38] border border-[#c6e9d2]'
                              : 'bg-[#fef3e2] text-[#9a4e0a] border border-[#fde4be]'
                          }`}
                        >
                          {isCompleted ? 'Realizada' : 'Agendada'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#5f786b] mt-3 pt-2 border-t border-[#f4f7f5]">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('pt-PT')}</span>
                        </div>
                        {visit.visitTime && (
                          <div className="flex items-center gap-1 text-[#0e1613] font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-[#5f786b]" />
                            <span>{visit.visitTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 text-xs text-[#4b6355] leading-relaxed">
                      {visit.notes ? (
                        <p className="line-clamp-2">{visit.notes}</p>
                      ) : (
                        <p className="italic text-[#91a89c]">Sem observações adicionais.</p>
                      )}

                      {visit.visitorName && (
                        <p className="mt-2 text-[11px] text-[#668072] flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Pastor/Responsável: <strong>{visit.visitorName}</strong></span>
                        </p>
                      )}
                    </div>

                    <div
                      className="p-4 border-t border-[#f0f5f2] bg-[#fbfdfc] flex justify-between items-center mt-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedVisitId(visit.id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        Ver Perfil do Membro →
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleStatus(visit)}
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                            title={isCompleted ? 'Marcar como Pendente' : 'Marcar como Realizada'}
                          >
                            <CheckCircle className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-zinc-400'}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(visit.id)}
                            className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remover Visita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* DETAIL MODAL: Informações Completas do Membro e da Visita */}
      <AnimatePresence>
        {selectedVisit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#dce6df] my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#eaf1ec] bg-linear-to-r from-[#0e1613] to-[#182620] text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Acompanhamento Pastoral
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Detalhes da Visita & Membro
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVisitId(null)}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
                {/* Status bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f8f5] border border-[#dce7e1]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#2d4236]">Estado do Agendamento:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedVisit.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {selectedVisit.status === 'completed' ? '✓ Visita Realizada' : '⏳ Agendada (Pendente)'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => toggleStatus(selectedVisit)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-[#cfe0d5] text-emerald-900 font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedVisit.status === 'completed' ? 'Reabrir como Pendente' : 'Marcar Realizada'}
                    </button>
                  )}
                </div>

                {/* MEMBER PROFILE CARD */}
                <div className="bg-[#fbfdfc] border border-[#e2eae5] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#edf4ef] pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#456152] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      Perfil do Membro a Visitar
                    </h4>
                    {selectedMember && (
                      <span className="text-[11px] text-[#71887c]">
                        ID: {selectedMember.id.slice(0, 8)}
                      </span>
                    )}
                  </div>

                  {selectedMember ? (
                    <div className="space-y-4">
                      {/* Name and avatar */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
                          {selectedMember.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-[#0e1613]">
                            {selectedMember.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                selectedMember.isBaptized
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              }`}
                            >
                              {selectedMember.isBaptized ? 'Batizado nas Águas' : 'Não Batizado'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                selectedMember.isTransferred
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {selectedMember.isTransferred ? 'Transferência' : 'Membro Efetivo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Address Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* Phone with WhatsApp actions */}
                        <div className="p-3 bg-white rounded-xl border border-[#e2eae5] space-y-2">
                          <span className="text-[11px] text-[#61776b] font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            Contacto Telefónico
                          </span>
                          <p className="font-bold text-[#0e1613] text-xs">
                            {selectedMember.phoneNumber || 'Sem contacto telefónico'}
                          </p>

                          {selectedMember.phoneNumber && (
                            <div className="flex items-center gap-2 pt-1">
                              <a
                                href={`tel:${selectedMember.phoneNumber}`}
                                className="px-2.5 py-1 bg-[#edf4ef] hover:bg-[#dce7df] text-emerald-900 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Phone className="w-3 h-3 text-emerald-700" />
                                Ligar
                              </a>
                              <a
                                href={getWhatsAppLink(selectedMember.phoneNumber, selectedMember.name, selectedVisit)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Address / Location */}
                        <div className="p-3 bg-white rounded-xl border border-[#e2eae5] space-y-1">
                          <span className="text-[11px] text-[#61776b] font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            Localização / Residência
                          </span>
                          <p className="font-semibold text-[#0e1613] text-xs">
                            {selectedVisit.address || selectedMember.address || 'Bairro na cidade de Maputo'}
                          </p>
                          <p className="text-[10px] text-[#789384]">
                            Consulte com a família o ponto de referência antes de se deslocar.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <p>
                        Membro original não encontrado ou foi removido do cadastro.
                      </p>
                    </div>
                  )}
                </div>

                {/* VISIT SPECIFICS */}
                <div className="bg-[#fbfdfc] border border-[#e2eae5] rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#456152] flex items-center gap-1.5 border-b border-[#edf4ef] pb-3">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    Dados do Agendamento Pastoral
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-[#e2eae5]">
                      <span className="text-[11px] text-[#61776b] font-medium">Data Agendada</span>
                      <p className="font-bold text-[#0e1613] text-sm mt-0.5">
                        {new Date(selectedVisit.visitDate + 'T00:00:00').toLocaleDateString('pt-PT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e2eae5]">
                      <span className="text-[11px] text-[#61776b] font-medium">Horário Previsto</span>
                      <p className="font-bold text-[#0e1613] text-sm mt-0.5 font-mono">
                        {selectedVisit.visitTime || 'A combinar com o irmão'}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e2eae5]">
                      <span className="text-[11px] text-[#61776b] font-medium">Motivo / Propósito da Visita</span>
                      <p className="font-bold text-emerald-800 text-xs mt-0.5">
                        {selectedVisit.purpose || 'Oração e Bênção do Lar'}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e2eae5]">
                      <span className="text-[11px] text-[#61776b] font-medium">Pastor / Responsável Designado</span>
                      <p className="font-bold text-[#0e1613] text-xs mt-0.5">
                        {selectedVisit.visitorName || 'Pastor Titular'}
                      </p>
                    </div>
                  </div>

                  {/* Notes / Observações */}
                  <div className="p-4 bg-white rounded-xl border border-[#e2eae5]">
                    <span className="text-[11px] text-[#61776b] font-medium block mb-1">
                      Observações Pastorais & Pedidos de Oração
                    </span>
                    {selectedVisit.notes ? (
                      <p className="text-xs text-[#2c3d33] leading-relaxed whitespace-pre-wrap">
                        {selectedVisit.notes}
                      </p>
                    ) : (
                      <p className="text-xs italic text-[#8ca094]">
                        Nenhuma observação registada para esta visita.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-5 border-t border-[#edf4ef] bg-[#fbfdfc] flex flex-wrap items-center justify-between gap-3">
                {isAdmin ? (
                  <button
                    onClick={() => handleDelete(selectedVisit.id)}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover Agendamento
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedVisitId(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#61776b] hover:bg-[#edf4ef] rounded-xl transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  {selectedMember?.phoneNumber && (
                    <a
                      href={getWhatsAppLink(selectedMember.phoneNumber, selectedMember.name, selectedVisit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contactar Membro
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE VISIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#e2eae5] my-6"
            >
              <div className="p-6 border-b border-[#eaf1ec] bg-linear-to-r from-[#0e1613] to-[#182620] text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Agendar Visita Pastoral</h3>
                  <p className="text-xs text-emerald-300/80">
                    Marque um momento de aconselhamento, oração no lar ou assistência espiritual
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddVisit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                {/* Member selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                    Membro a Visitar *
                  </label>
                  <select 
                    required
                    value={newVisit.memberId}
                    onChange={(e) => {
                      const selected = members.find(m => m.id === e.target.value);
                      setNewVisit({
                        ...newVisit,
                        memberId: e.target.value,
                        address: selected?.address || newVisit.address
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="">Selecione o membro...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.phoneNumber ? `(${m.phoneNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                      Data da Visita *
                    </label>
                    <input 
                      type="date" 
                      required
                      value={newVisit.visitDate}
                      onChange={(e) => setNewVisit({...newVisit, visitDate: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                      Horário Previsto
                    </label>
                    <input 
                      type="time" 
                      value={newVisit.visitTime}
                      onChange={(e) => setNewVisit({...newVisit, visitTime: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                    Motivo / Propósito da Visita
                  </label>
                  <select
                    value={newVisit.purpose}
                    onChange={(e) => setNewVisit({...newVisit, purpose: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    {VISIT_PURPOSES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Visitor / Pastor */}
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                    Pastor ou Obreiro Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pastor Titular, Pastora Ana ou Diácono"
                    list="pastors-list"
                    value={newVisit.visitorName}
                    onChange={(e) => setNewVisit({...newVisit, visitorName: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <datalist id="pastors-list">
                    {pastorsList.map(p => (
                      <option key={p.id} value={p.name}>{p.role} - {p.name}</option>
                    ))}
                  </datalist>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                    Endereço / Bairro da Visita (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bairro de Malhangalene, Rua 12..."
                    value={newVisit.address}
                    onChange={(e) => setNewVisit({...newVisit, address: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-[#3d5246] mb-1.5">
                    Observações & Assuntos a Abordar
                  </label>
                  <textarea 
                    rows={3}
                    value={newVisit.notes}
                    onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dce6df] rounded-xl text-xs text-[#0e1613] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                    placeholder="Pedidos específicos de oração, detalhes da situação familiar..."
                  />
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-[#f0f5f2]">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 text-xs text-[#61776b] font-semibold hover:bg-[#edf4ef] rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Confirmar Agendamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
