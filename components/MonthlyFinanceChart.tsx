'use client';

import React, { useMemo, useState } from 'react';
import { FinanceRecord } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Calendar,
  Wallet,
  HandCoins,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface MonthlyFinanceChartProps {
  finances: FinanceRecord[];
}

type ChartMode = 'grouped' | 'stacked' | 'area';
type PeriodOption = 'year' | 'last12';

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' MT';
}

function formatShortCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M MT`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k MT`;
  }
  return `${value.toFixed(0)} MT`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  dataMap: Record<string, { tithes: number; offerings: number; total: number; tithesCount: number; offeringsCount: number; fullName: string }>;
}

function CustomChartTooltip({ active, payload, label, dataMap }: CustomTooltipProps) {
  if (!active || !label || !dataMap[label]) return null;

  const info = dataMap[label];
  const tithePercent = info.total > 0 ? ((info.tithes / info.total) * 100).toFixed(1) : '0';
  const offeringPercent = info.total > 0 ? ((info.offerings / info.total) * 100).toFixed(1) : '0';

  return (
    <div className="bg-[#0e1613] text-white p-3.5 rounded-xl shadow-xl border border-[#22332a] text-xs min-w-[220px]">
      <div className="font-bold text-sm text-white border-b border-[#1c2c23] pb-2 mb-2 flex items-center justify-between">
        <span>{info.fullName}</span>
        <span className="text-[10px] text-emerald-400 font-mono font-semibold">Total: {formatCurrency(info.total)}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-[#a4b8ad]">Dízimos ({tithePercent}%)</span>
          </div>
          <span className="font-semibold text-white">{formatCurrency(info.tithes)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
            <span className="text-[#a4b8ad]">Ofertas ({offeringPercent}%)</span>
          </div>
          <span className="font-semibold text-white">{formatCurrency(info.offerings)}</span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#1c2c23] text-[10px] text-[#718a7c] flex justify-between">
        <span>Registos: {info.tithesCount} dízimos, {info.offeringsCount} ofertas</span>
      </div>
    </div>
  );
}

export default function MonthlyFinanceChart({ finances }: MonthlyFinanceChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('grouped');
  const [periodOption, setPeriodOption] = useState<PeriodOption>('year');

  const currentYear = new Date().getFullYear();

  // Obter anos disponíveis nos dados
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    finances.forEach(f => {
      if (f.serviceDate) {
        const y = new Date(f.serviceDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [finances, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Processar dados mensais
  const { chartData, dataMap, summary } = useMemo(() => {
    type MonthData = {
      monthKey: string;
      label: string;
      fullName: string;
      tithes: number;
      offerings: number;
      total: number;
      tithesCount: number;
      offeringsCount: number;
    };

    const map: Record<string, MonthData> = {};
    const dataList: MonthData[] = [];

    if (periodOption === 'year') {
      // 12 meses do ano selecionado
      for (let m = 0; m < 12; m++) {
        const label = MONTH_NAMES_SHORT[m];
        const monthKey = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
        const item: MonthData = {
          monthKey,
          label,
          fullName: `${MONTH_NAMES_FULL[m]} de ${selectedYear}`,
          tithes: 0,
          offerings: 0,
          total: 0,
          tithesCount: 0,
          offeringsCount: 0
        };
        map[label] = item;
        dataList.push(item);
      }

      // Preencher com finanças do ano
      finances.forEach(record => {
        if (!record.serviceDate) return;
        const d = new Date(record.serviceDate);
        if (d.getFullYear() === selectedYear) {
          const m = d.getMonth();
          const label = MONTH_NAMES_SHORT[m];
          if (map[label]) {
            if (record.type === 'tithe') {
              map[label].tithes += record.amount;
              map[label].tithesCount += 1;
            } else {
              map[label].offerings += record.amount;
              map[label].offeringsCount += 1;
            }
            map[label].total += record.amount;
          }
        }
      });
    } else {
      // Últimos 12 meses móveis
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const label = `${MONTH_NAMES_SHORT[m]}/${String(y).slice(-2)}`;
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        const item: MonthData = {
          monthKey,
          label,
          fullName: `${MONTH_NAMES_FULL[m]} de ${y}`,
          tithes: 0,
          offerings: 0,
          total: 0,
          tithesCount: 0,
          offeringsCount: 0
        };
        map[label] = item;
        dataList.push(item);
      }

      // Preencher com finanças
      finances.forEach(record => {
        if (!record.serviceDate) return;
        const d = new Date(record.serviceDate);
        const y = d.getFullYear();
        const m = d.getMonth();
        const label = `${MONTH_NAMES_SHORT[m]}/${String(y).slice(-2)}`;
        if (map[label]) {
          if (record.type === 'tithe') {
            map[label].tithes += record.amount;
            map[label].tithesCount += 1;
          } else {
            map[label].offerings += record.amount;
            map[label].offeringsCount += 1;
          }
          map[label].total += record.amount;
        }
      });
    }

    // Calcular estatísticas resumo
    let totalTithes = 0;
    let totalOfferings = 0;
    let peakMonth: MonthData | null = null;
    let monthsWithIncome = 0;

    for (const m of dataList) {
      totalTithes += m.tithes;
      totalOfferings += m.offerings;
      if (m.total > 0) monthsWithIncome++;
      if (!peakMonth || m.total > peakMonth.total) {
        peakMonth = m;
      }
    }

    const totalIncome = totalTithes + totalOfferings;
    const avgMonthly = monthsWithIncome > 0 ? totalIncome / monthsWithIncome : (totalIncome / (dataList.length || 1));

    const validPeakMonth: MonthData | null = (peakMonth && peakMonth.total > 0) ? peakMonth : null;

    return {
      chartData: dataList,
      dataMap: map,
      summary: {
        totalTithes,
        totalOfferings,
        totalIncome,
        avgMonthly,
        tithesRatio: totalIncome > 0 ? (totalTithes / totalIncome) * 100 : 0,
        offeringsRatio: totalIncome > 0 ? (totalOfferings / totalIncome) * 100 : 0,
        peakMonth: validPeakMonth
      }
    };
  }, [finances, periodOption, selectedYear]);

  return (
    <div id="monthly-finance-visualizer" className="bg-white rounded-2xl border border-[#e2eae5] shadow-sm p-5 sm:p-6 mb-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#f0f5f2]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#0e1613]">Histórico Mensal de Contribuições</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Recharts
            </span>
          </div>
          <p className="text-xs text-[#61776b] mt-1">
            Análise comparativa da evolução de dízimos e ofertas ao longo dos meses
          </p>
        </div>

        {/* Filters and Mode Switchers */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Period selector */}
          <div className="flex items-center bg-[#f4f7f5] p-1 rounded-xl border border-[#e2eae5] text-xs">
            <button
              onClick={() => setPeriodOption('year')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodOption === 'year' 
                  ? 'bg-white text-[#0e1613] shadow-xs font-semibold' 
                  : 'text-[#5d7367] hover:text-[#0e1613]'
              }`}
            >
              Ano Calendário
            </button>
            <button
              onClick={() => setPeriodOption('last12')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodOption === 'last12' 
                  ? 'bg-white text-[#0e1613] shadow-xs font-semibold' 
                  : 'text-[#5d7367] hover:text-[#0e1613]'
              }`}
            >
              Últimos 12 Meses
            </button>
          </div>

          {/* Year select (if year mode) */}
          {periodOption === 'year' && (
            <div className="flex items-center gap-1 bg-[#f4f7f5] px-2.5 py-1.5 rounded-xl border border-[#e2eae5] text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#5d7367]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-[#0e1613] focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Visual Style: Grouped / Stacked / Area */}
          <div className="flex items-center bg-[#f4f7f5] p-1 rounded-xl border border-[#e2eae5] text-xs">
            <button
              onClick={() => setChartMode('grouped')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                chartMode === 'grouped' 
                  ? 'bg-white text-[#0e1613] shadow-xs font-semibold' 
                  : 'text-[#5d7367] hover:text-[#0e1613]'
              }`}
              title="Barras Lado a Lado (Comparativo)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Barras</span>
            </button>
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                chartMode === 'stacked' 
                  ? 'bg-white text-[#0e1613] shadow-xs font-semibold' 
                  : 'text-[#5d7367] hover:text-[#0e1613]'
              }`}
              title="Barras Empilhadas"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Empilhado</span>
            </button>
            <button
              onClick={() => setChartMode('area')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                chartMode === 'area' 
                  ? 'bg-white text-[#0e1613] shadow-xs font-semibold' 
                  : 'text-[#5d7367] hover:text-[#0e1613]'
              }`}
              title="Área Contínua de Tendência"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Área</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
        {/* Total Arrecadado */}
        <div className="bg-[#f9fbf9] p-3.5 rounded-xl border border-[#e5ece7]">
          <div className="flex items-center justify-between text-xs text-[#5d7367] mb-1">
            <span className="font-semibold">Total no Período</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-[#0e1613]">{formatCurrency(summary.totalIncome)}</p>
          <p className="text-[11px] text-[#718a7c] mt-0.5">
            Dízimos + Ofertas consolidadas
          </p>
        </div>

        {/* Dízimos Total */}
        <div className="bg-[#f9fbf9] p-3.5 rounded-xl border border-[#e5ece7]">
          <div className="flex items-center justify-between text-xs text-[#5d7367] mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span className="font-semibold text-emerald-800">Total Dízimos</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              {summary.tithesRatio.toFixed(0)}%
            </span>
          </div>
          <p className="text-lg font-bold text-[#0e1613]">{formatCurrency(summary.totalTithes)}</p>
          <p className="text-[11px] text-[#718a7c] mt-0.5">
            Participação dos membros fiéis
          </p>
        </div>

        {/* Ofertas Total */}
        <div className="bg-[#f9fbf9] p-3.5 rounded-xl border border-[#e5ece7]">
          <div className="flex items-center justify-between text-xs text-[#5d7367] mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
              <span className="font-semibold text-sky-800">Total Ofertas</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">
              {summary.offeringsRatio.toFixed(0)}%
            </span>
          </div>
          <p className="text-lg font-bold text-[#0e1613]">{formatCurrency(summary.totalOfferings)}</p>
          <p className="text-[11px] text-[#718a7c] mt-0.5">
            Cultos e celebrações gerais
          </p>
        </div>

        {/* Média / Pico */}
        <div className="bg-[#f9fbf9] p-3.5 rounded-xl border border-[#e5ece7]">
          <div className="flex items-center justify-between text-xs text-[#5d7367] mb-1">
            <span className="font-semibold">Média Mensal</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-[#0e1613]">{formatCurrency(summary.avgMonthly)}</p>
          <p className="text-[11px] text-[#718a7c] mt-0.5 truncate">
            {summary.peakMonth ? `Pico: ${summary.peakMonth.label} (${formatShortCurrency(summary.peakMonth.total)})` : 'Sem pico registado'}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTithes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorOfferings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ee" />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#61776b', fontSize: 11 }} 
                axisLine={{ stroke: '#dce6df' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#61776b', fontSize: 11 }} 
                axisLine={{ stroke: '#dce6df' }}
                tickLine={false}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip content={<CustomChartTooltip dataMap={dataMap} />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
                formatter={(val) => <span className="text-[#3b5246] font-medium">{val === 'tithes' ? 'Dízimos' : 'Ofertas'}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="tithes" 
                name="tithes"
                stroke="#059669" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTithes)" 
              />
              <Area 
                type="monotone" 
                dataKey="offerings" 
                name="offerings"
                stroke="#0284c7" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorOfferings)" 
              />
            </AreaChart>
          ) : (
            <BarChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ee" />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#61776b', fontSize: 11 }} 
                axisLine={{ stroke: '#dce6df' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#61776b', fontSize: 11 }} 
                axisLine={{ stroke: '#dce6df' }}
                tickLine={false}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip content={<CustomChartTooltip dataMap={dataMap} />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
                formatter={(val) => <span className="text-[#3b5246] font-medium">{val === 'tithes' ? 'Dízimos' : 'Ofertas'}</span>}
              />
              <Bar 
                dataKey="tithes" 
                name="tithes"
                fill="#059669" 
                radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                stackId={chartMode === 'stacked' ? 'a' : undefined}
                maxBarSize={40}
              />
              <Bar 
                dataKey="offerings" 
                name="offerings"
                fill="#0284c7" 
                radius={chartMode === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                stackId={chartMode === 'stacked' ? 'a' : undefined}
                maxBarSize={40}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Helpful context footnote */}
      <div className="mt-4 pt-3 border-t border-[#f0f5f2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#789384]">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Os valores representam a soma exata de dízimos e ofertas registados no sistema por data de culto.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <strong className="text-[#2b3e34]">Dízimos</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <strong className="text-[#2b3e34]">Ofertas</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
