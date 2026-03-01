import type { ChangeEvent } from 'react';

interface NumericInputProps {
  value: string;
  onChange: (val: string) => void;
  maxDigits: number;
  placeholder?: string;
  className?: string;
}

export default function NumericInput({
  value,
  onChange,
  maxDigits,
  placeholder,
  className,
}: NumericInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
    onChange(digitsOnly);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
