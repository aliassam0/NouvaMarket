import React, { useRef, useEffect, TextareaHTMLAttributes } from 'react';

interface AutoResizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  minRows = 2,
  rows,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const element = textareaRef.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${Math.max(element.scrollHeight, 60)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={rows || minRows}
      onChange={(e) => {
        adjustHeight();
        if (onChange) onChange(e);
      }}
      placeholder={placeholder}
      className={`w-full p-3 rounded-2xl bg-slate-950/80 dark:bg-slate-900 border border-slate-800 text-slate-100 font-medium text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none overflow-hidden ${className}`}
      {...props}
    />
  );
};
