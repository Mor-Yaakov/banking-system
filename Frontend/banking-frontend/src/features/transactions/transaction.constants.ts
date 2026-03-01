export const TRANSACTION_TYPE = {
  Deposit: 'Deposit',
  Withdrawal: 'Withdrawal',
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export const TRANSACTION_STATUS = {
  Pending: 'Pending',
  Success: 'Success',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];