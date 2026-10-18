import React, { useState, useEffect } from 'react';

interface NumericInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type'
  > {
  value: number;
  onValueChange: (val: number) => void;
  min?: number;
  max?: number;
  fallbackValue?: number;
  integer?: boolean;
}

/**
 * Controlled numeric input that keeps a local string buffer while focused
 * so users can freely backspace all digits (e.g. clearing "12" to "" before typing "20")
 * or type intermediate decimals ("0.") without React snapping the value back mid-keystroke.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  min = 0,
  max,
  fallbackValue,
  integer = false,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [text, setText] = useState<string>(() => String(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setText(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw !== '' && !(integer ? /^\d*$/.test(raw) : /^\d*\.?\d*$/.test(raw))) {
      return;
    }
    setText(raw);

    if (raw === '' || raw === '.') {
      return;
    }

    const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      // Only enforce min immediately if parsed > 0 and min <= parsed;
      // defer strict min/max clamping until blur so typing multi-digit numbers is never blocked.
      if (parsed >= min && (max === undefined || parsed <= max)) {
        onValueChange(parsed);
      } else if (parsed > 0 && min <= 1) {
        onValueChange(parsed);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const trimmed = text.trim();
    const parsed = integer ? parseInt(trimmed, 10) : parseFloat(trimmed);

    let finalVal: number;
    if (trimmed === '' || !Number.isFinite(parsed) || parsed < min) {
      finalVal = fallbackValue !== undefined ? fallbackValue : Math.max(min, value);
    } else if (max !== undefined && parsed > max) {
      finalVal = max;
    } else {
      finalVal = parsed;
    }

    onValueChange(finalVal);
    setText(String(finalVal));
    onBlur?.(e);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};
