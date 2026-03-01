import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Transaction, TransactionRequest } from './types';
import { TRANSACTION_STATUS } from './transaction.constants';
import {
  createTransaction as apiCreate,
  updateTransaction as apiUpdate,
  cancelTransaction as apiCancel,
  getTransactionsByUser as apiGetByUser,
} from '../../api/transactions';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export const createTransaction = createAsyncThunk<
  Transaction,
  TransactionRequest,
  { rejectValue: string }
>('transactions/create', async (request, { rejectWithValue }) => {
  try {
    return await apiCreate(request);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateTransaction = createAsyncThunk<
  Transaction,
  { transactionId: string; amount: number; bankAccount: string },
  { rejectValue: string }
>('transactions/update', async ({ transactionId, amount, bankAccount }, { rejectWithValue }) => {
  try {
    return await apiUpdate(transactionId, amount, bankAccount);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const cancelTransaction = createAsyncThunk<string, string, { rejectValue: string }>(
  'transactions/cancel',
  async (transactionId, { rejectWithValue }) => {
    try {
      await apiCancel(transactionId);
      return transactionId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getTransactionsByUser = createAsyncThunk<
  Transaction[],
  string,
  { rejectValue: string }
>('transactions/getByUser', async (userId, { rejectWithValue }) => {
  try {
    return await apiGetByUser(userId);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  error: null,
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    resetHistory() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createTransaction.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
      })
      .addCase(createTransaction.rejected, state => {
        state.loading = false;
      })

      .addCase(updateTransaction.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.loading = false;
        const idx = state.transactions.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) state.transactions[idx] = action.payload;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Update failed';
      })

      .addCase(cancelTransaction.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelTransaction.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const tx = state.transactions.find(t => t.id === action.payload);
        if (tx) tx.status = TRANSACTION_STATUS.Cancelled;
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Cancel failed';
      })

      .addCase(getTransactionsByUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTransactionsByUser.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(getTransactionsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Fetch failed';
      });
  },
});

export const { clearError, resetHistory } = transactionsSlice.actions;
export default transactionsSlice.reducer;
