import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import transactionsReducer, {
  createTransaction,
  updateTransaction,
  cancelTransaction,
  getTransactionsByUser,
  clearError,
  resetHistory,
} from '../transactionsSlice';
import type { Transaction } from '../types';

vi.mock('../../../api/transactions', () => ({
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  cancelTransaction: vi.fn(),
  getTransactionsByUser: vi.fn(),
}));

import {
  createTransaction as apiCreate,
  updateTransaction as apiUpdate,
  cancelTransaction as apiCancel,
  getTransactionsByUser as apiGetByUser,
} from '../../../api/transactions';

const mockApiCreate = vi.mocked(apiCreate);
const mockApiUpdate = vi.mocked(apiUpdate);
const mockApiCancel = vi.mocked(apiCancel);
const mockApiGetByUser = vi.mocked(apiGetByUser);

function makeStore() {
  return configureStore({ reducer: { transactions: transactionsReducer } });
}

const fakeTx: Transaction = {
  id: 'tx-1',
  personalUserIdNumber: '123456789',
  fullNameHebrew: 'ישראל ישראלי',
  fullNameEnglish: 'Israel Israeli',
  birthDate: '1990-01-01',
  bankAccount: '1234567890',
  amount: 1000,
  type: 'Deposit',
  status: 'Success',
  createdAt: '2026-02-28T10:00:00Z',
};

describe('transactionsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clearError sets error to null', () => {
    const store = makeStore();
    store.dispatch(clearError());
    expect(store.getState().transactions.error).toBeNull();
  });

  it('resetHistory returns to initial state', () => {
    const store = makeStore();
    mockApiCreate.mockResolvedValueOnce(fakeTx);
    return store.dispatch(createTransaction({
      personalUserIdNumber: '123456789',
      fullNameHebrew: 'ישראל ישראלי',
      fullNameEnglish: 'Israel Israeli',
      birthDate: '1990-01-01',
      bankAccount: '1234567890',
      amount: 1000,
      type: 'Deposit',
    })).then(() => {
      expect(store.getState().transactions.transactions).toHaveLength(1);
      store.dispatch(resetHistory());
      const state = store.getState().transactions;
      expect(state.transactions).toHaveLength(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  it('createTransaction.fulfilled prepends transaction', async () => {
    const store = makeStore();
    mockApiCreate.mockResolvedValueOnce(fakeTx);

    await store.dispatch(createTransaction({
      personalUserIdNumber: '123456789',
      fullNameHebrew: 'ישראל ישראלי',
      fullNameEnglish: 'Israel Israeli',
      birthDate: '1990-01-01',
      bankAccount: '1234567890',
      amount: 1000,
      type: 'Deposit',
    }));

    const state = store.getState().transactions;
    expect(state.loading).toBe(false);
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].id).toBe('tx-1');
  });

  it('createTransaction.rejected does not set global error', async () => {
    const store = makeStore();
    mockApiCreate.mockRejectedValueOnce(new Error('Server error'));

    await store.dispatch(createTransaction({
      personalUserIdNumber: '123456789',
      fullNameHebrew: 'ישראל ישראלי',
      fullNameEnglish: 'Israel Israeli',
      birthDate: '1990-01-01',
      bankAccount: '1234567890',
      amount: 1000,
      type: 'Deposit',
    }));

    const state = store.getState().transactions;
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('createTransaction.pending sets loading and clears error', async () => {
    const store = makeStore();
    let pendingResolved = false;
    mockApiCreate.mockImplementation(() => new Promise(resolve => {
      pendingResolved = true;
      setTimeout(() => resolve(fakeTx), 50);
    }));

    const promise = store.dispatch(createTransaction({
      personalUserIdNumber: '123456789',
      fullNameHebrew: 'ישראל ישראלי',
      fullNameEnglish: 'Israel Israeli',
      birthDate: '1990-01-01',
      bankAccount: '1234567890',
      amount: 1000,
      type: 'Deposit',
    }));

    await vi.waitFor(() => expect(pendingResolved).toBe(true));
    expect(store.getState().transactions.loading).toBe(true);
    await promise;
  });

  it('updateTransaction.fulfilled replaces transaction in list', async () => {
    const store = makeStore();
    mockApiCreate.mockResolvedValueOnce(fakeTx);
    await store.dispatch(createTransaction({
      personalUserIdNumber: '123456789',
      fullNameHebrew: 'ישראל ישראלי',
      fullNameEnglish: 'Israel Israeli',
      birthDate: '1990-01-01',
      bankAccount: '1234567890',
      amount: 1000,
      type: 'Deposit',
    }));

    const updated = { ...fakeTx, amount: 5000, bankAccount: '9999999999' };
    mockApiUpdate.mockResolvedValueOnce(updated);

    await store.dispatch(updateTransaction({
      transactionId: 'tx-1',
      amount: 5000,
      bankAccount: '9999999999',
    }));

    const state = store.getState().transactions;
    expect(state.transactions[0].amount).toBe(5000);
    expect(state.transactions[0].bankAccount).toBe('9999999999');
  });

  it('updateTransaction.rejected sets global error', async () => {
    const store = makeStore();
    mockApiUpdate.mockRejectedValueOnce(new Error('Update failed'));

    await store.dispatch(updateTransaction({
      transactionId: 'tx-1',
      amount: 5000,
      bankAccount: '9999999999',
    }));

    expect(store.getState().transactions.error).toBe('Update failed');
  });

  it('cancelTransaction.fulfilled sets status to Cancelled', async () => {
    const store = makeStore();
    mockApiCreate.mockResolvedValueOnce(fakeTx);
    await store.dispatch(createTransaction({
      personalUserIdNumber: '123456789',
      fullNameHebrew: 'ישראל ישראלי',
      fullNameEnglish: 'Israel Israeli',
      birthDate: '1990-01-01',
      bankAccount: '1234567890',
      amount: 1000,
      type: 'Deposit',
    }));

    mockApiCancel.mockResolvedValueOnce(undefined);

    await store.dispatch(cancelTransaction('tx-1'));

    expect(store.getState().transactions.transactions[0].status).toBe('Cancelled');
  });

  it('cancelTransaction.rejected sets global error', async () => {
    const store = makeStore();
    mockApiCancel.mockRejectedValueOnce(new Error('Cancel failed'));

    await store.dispatch(cancelTransaction('tx-1'));

    expect(store.getState().transactions.error).toBe('Cancel failed');
  });

  it('getTransactionsByUser.fulfilled replaces transaction list', async () => {
    const store = makeStore();
    const txList: Transaction[] = [
      { ...fakeTx, id: 'tx-1' },
      { ...fakeTx, id: 'tx-2', amount: 2000 },
    ];
    mockApiGetByUser.mockResolvedValueOnce(txList);

    await store.dispatch(getTransactionsByUser('123456789'));

    const state = store.getState().transactions;
    expect(state.transactions).toHaveLength(2);
    expect(state.loading).toBe(false);
  });

  it('getTransactionsByUser.rejected sets error', async () => {
    const store = makeStore();
    mockApiGetByUser.mockRejectedValueOnce(new Error('Network error'));

    await store.dispatch(getTransactionsByUser('123456789'));

    expect(store.getState().transactions.error).toBe('Network error');
  });
});
