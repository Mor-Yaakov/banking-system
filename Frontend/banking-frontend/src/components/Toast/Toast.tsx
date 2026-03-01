import { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  text: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ text, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`${styles.toast} ${type === 'success' ? styles.success : styles.error}`}>
      <span>{text}</span>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close notification">
        ✖
      </button>
    </div>
  );
}
