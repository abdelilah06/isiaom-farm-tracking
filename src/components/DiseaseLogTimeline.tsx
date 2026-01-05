import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bug, Leaf, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

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
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
}

export default function DiseaseLogTimeline({ plotId }: DiseaseLogTimelineProps) {
    const { t } = useTranslation()
    const [logs, setLogs] = useState<DiseaseLog[]>([])
    const [loading, setLoading] = useState(true)

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
        return null // Don't show section if no logs
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
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-2xl text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                    {logs.length} {logs.length === 1 ? 'Issue' : 'Issues'}
                </div>
            </div>

            {/* Logs */}
            <div className="space-y-4">
                {logs.map((log, index) => {
                    const Icon = typeIcons[log.type] || Bug

                    return (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border ${log.resolved_at ? 'border-green-200 dark:border-green-800' : 'border-gray-100 dark:border-gray-800'} shadow-sm hover:shadow-lg transition-all`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`p-3 rounded-xl ${severityColors[log.severity] || severityColors.medium}`}>
                                    <Icon className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                                            {log.name}
                                        </h3>
                                        {log.resolved_at ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                                                <CheckCircle className="h-3 w-3" />
                                                Résolu
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${severityColors[log.severity] || ''}`}>
                                                {t(`disease.severity_levels.${log.severity}`)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="font-bold">
                                            {new Date(log.log_date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg font-bold">
                                            {t(`disease.types.${log.type}`)}
                                        </span>
                                        {log.affected_percentage && (
                                            <span className="flex items-center gap-1 font-bold">
                                                <AlertTriangle className="h-3 w-3" />
                                                {log.affected_percentage}% {t('disease.affected')}
                                            </span>
                                        )}
                                    </div>

                                    {log.treatment && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
                                                {t('disease.treatment')}
                                            </span>
                                            <p className="text-sm text-blue-800 dark:text-blue-300 font-bold">
                                                {log.treatment}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Image */}
                                {log.image_url && (
                                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                        <img
                                            src={log.image_url}
                                            alt={log.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}
