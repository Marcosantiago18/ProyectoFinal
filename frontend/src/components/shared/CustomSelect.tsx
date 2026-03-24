import React, { useState, useEffect, useRef } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    icon?: string;
    id?: string;
    className?: string;
    name?: string;
    size?: 'sm' | 'md';
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    defaultValue,
    onChange,
    options,
    placeholder = 'Seleccionar...',
    icon,
    id,
    className = '',
    name,
    size = 'md'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value !== undefined ? value : (defaultValue || ''));
    const containerRef = useRef<HTMLDivElement>(null);

    const paddingClasses = size === 'sm' ? 'px-3 py-2 rounded-lg' : 'px-4 py-3 rounded-xl';
    const inputClasses = size === 'sm' ? 'text-xs gap-1' : 'text-sm gap-2';
    const iconClasses = size === 'sm' ? 'text-lg' : 'text-xl';
    const topMargin = size === 'sm' ? 'top-10' : 'top-14';

    // Sync external value changes to internal state if controlled
    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const handleSelect = (optionValue: string) => {
        if (value === undefined) {
            setInternalValue(optionValue); // Only update internal state if uncontrolled
        }
        if (onChange) {
            onChange(optionValue);
        }
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === internalValue);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full cursor-pointer group ${className}`}
            id={id}
            onClick={() => setIsOpen(!isOpen)}
        >
            {name && <input type="hidden" name={name} value={internalValue} />}
            
            <div className={`flex items-center justify-between w-full bg-[#0a1628]/80 backdrop-blur-xl border border-white/10 ${paddingClasses} transition-colors hover:bg-white/5 ${isOpen ? 'ring-2 ring-gold-accent' : ''}`}>
                <div className={`flex items-center overflow-hidden ${inputClasses}`}>
                    {icon && <span className={`material-icons text-slate-300 group-hover:text-gold-accent transition-colors ${iconClasses}`}>{icon}</span>}
                    <span className={`truncate font-medium outline-none ${selectedOption ? 'text-white' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <span className={`material-icons text-white/50 transition-transform duration-300 ${size==='sm'?'text-base':''} ${isOpen ? 'rotate-180 text-white' : 'group-hover:text-white'}`}>
                    expand_more
                </span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute left-0 right-0 ${topMargin} mt-2 bg-[#0a1628]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-50 flex-col overflow-hidden max-h-60 overflow-y-auto`}>
                    {options.length === 0 ? (
                        <div className={`px-4 py-3 text-white/50 text-center ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>No hay opciones</div>
                    ) : (
                        options.map((option) => (
                            <div 
                                key={option.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(option.value);
                                }}
                                className={`text-left cursor-pointer transition-all hover:bg-primary/40 ${size === 'sm' ? 'px-3 py-2' : 'px-4 py-3'} ${
                                    internalValue === option.value 
                                        ? 'bg-primary/60 font-bold border-l-4 border-gold-accent text-gold-accent' 
                                        : 'border-l-4 border-transparent text-white hover:text-gold-accent'
                                }`}
                            >
                                <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{option.label}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
