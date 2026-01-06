import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bug, Leaf, AlertTriangle, CheckCircle, Loader2, LayoutGrid, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface DiseaseLogTimelineProps {
    plotId: string
}

interface DiseaseLog {
    id: string
    log_date: string
    type: string
    name: string
    severity: string
    affected_percentage: number | null
    treatment: string | null
    image_url: string | null
    resolved_at: string | null
}

const typeIcons: Record<string, any> = {
    disease: Bug,
    pest: Bug,
    deficiency: Leaf
}

const severityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 shadow-green-500/10',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 shadow-yellow-500/10',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800 shadow-orange-500/10',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 shadow-red-500/10'
}

export default function DiseaseLogTimeline({ plotId }: DiseaseLogTimelineProps) {
    const { t } = useTranslation()
    const [logs, setLogs] = useState<DiseaseLog[]>([])
    const [loading, setLoading] = useState(true)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [plotId])

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('disease_logs')
                .select('*')
                .eq('plot_id', plotId)
                .order('log_date', { ascending: false })

            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error('Error fetching disease logs:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            </div>
        )
    }

    if (logs.length === 0) {
        return null
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-gradient-to-b from-red-500 to-rose-500 rounded-full shadow-lg" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {t('disease.history')}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-2xl text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hidden sm:block">
                        {logs.length} {logs.length === 1 ? 'Issue' : 'Issues'}
                    </div>
                    <button
                        onClick={() => setIsVisible(!isVisible)}
                        className={`p-3 rounded-2xl transition-all shadow-lg ${isVisible ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`}
                    >
                        {isVisible ? <EyeOff className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Horizontal Deck */}
            <AnimatePresence mode="wait">
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 snap-x no-scrollbar">
                            {logs.map((log, index) => {
                                const Icon = typeIcons[log.type] || Bug

                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex-shrink-0 w-[320px] sm:w-[380px] snap-center"
                                    >
                                        <div className={`h-full bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border-2 ${log.resolved_at ? 'border-green-100 dark:border-green-900/50' : 'border-gray-50 dark:border-gray-800'} shadow-xl shadow-gray-200/50 dark:shadow-black/20 flex flex-col gap-5`}>
                                            <div className="flex items-start justify-between">
                                                <div className={`p-4 rounded-2xl ${severityColors[log.severity] || severityColors.medium} shadow-xl`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                                        {new Date(log.log_date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {log.resolved_at ? (
                                                        <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Résolu
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${severityColors[log.severity]}`}>
                                                            {t(`disease.severity_levels.${log.severity}`)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 truncate">
                                                    {log.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-100 dark:border-gray-700">
                                                        {t(`disease.types.${log.type}`)}
                                                    </span>
                                                    {log.affected_percentage && (
                                                        <span className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest border border-red-100 dark:border-red-900/30 flex items-center gap-1.5">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {log.affected_percentage}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {log.image_url && (
                                                <div className="relative aspect-video rounded-3xl overflow-hidden group">
                                                    <img
                                                        src={log.image_url}
                                                        alt={log.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                                </div>
                                            )}

                                            {log.treatment && (
                                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-900/30">
                                                    <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] block mb-2">Traitement</span>
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {log.treatment}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
