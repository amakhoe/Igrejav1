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
import { WorkSchedule, ChurchWorker } from '@/lib/types';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Share2, 
  Printer, 
  ShieldCheck, 
  Users2, 
  Music, 
  Check, 
  Sparkles,
  BookOpen,
  CalendarCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function getInitialNextSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday
  const daysUntilNextSunday = (7 - dayOfWeek) % 7 || 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilNextSunday);
  return nextSunday.toISOString().split('T')[0];
}

export default function SchedulesTab() {
  const { isAdmin } = useAuth();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [workers, setWorkers] = useState<ChurchWorker[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(getInitialNextSunday);
  const [serviceName, setServiceName] = useState('Culto de Domingo - Manhã (09:00)');
  const [selectedPastorIds, setSelectedPastorIds] = useState<string[]>([]);
  const [selectedObreiroIds, setSelectedObreiroIds] = useState<string[]>([]);
  const [selectedMusicianIds, setSelectedMusicianIds] = useState<string[]>([]);
  const [musicGroup, setMusicGroup] = useState('Grupo de Louvor Principal');
  const [theme, setTheme] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Schedules & Workers in real-time
  useEffect(() => {
    const qSchedules = query(collection(db, 'schedules'));
    const unsubsSchedules = onSnapshot(
      qSchedules,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WorkSchedule));
        list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSchedules(list);
      },
      (err) => console.warn('Erro ao carregar escalas:', err)
    );

    const qWorkers = query(collection(db, 'workers'));
    const unsubsWorkers = onSnapshot(
      qWorkers,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChurchWorker));
        setWorkers(list);
      },
      (err) => console.warn('Erro ao carregar servos para escalas:', err)
    );

    return () => {
      unsubsSchedules();
      unsubsWorkers();
    };
  }, []);

  const pastors = workers.filter(w => w.role === 'pastor' && w.active);
  const obreiros = workers.filter(w => w.role === 'obreiro' && w.active);
  const musicians = workers.filter(w => w.role === 'musico' && w.active);

  const handleOpenAdd = () => {
    setEditingId(null);
    setDate(getInitialNextSunday());
    setServiceName('Culto de Domingo - Manhã (09:00)');
    setSelectedPastorIds(pastors.length > 0 ? [pastors[0].id] : []);
    setSelectedObreiroIds(obreiros.slice(0, 3).map(o => o.id));
    setSelectedMusicianIds(musicians.slice(0, 3).map(m => m.id));
    setMusicGroup('Grupo de Louvor Principal');
    setTheme('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (sched: WorkSchedule) => {
    setEditingId(sched.id);
    setDate(sched.date);
    setServiceName(sched.serviceName);
    setSelectedPastorIds(sched.pastorIds || []);
    setSelectedObreiroIds(sched.obreiroIds || []);
    setSelectedMusicianIds(sched.musicianIds || []);
    setMusicGroup(sched.musicGroup || 'Grupo de Louvor Principal');
    setTheme(sched.theme || '');
    setNotes(sched.notes || '');
    setShowModal(true);
  };

  const toggleWorkerSelection = (
    id: string, 
    list: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(id)) {
      setter(list.filter(item => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para criar ou editar escalas.');
      return;
    }
    if (!date) return;

    setSubmitting(true);
    try {
      const payload = {
        date,
        serviceName,
        pastorIds: selectedPastorIds,
        obreiroIds: selectedObreiroIds,
        musicianIds: selectedMusicianIds,
        musicGroup: musicGroup.trim(),
        theme: theme.trim(),
        notes: notes.trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'schedules', editingId), payload);
      } else {
        await addDoc(collection(db, 'schedules'), {
          ...payload,
          createdAt: Date.now()
        });
      }

      setShowModal(false);
    } catch (err) {
      console.error('Erro ao guardar escala:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, serviceTitle: string) => {
    if (!isAdmin) {
      alert('Apenas administradores têm privilégios para eliminar escalas de trabalho.');
      return;
    }
    if (confirm(`Tem certeza que deseja remover a escala "${serviceTitle}"?`)) {
      try {
        await deleteDoc(doc(db, 'schedules', id));
      } catch (err) {
        console.error('Erro ao excluir escala:', err);
      }
    }
  };

  const getWorkerNames = (ids: string[]) => {
    return ids
      .map(id => workers.find(w => w.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const handleCopyToWhatsApp = (sched: WorkSchedule) => {
    const formattedDate = new Date(sched.date + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const pastorNames = getWorkerNames(sched.pastorIds).join(', ') || 'A definir';
    const obreiroNames = getWorkerNames(sched.obreiroIds).join('\n• ') || 'A definir';
    const musicianNames = getWorkerNames(sched.musicianIds).join('\n• ') || 'A definir';

    const text = `⛪ *IGREJA DO NAZARENO - ESCALA LITÚRGICA*
📅 *Data:* ${formattedDate}
⏰ *Culto:* ${sched.serviceName}
${sched.theme ? `📖 *Tema / Palavra:* ${sched.theme}\n` : ''}
───────────────
🕊️ *PASTOR PREGADOR / CELEBRANTE:*
• ${pastorNames}

👥 *OBREIROS DE SERVIÇO (${sched.obreiroIds.length}):*
• ${obreiroNames}

🎵 *MINISTÉRIO DE LOUVOR:*
🎶 *Grupo:* ${sched.musicGroup || 'Grupo de Louvor'}
• ${musicianNames}
${sched.notes ? `\n📌 *Observações:* ${sched.notes}` : ''}
───────────────
_Que o Senhor abençoe a todos os servos no seu ministério!_`;

    navigator.clipboard.writeText(text);
    setCopiedId(sched.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateSampleSchedule = async () => {
    const nextSundayStr = getInitialNextSunday();
    const pastorList = pastors.slice(0, 1).map(p => p.id);
    const obreiroList = obreiros.slice(0, 4).map(o => o.id);
    const musicianList = musicians.slice(0, 4).map(m => m.id);

    try {
      await addDoc(collection(db, 'schedules'), {
        date: nextSundayStr,
        serviceName: 'Culto de Celebração Dominical - 09:00',
        pastorIds: pastorList,
        obreiroIds: obreiroList,
        musicianIds: musicianList,
        musicGroup: 'Grupo de Louvor Principal',
        theme: 'Crescendo na Graça e no Conhecimento (2 Pedro 3:18)',
        notes: 'Chegada da equipa às 08:15 para oração pastoral e alinhamento de som.',
        createdAt: Date.now()
      });
    } catch (err) {
      console.error('Erro ao gerar escala de exemplo:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0f1714]">
            Escala de Trabalho & Cultos
          </h2>
          <p className="text-sm text-[#526359] mt-1">
            Organização dos pastores pregadores, corpo de obreiros de serviço e equipa de louvor por culto dominical.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && schedules.length === 0 && (
            <button
              onClick={handleCreateSampleSchedule}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Criar Escala Modelo
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#3b5044] bg-white border border-[#d6e2db] rounded-xl hover:bg-[#f6f9f7] transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>

          {isAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Escala de Culto
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Modo de Consulta</span>
            </div>
          )}
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase text-gray-900 tracking-wide">
          Igreja do Nazareno em Maputo
        </h1>
        <p className="text-sm font-semibold text-gray-700">
          Escala Geral de Serviço Litúrgico e Cultos Dominicais
        </p>
      </div>

      {/* Schedule Listing */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#d2dfd8] p-12 text-center print:hidden">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#14231b]">Nenhuma escala de culto registada</h3>
          <p className="text-xs text-[#6a8074] max-w-md mx-auto mt-1 mb-4">
            Defina qual pastor irá pregar no próximo domingo, a quantidade e nomes dos obreiros em serviço (portaria, recolha e recepção) e os cantores/músicos responsáveis pelo louvor.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
          >
            + Criar Primeira Escala
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {schedules.map((sched) => {
            const schedDate = new Date(sched.date + 'T00:00:00');
            const isTodayOrFuture = schedDate.getTime() >= new Date().setHours(0, 0, 0, 0);

            const pastorNames = getWorkerNames(sched.pastorIds);
            const obreiroNames = getWorkerNames(sched.obreiroIds);
            const musicianNames = getWorkerNames(sched.musicianIds);

            return (
              <div 
                key={sched.id}
                className="bg-white rounded-3xl border border-[#dce6e0] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header Strip */}
                <div className="bg-gradient-to-r from-[#0d1612] to-[#16271e] text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          {schedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </span>
                        <span className="text-xs text-[#8da597]">
                          • {schedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        {isTodayOrFuture && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Próximo Culto
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {sched.serviceName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden self-start md:self-auto">
                    <button
                      onClick={() => handleCopyToWhatsApp(sched)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        copiedId === sched.id 
                          ? 'bg-emerald-600 text-white border-emerald-500' 
                          : 'bg-white/10 hover:bg-white/20 text-emerald-200 border-white/15'
                      }`}
                      title="Copiar escala formatada para WhatsApp"
                    >
                      {copiedId === sched.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </>
                      )}
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(sched)}
                          className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(sched.id, sched.serviceName)}
                          className="p-2 text-red-300 hover:bg-red-500/20 rounded-xl transition-colors cursor-pointer"
                          title="Remover escala"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subheader: Theme and Notes */}
                {(sched.theme || sched.notes) && (
                  <div className="bg-[#f8faf9] px-6 py-3 border-b border-[#edf2ef] flex flex-wrap items-center justify-between gap-3 text-xs">
                    {sched.theme && (
                      <div className="flex items-center gap-2 text-[#24392e]">
                        <BookOpen className="w-4 h-4 text-emerald-700" />
                        <span>Tema / Mensagem: <strong>{sched.theme}</strong></span>
                      </div>
                    )}
                    {sched.notes && (
                      <div className="text-[#5f7568] italic">
                        {sched.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* 3 Core Liturgical Columns */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Coluna 1: Pastor Celebrante / Pregador */}
                  <div className="bg-[#fafcfb] rounded-2xl p-4 border border-[#e2eae5] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#edf2ef] mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <span>Pastor Celebrante</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Púlpito
                        </span>
                      </div>

                      {pastorNames.length === 0 ? (
                        <p className="text-xs text-[#8aa093] italic py-2">
                          Nenhum pastor escalado para ministrar neste culto.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {pastorNames.map((name, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm font-bold text-[#14231b] bg-white p-2.5 rounded-xl border border-[#e3ebe6] shadow-2xs">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#71867a] mt-3 pt-2 border-t border-[#edf2ee]">
                      Responsável pela ministração da palavra e celebração.
                    </p>
                  </div>

                  {/* Coluna 2: Obreiros de Serviço */}
                  <div className="bg-[#fafcfb] rounded-2xl p-4 border border-[#e2eae5] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#edf2ef] mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                            <Users2 className="w-3.5 h-3.5" />
                          </div>
                          <span>Obreiros de Serviço</span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {obreiroNames.length} Escalados
                        </span>
                      </div>

                      {obreiroNames.length === 0 ? (
                        <p className="text-xs text-[#8aa093] italic py-2">
                          Nenhum obreiro de serviço registado nesta escala.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5">
                          {obreiroNames.map((name, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#182a20] bg-white p-2 rounded-xl border border-[#e3ebe6]">
                              <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#71867a] mt-3 pt-2 border-t border-[#edf2ee]">
                      Portaria, recepção de visitantes, recolha e apoio.
                    </p>
                  </div>

                  {/* Coluna 3: Louvor e Músicos */}
                  <div className="bg-[#fafcfb] rounded-2xl p-4 border border-[#e2eae5] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#edf2ef] mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-900">
                          <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                            <Music className="w-3.5 h-3.5" />
                          </div>
                          <span>Ministério de Louvor</span>
                        </div>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 truncate max-w-[130px]">
                          {sched.musicGroup || 'Louvor'}
                        </span>
                      </div>

                      {musicianNames.length === 0 ? (
                        <p className="text-xs text-[#8aa093] italic py-2">
                          Nenhum músico ou cantor selecionado para este culto.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5">
                          {musicianNames.map((name, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#182a20] bg-white p-2 rounded-xl border border-[#e3ebe6]">
                              <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                ♫
                              </span>
                              <span className="truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#71867a] mt-3 pt-2 border-t border-[#edf2ee]">
                      Direcção dos hinos congregacionais e adoração.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Escala */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl border border-[#e2eae5] relative my-8">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#101b15]">
                  {editingId ? 'Editar Escala de Culto' : 'Agendar Nova Escala Dominical'}
                </h3>
                <p className="text-xs text-[#63796d] mt-0.5">
                  Indique o pastor, os obreiros destacados e a equipa de louvor.
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
              {/* Data e Identificação do Culto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                    Data do Culto (Domingo) *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-[#121c17]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                    Designação do Culto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Culto de Celebração - Manhã (09:00)"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-[#121c17]"
                  />
                </div>
              </div>

              {/* Tema e Mensagem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                    Tema da Mensagem (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A Santidade ao Senhor"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-xs focus:outline-none focus:border-emerald-600 text-[#121c17]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                    Grupo de Louvor Encarregue
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Grupo de Louvor Principal, Coro Nazareno"
                    value={musicGroup}
                    onChange={(e) => setMusicGroup(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-xs focus:outline-none focus:border-emerald-600 text-[#121c17]"
                  />
                </div>
              </div>

              {/* 1. SELEÇÃO DE PASTORES */}
              <div className="p-3.5 rounded-2xl bg-[#fafcfb] border border-[#e2eae5]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Selecione o Pastor Pregador / Celebrante</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {selectedPastorIds.length} Selecionado(s)
                  </span>
                </div>

                {pastors.length === 0 ? (
                  <p className="text-xs text-gray-500 py-1">
                    Nenhum pastor cadastrado. Adicione pastores no separador &quot;Pastores &amp; Servos&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {pastors.map(p => {
                      const isSelected = selectedPastorIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleWorkerSelection(p.id, selectedPastorIds, setSelectedPastorIds)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs text-left border transition-all ${
                            isSelected 
                              ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs' 
                              : 'bg-white border-[#d8e4dd] text-[#203126] hover:border-emerald-400'
                          }`}
                        >
                          <div>
                            <p>{p.name}</p>
                            <span className={`text-[10px] block ${isSelected ? 'text-emerald-200' : 'text-[#6a8074]'}`}>
                              {p.subRole || 'Pastor'}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. SELEÇÃO DE OBREIROS */}
              <div className="p-3.5 rounded-2xl bg-[#fafcfb] border border-[#e2eae5]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider">
                    <Users2 className="w-4 h-4 text-blue-700" />
                    <span>Obreiros de Serviço (Portaria &amp; Recolha)</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700">
                    {selectedObreiroIds.length} Escalado(s)
                  </span>
                </div>

                {obreiros.length === 0 ? (
                  <p className="text-xs text-gray-500 py-1">
                    Nenhum obreiro cadastrado. Adicione obreiros no separador &quot;Pastores &amp; Servos&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {obreiros.map(o => {
                      const isSelected = selectedObreiroIds.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => toggleWorkerSelection(o.id, selectedObreiroIds, setSelectedObreiroIds)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs text-left border transition-all ${
                            isSelected 
                              ? 'bg-blue-700 text-white border-blue-800 font-bold shadow-xs' 
                              : 'bg-white border-[#d8e4dd] text-[#203126] hover:border-blue-400'
                          }`}
                        >
                          <div>
                            <p>{o.name}</p>
                            <span className={`text-[10px] block ${isSelected ? 'text-blue-200' : 'text-[#6a8074]'}`}>
                              {o.subRole || 'Diácono / Cooperador'}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. SELEÇÃO DE MÚSICOS E CANTORES */}
              <div className="p-3.5 rounded-2xl bg-[#fafcfb] border border-[#e2eae5]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 uppercase tracking-wider">
                    <Music className="w-4 h-4 text-purple-700" />
                    <span>Músicos e Cantores Escalados</span>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700">
                    {selectedMusicianIds.length} Músico(s)
                  </span>
                </div>

                {musicians.length === 0 ? (
                  <p className="text-xs text-gray-500 py-1">
                    Nenhum músico cadastrado. Adicione músicos no separador &quot;Pastores &amp; Servos&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {musicians.map(m => {
                      const isSelected = selectedMusicianIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleWorkerSelection(m.id, selectedMusicianIds, setSelectedMusicianIds)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs text-left border transition-all ${
                            isSelected 
                              ? 'bg-purple-700 text-white border-purple-800 font-bold shadow-xs' 
                              : 'bg-white border-[#d8e4dd] text-[#203126] hover:border-purple-400'
                          }`}
                        >
                          <div>
                            <p>{m.name}</p>
                            <span className={`text-[10px] block ${isSelected ? 'text-purple-200' : 'text-[#6a8074]'}`}>
                              {m.subRole || 'Músico / Cantor'}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-[#34463c] uppercase tracking-wider mb-1">
                  Notas Litúrgicas &amp; Orientações para a Equipa
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Chegada da equipa às 08:15 para oração e alinhamento de som..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#f6f9f7] border border-[#d6e2db] rounded-xl text-xs focus:outline-none focus:border-emerald-600 text-[#121c17]"
                />
              </div>

              {/* Botões do Modal */}
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
                  {submitting ? 'A guardar...' : editingId ? 'Actualizar Escala' : 'Publicar Escala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
