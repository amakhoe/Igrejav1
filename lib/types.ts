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
