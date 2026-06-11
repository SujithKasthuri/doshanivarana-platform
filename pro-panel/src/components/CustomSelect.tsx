import { useState, useRef, useEffect } from 'react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
}

export function CustomSelect({ value, onChange, options, disabled, className = '', triggerClassName = '', placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className={`w-full appearance-none flex items-center justify-between transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${triggerClassName || 'bg-surface border border-outline-variant/80 rounded-lg pl-3 sm:pl-4 pr-10 py-2.5 sm:py-2 text-on-surface hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        <span className="truncate font-semibold text-body-sm sm:text-body-md">
          {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
        </span>
        <span className="material-symbols-outlined absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm sm:text-base transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>arrow_drop_down</span>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-outline-variant/30 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-[9999] max-h-60 overflow-y-auto font-sans text-body-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(opt => (
            <div 
              key={opt.value}
              className={`px-3 sm:px-4 py-3 sm:py-2.5 cursor-pointer hover:bg-primary/5 transition-colors truncate ${value === opt.value ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
             <div className="px-4 py-3 text-on-surface-variant italic text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
