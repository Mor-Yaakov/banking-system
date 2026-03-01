import apiClient from './axiosInstance';
import type { TransactionRequest, TransactionResponse } from '../features/transactions/types';

const ENDPOINT = '/transactions';

export async function createTransaction(request: TransactionRequest): Promise<TransactionResponse> {
  const { data } = await apiClient.post<TransactionResponse>(ENDPOINT, request);
  return data;
}

export async function getTransactionsByUser(userId: string): Promise<TransactionResponse[]> {
  const { data } = await apiClient.get<TransactionResponse[]>(`${ENDPOINT}/${userId}`);
  return data;
}

export async function updateTransaction(
  transactionId: string,
  amount: number,
  bankAccount: string
): Promise<TransactionResponse> {
  const { data } = await apiClient.put<TransactionResponse>(
    `${ENDPOINT}/${transactionId}`,
    { amount, bankAccount }
  );
  return data;
}

export async function cancelTransaction(transactionId: string): Promise<void> {
  await apiClient.delete(`${ENDPOINT}/${transactionId}`);
}
