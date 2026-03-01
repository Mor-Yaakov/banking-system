import type { FormEvent } from 'react';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { TRANSACTION_TYPE } from '../transaction.constants';
import NumericInput from '../../../components/NumericInput/NumericInput';
import Toast from '../../../components/Toast/Toast';
import styles from './TransactionForm.module.css';

export default function TransactionForm() {
  const { form, fieldErrors, toast, loading, error, handleChange, handleSubmit, resetForm, dismissToast } =
    useTransactionForm();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className={styles.transactionFormBlock}>
      <div className={styles.formHeader}>
        <h2>בצע הפקדה / משיכה</h2>
      </div>
      <form className={styles.formContent} onSubmit={onSubmit}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        <div>
          <label className={styles.label}>שם מלא בעברית</label>
          <input
            name="fullNameHebrew"
            type="text"
            value={form.fullNameHebrew}
            onChange={e => handleChange('fullNameHebrew', e.target.value)}
            className={styles.input}
          />
          {fieldErrors.fullNameHebrew && (
            <div className={styles.errorMessage}>{fieldErrors.fullNameHebrew}</div>
          )}
        </div>

        <div>
          <label className={styles.label}>שם מלא באנגלית</label>
          <input
            name="fullNameEnglish"
            type="text"
            value={form.fullNameEnglish}
            onChange={e => handleChange('fullNameEnglish', e.target.value)}
            className={styles.input}
          />
          {fieldErrors.fullNameEnglish && (
            <div className={styles.errorMessage}>{fieldErrors.fullNameEnglish}</div>
          )}
        </div>

        <div>
          <label className={styles.label}>תאריך לידה</label>
          <input
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={e => handleChange('birthDate', e.target.value)}
            className={styles.input}
          />
          {fieldErrors.birthDate && (
            <div className={styles.errorMessage}>{fieldErrors.birthDate}</div>
          )}
        </div>

        <div>
          <label className={styles.label}>תעודת זהות</label>
          <NumericInput
            value={form.personalUserIdNumber}
            onChange={val => handleChange('personalUserIdNumber', val)}
            maxDigits={9}
            className={styles.input}
            placeholder="תעודת זהות"
          />
          {fieldErrors.personalUserIdNumber && (
            <div className={styles.errorMessage}>{fieldErrors.personalUserIdNumber}</div>
          )}
        </div>

        <div>
          <label className={styles.label}>סוג פעולה</label>
          <select
            name="type"
            value={form.type}
            onChange={e => handleChange('type', e.target.value)}
            className={styles.select}
          >
            <option value={TRANSACTION_TYPE.Deposit}>הפקדה</option>
            <option value={TRANSACTION_TYPE.Withdrawal}>משיכה</option>
          </select>
        </div>

        <div>
          <label className={styles.label}>סכום</label>
          <NumericInput
            value={form.amount === 0 ? '' : String(form.amount)}
            onChange={val => handleChange('amount', val === '' ? 0 : Number(val))}
            maxDigits={10}
            className={styles.input}
            placeholder="סכום"
          />
          {fieldErrors.amount && (
            <div className={styles.errorMessage}>{fieldErrors.amount}</div>
          )}
        </div>

        <div>
          <label className={styles.label}>מספר חשבון</label>
          <NumericInput
            value={form.bankAccount}
            onChange={val => handleChange('bankAccount', val)}
            maxDigits={10}
            className={styles.input}
            placeholder="מספר חשבון"
          />
          {fieldErrors.bankAccount && (
            <div className={styles.errorMessage}>{fieldErrors.bankAccount}</div>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'שולח...' : 'שלח'}
          </button>
          <button type="button" className={styles.resetButton} onClick={resetForm} disabled={loading}>
            נקה
          </button>
        </div>
      </form>

      {toast && <Toast text={toast.text} type={toast.type} onClose={dismissToast} />}
    </div>
  );
}
