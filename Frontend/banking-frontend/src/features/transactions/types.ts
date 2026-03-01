import type { TransactionType, TransactionStatus } from './transaction.constants';

export interface Transaction {
  id: string;
  personalUserIdNumber: string;
  fullNameHebrew: string;
  fullNameEnglish: string;
  birthDate: string;
  bankAccount: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: string;
}

export type TransactionRequest = Omit<Transaction, 'id' | 'status' | 'createdAt'>;

export type TransactionResponse = Transaction;
