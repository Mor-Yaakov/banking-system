import type { FocusEvent } from 'react';
import { Fragment, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  getTransactionsByUser,
  updateTransaction,
  cancelTransaction,
  clearError,
} from '../transactionsSlice';
import type { Transaction } from '../types';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '../transaction.constants';
import NumericInput from '../../../components/NumericInput/NumericInput';
import styles from './TransactionHistory.module.css';

const COLUMN_COUNT = 7;

const formatDateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatTimeOnly = (iso: string) =>
  new Date(iso).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

const STATUS_LABELS: Record<string, string> = {
  [TRANSACTION_STATUS.Pending]: 'ממתין',
  [TRANSACTION_STATUS.Success]: 'הצלחה',
  [TRANSACTION_STATUS.Failed]: 'נכשל',
  [TRANSACTION_STATUS.Cancelled]: 'בוטל',
};

const STATUS_CLASSES: Record<string, string> = {
  [TRANSACTION_STATUS.Success]: styles.statusSuccess,
  [TRANSACTION_STATUS.Pending]: styles.statusPending,
  [TRANSACTION_STATUS.Failed]: styles.statusFailed,
  [TRANSACTION_STATUS.Cancelled]: styles.statusCancelled,
};

interface RowError {
  txId: string;
  message: string;
}

export default function TransactionHistory() {
  const dispatch = useAppDispatch();
  const { transactions, loading, error } = useAppSelector(state => state.transactions);

  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [rowError, setRowError] = useState<RowError | null>(null);

  const handleLoadHistory = useCallback(() => {
    dispatch(clearError());
    setSearchError('');

    if (!/^\d{9}$/.test(searchId)) {
      setSearchError('יש למלא תעודת זהות בעלת 9 ספרות');
      return;
    }

    dispatch(getTransactionsByUser(searchId));
    setSearchId('');
  }, [dispatch, searchId]);

  const handleReset = useCallback(() => {
    setSearchId('');
    setSearchError('');
  }, []);

  const handleSectionBlur = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget) && searchError) {
        setSearchError('');
        setSearchId('');
      }
    },
    [searchError],
  );

  const startEdit = useCallback((tx: Transaction) => {
    setEditingId(tx.id);
    setEditAmount(String(tx.amount));
    setEditBankAccount(tx.bankAccount);
    setRowError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditAmount('');
    setEditBankAccount('');
    setRowError(null);
  }, []);

  const saveEdit = useCallback(
    (tx: Transaction) => {
      if (!editAmount || editAmount.length > 10) {
        setRowError({ txId: tx.id, message: 'יש למלא סכום - עד 10 ספרות' });
        return;
      }
      if (!editBankAccount || editBankAccount.length > 10) {
        setRowError({ txId: tx.id, message: 'יש למלא מספר חשבון - עד 10 ספרות' });
        return;
      }

      const amount = Number(editAmount);
      if (Number.isNaN(amount) || amount <= 0) {
        setRowError({ txId: tx.id, message: 'סכום חייב להיות מספר חיובי' });
        return;
      }

      dispatch(updateTransaction({ transactionId: tx.id, amount, bankAccount: editBankAccount }))
        .unwrap()
        .then(() => {
          setEditingId(null);
          setRowError(null);
          if (tx.personalUserIdNumber) {
            dispatch(getTransactionsByUser(tx.personalUserIdNumber));
          }
        })
        .catch((msg: string) => {
          setRowError({ txId: tx.id, message: msg });
        });
    },
    [dispatch, editAmount, editBankAccount],
  );

  const cancelTx = useCallback(
    async (tx: Transaction) => {
      try {
        await dispatch(cancelTransaction(tx.id)).unwrap();
        if (tx.personalUserIdNumber) {
          dispatch(getTransactionsByUser(tx.personalUserIdNumber));
        }
      } catch {
        setRowError({ txId: tx.id, message: 'אירעה שגיאה בביטול הפעולה' });
      }
    },
    [dispatch],
  );

  return (
    <section className={styles.historyContainer} onBlur={handleSectionBlur}>
      <div className={styles.header}>
        <div>
          <div className={styles.filterGroup}>
            <NumericInput
              value={searchId}
              onChange={val => {
                setSearchId(val);
                if (searchError) setSearchError('');
              }}
              maxDigits={9}
              className={styles.filterInput}
              placeholder="תעודת זהות"
            />
            <button
              type="button"
              className={styles.filterButton}
              onClick={handleLoadHistory}
              disabled={loading}
            >
              טען היסטוריה
            </button>
            {(searchId || transactions.length > 0) && (
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleReset}
                disabled={loading}
              >
                נקה
              </button>
            )}
          </div>
          {searchError && <div className={styles.errorMessage}>{searchError}</div>}
        </div>
        <h2 className={styles.title}>היסטוריית פעולות</h2>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.tableWrapper}>
        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>אין פעולות להצגה</p>
            <p>בצע הפקדה/משיכה או טען היסטוריה לפי תעודת זהות</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>שעה</th>
                <th>סוג פעולה</th>
                <th>סכום</th>
                <th>מספר חשבון</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const isEditing = editingId === tx.id;
                const hasRowError = rowError?.txId === tx.id;
                return (
                  <Fragment key={tx.id}>
                    <tr>
                      <td>{formatDateOnly(tx.createdAt)}</td>
                      <td>{formatTimeOnly(tx.createdAt)}</td>
                      <td>{tx.type === TRANSACTION_TYPE.Deposit ? 'הפקדה' : 'משיכה'}</td>
                      <td>
                        {isEditing ? (
                          <NumericInput
                            value={editAmount}
                            onChange={setEditAmount}
                            maxDigits={10}
                            className={styles.inlineInput}
                            placeholder="סכום"
                          />
                        ) : (
                          tx.amount
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <NumericInput
                            value={editBankAccount}
                            onChange={setEditBankAccount}
                            maxDigits={10}
                            className={styles.inlineInput}
                            placeholder="מספר חשבון"
                          />
                        ) : (
                          tx.bankAccount
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${STATUS_CLASSES[tx.status] ?? styles.statusCancelled}`}
                        >
                          {STATUS_LABELS[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.editButton}`}
                                onClick={() => saveEdit(tx)}
                                disabled={loading}
                              >
                                שמור
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.cancelButton}`}
                                onClick={cancelEdit}
                              >
                                ביטול
                              </button>
                            </>
                          ) : (
                            tx.status !== TRANSACTION_STATUS.Cancelled && (
                              <>
                                <button
                                  type="button"
                                  className={`${styles.actionButton} ${styles.editButton}`}
                                  onClick={() => startEdit(tx)}
                                  disabled={loading}
                                >
                                  ערוך
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionButton} ${styles.cancelButton}`}
                                  onClick={() => cancelTx(tx)}
                                  disabled={loading}
                                >
                                  בטל
                                </button>
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    {hasRowError && (
                      <tr>
                        <td colSpan={COLUMN_COUNT} className={styles.editErrorRow}>
                          {rowError.message}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
