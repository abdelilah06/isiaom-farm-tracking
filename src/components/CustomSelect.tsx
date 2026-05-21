import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SelectOption {
    value: string
    label: string
    emoji?: string
    description?: string
    color?: string // tailwind text color class e.g. 'text-green-600'
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    compact?: boolean // smaller variant for unit selectors
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Sélectionner...',
    className = '',
    compact = false,
}: CustomSelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const selected = options.find(o => o.value === value)

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [open])

    return (
        <div ref={ref} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className={`w-full flex items-center justify-between gap-3 bg-white dark:bg-gray-900
                    border-2 rounded-xl transition-all focus:outline-none text-left
                    ${open
                        ? 'border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/10 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                    ${compact ? 'px-3 py-3' : 'px-4 py-3.5'}
                `}
            >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                    {selected ? (
                        <>
                            {selected.emoji && (
                                <span className={`flex-shrink-0 ${compact ? 'text-base' : 'text-xl'}`}>
                                    {selected.emoji}
                                </span>
                            )}
                            <span className={`font-semibold dark:text-white truncate ${compact ? 'text-sm' : 'text-sm'} ${selected.color || 'text-gray-900'}`}>
                                {selected.label}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-400">{placeholder}</span>
                    )}
                </span>
                <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-amber-500' : 'text-gray-400'}`}
                />
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-[200] w-full mt-2 bg-white dark:bg-gray-900
                            border-2 border-gray-100 dark:border-gray-700
                            rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40
                            overflow-hidden"
                        style={{ minWidth: compact ? '160px' : '100%' }}
                    >
                        <div className="py-1 max-h-72 overflow-y-auto">
                            {options.map(opt => {
                                const isSelected = opt.value === value
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => { onChange(opt.value); setOpen(false) }}
                                        className={`w-full flex items-center gap-3 text-left transition-all
                                            ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}
                                            ${isSelected
                                                ? 'bg-amber-50 dark:bg-amber-950/30'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                                            }
                                        `}
                                    >
                                        {/* Left: emoji */}
                                        {opt.emoji && (
                                            <span className={`flex-shrink-0 ${compact ? 'text-base' : 'text-xl'}`}>
                                                {opt.emoji}
                                            </span>
                                        )}

                                        {/* Center: label + description */}
                                        <span className="flex-1 min-w-0">
                                            <span className={`block font-semibold leading-snug
                                                ${compact ? 'text-sm' : 'text-sm'}
                                                ${isSelected
                                                    ? 'text-amber-700 dark:text-amber-400'
                                                    : opt.color || 'text-gray-800 dark:text-gray-100'
                                                }
                                            `}>
                                                {opt.label}
                                            </span>
                                            {opt.description && !compact && (
                                                <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                    {opt.description}
                                                </span>
                                            )}
                                        </span>

                                        {/* Right: checkmark */}
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
