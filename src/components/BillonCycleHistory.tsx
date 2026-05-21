import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Layers, Calendar, Wheat, Hash, Clock, Weight, CheckCircle, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { BillonCycle } from '../types'

interface BillonCycleHistoryProps {
    billonId: string
    billonName: string
    onClose: () => void
}

const statusIcons: Record<string, typeof Calendar> = {
    planned: Calendar,
    active: Play,
    completed: CheckCircle
}

const statusColors: Record<string, string> = {
    planned: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    active: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-900/30',
    completed: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
}

export default function BillonCycleHistory({ billonId, billonName, onClose }: BillonCycleHistoryProps) {
    const { t } = useTranslation()
    const [cycles, setCycles] = useState<BillonCycle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCycles() {
            try {
                const { data, error } = await supabase
                    .from('billon_cycles')
                    .select('*')
                    .eq('billon_id', billonId)
                    .order('cycle_number', { ascending: false })

                if (error) throw error
                setCycles(data || [])
            } catch (error) {
                console.error('Error fetching cycles:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCycles()
    }, [billonId])

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700 flex flex-col max-h-[92vh]"
                >
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase truncate">{t('billons.cycle_history')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold truncate">{billonName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="px-8 py-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800 space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : cycles.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers className="h-8 w-8 text-amber-300 dark:text-amber-600" />
                                </div>
                                <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px]">{t('billons.no_activities')}</p>
                            </div>
                        ) : (
                            cycles.map((cycle, idx) => {
                                const StatusIcon = statusIcons[cycle.status] || Calendar
                                const statusColor = statusColors[cycle.status] || statusColors.completed
                                return (
                                    <motion.div
                                        key={cycle.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`rounded-2xl p-5 border ${cycle.status === 'active' ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50'} hover:shadow-lg transition-all`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusColor}`}>
                                                    <StatusIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="font-black text-gray-900 dark:text-white text-sm uppercase">{t('billons.cycle_n', { n: cycle.cycle_number })}</span>
                                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${statusColor}`}>
                                                        {cycle.status === 'active' ? t('dashboard.active') : cycle.status === 'completed' ? t('dashboard.harvested') : t('tasks.filters.pending')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                            {cycle.crop_variety && (
                                                <div className="flex items-center gap-2">
                                                    <Wheat className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="font-bold text-gray-500 dark:text-gray-400">{cycle.crop_variety}</span>
                                                </div>
                                            )}
                                            {cycle.plant_count && (
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-3.5 w-3.5 text-blue-500" />
                                                    <span className="font-bold text-gray-500 dark:text-gray-400">{cycle.plant_count} {t('billons.plant_count')}</span>
                                                </div>
                                            )}
                                            {cycle.planting_date && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-green-500" />
                                                    <span className="font-bold text-gray-500 dark:text-gray-400">{new Date(cycle.planting_date).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            )}
                                            {cycle.growing_cycle_days && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-purple-500" />
                                                    <span className="font-bold text-gray-500 dark:text-gray-400">{cycle.growing_cycle_days} {t('common.days')}</span>
                                                </div>
                                            )}
                                            {cycle.yield_kg && (
                                                <div className="flex items-center gap-2">
                                                    <Weight className="h-3.5 w-3.5 text-amber-600" />
                                                    <span className="font-bold text-gray-500 dark:text-gray-400">{cycle.yield_kg} kg</span>
                                                </div>
                                            )}
                                        </div>

                                        {cycle.notes && (
                                            <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-400 dark:text-gray-500">{cycle.notes}</p>
                                        )}
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
