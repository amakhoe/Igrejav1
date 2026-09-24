export interface Member {
  id: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  isBaptized: boolean;
  isTransferred: boolean;
  createdAt: number;
}

export interface FinanceRecord {
  id: string;
  type: 'tithe' | 'offering';
  amount: number;
  serviceDate: string; // YYYY-MM-DD
  serviceNumber: string; // e.g., '1º Culto', '2º Culto'
  memberId?: string; // Optional, usually tithes are linked to a member
  createdAt: number;
}

export interface Visit {
  id: string;
  memberId: string;
  visitDate: string; // YYYY-MM-DD
  status: 'scheduled' | 'completed';
  notes: string;
  createdAt: number;
}

export type WorkerRole = 'pastor' | 'obreiro' | 'musico';

export interface ChurchWorker {
  id: string;
  name: string;
  role: WorkerRole; // 'pastor' | 'obreiro' | 'musico'
  subRole?: string; // e.g., 'Pastor Titular', 'Diácono', 'Vocalista Líder', 'Tecladista'
  phoneNumber?: string;
  email?: string;
  active: boolean;
  notes?: string;
  createdAt: number;
}

export interface WorkSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  serviceName: string; // e.g. "Culto de Domingo - Manhã", "Culto de Domingo - Tarde"
  pastorIds: string[]; // Pastores escalados para ministrar/cultuar
  obreiroIds: string[]; // Obreiros que vão trabalhar no culto
  musicianIds: string[]; // Músicos / Cantores escalados
  musicGroup?: string; // Nome do grupo de louvor / coro
  theme?: string; // Tema do culto / pregação
  notes?: string; // Observações / avisos
  createdAt: number;
}

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: 'pastor' | 'secretario' | 'tesoureiro' | 'admin';
  active: boolean;
  phoneNumber?: string;
  photoURL?: string;
  password?: string;
  createdAt: number;
  lastLoginAt?: number;
}
