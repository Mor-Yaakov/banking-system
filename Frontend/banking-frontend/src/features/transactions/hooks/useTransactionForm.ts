import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { createTransaction, getTransactionsByUser } from '../transactionsSlice';
import { TRANSACTION_TYPE } from '../transaction.constants';
import type { TransactionRequest } from '../types';

const INITIAL_FORM: TransactionRequest = {
  fullNameHebrew: '',
  fullNameEnglish: '',
  birthDate: '',
  personalUserIdNumber: '',
  bankAccount: '',
  amount: 0,
  type: TRANSACTION_TYPE.Deposit,
};

const currentYear = new Date().getFullYear();

const validators: Record<string, (value: unknown) => string | null> = {
  fullNameHebrew: v =>
    /^[\u0590-\u05FF' -]{1,20}$/.test(String(v))
      ? null
      : 'יש למלא עד 20 תווים, בעברית בלבד, גרש, מקף ורווח',
  fullNameEnglish: v =>
    /^[a-zA-Z' -]{1,15}$/.test(String(v))
      ? null
      : 'יש למלא עד 15 תווים, באנגלית בלבד, גרש, מקף ורווח',
  personalUserIdNumber: v =>
    /^\d{9}$/.test(String(v)) ? null : 'יש למלא תעודת זהות בעלת 9 ספרות',
  bankAccount: v =>
    /^\d{1,10}$/.test(String(v)) ? null : 'יש למלא מספר חשבון - עד 10 ספרות',
  amount: v =>
    Number(v) > 0 && /^\d{1,10}$/.test(String(v))
      ? null
      : 'יש למלא סכום - עד 10 ספרות',
  birthDate: v => {
    if (!v) return 'יש למלא תאריך לידה';
    const year = new Date(String(v)).getFullYear();
    if (Number.isNaN(year) || year < 1900 || year > currentYear)
      return 'תאריך לידה חייב להיות בין שנת 1900 לשנה הנוכחית';
    return null;
  },
};

export function useTransactionForm() {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.transactions);

  const [form, setForm] = useState<TransactionRequest>({ ...INITIAL_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleChange = useCallback((name: string, value: string | number) => {
    setFormError(null);
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: validators[name]?.(value) ?? '' }));
  }, []);

  const handleSubmit = useCallback(() => {
    const errors: Record<string, string> = {};
    for (const key in validators) {
      const msg = validators[key](form[key as keyof TransactionRequest]);
      if (msg) errors[key] = msg;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const userId = form.personalUserIdNumber;

    dispatch(createTransaction(form))
      .unwrap()
      .then(() => {
        setToast({ text: 'הפעולה בוצעה בהצלחה!', type: 'success' });
        setForm({ ...INITIAL_FORM });
        setFieldErrors({});
        setFormError(null);
        if (userId) dispatch(getTransactionsByUser(userId));
      })
      .catch((errorMsg: string) => {
        setFormError(errorMsg);
        setToast({ text: 'שגיאה בשליחה', type: 'error' });
      });
  }, [form, dispatch]);

  const resetForm = useCallback(() => {
    setForm({ ...INITIAL_FORM });
    setFieldErrors({});
    setFormError(null);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { form, fieldErrors, toast, loading, error: formError, handleChange, handleSubmit, resetForm, dismissToast };
}
