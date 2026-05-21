import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Loader2, Check, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { BillonCycle } from '../types'

interface CloseCycleModalProps {
    billonId: string
    activeCycle: BillonCycle
    onClose: () => void
    onClosed: () => void
}

export default function CloseCycleModal({ billonId, activeCycle, onClose, onClosed }: CloseCycleModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0])
    const [yieldKg, setYieldKg] = useState('')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error: cycleError } = await supabase
                .from('billon_cycles')
                .update({
                    status: 'completed',
                    harvest_date: harvestDate || null,
                    yield_kg: yieldKg ? parseFloat(yieldKg) : null,
                    notes: notes.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeCycle.id)

            if (cycleError) throw cycleError

            const { error: updateError } = await supabase
                .from('billons')
                .update({ active_cycle_id: null, status: 'harvested', updated_at: new Date().toISOString() })
                .eq('id', billonId)

            if (updateError) throw updateError

            setSuccess(true)
            onClosed()
            setTimeout(onClose, 1500)
        } catch (error: any) {
            console.error('Error closing cycle:', error)
            alert(`${t('common.error')}: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('common.success')}</h3>
                </motion.div>
            </div>
        )
    }

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
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('billons.close_cycle')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('billons.cycle_n', { n: activeCycle.cycle_number })}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="px-8 py-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800 space-y-6">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('billons.close_cycle_desc')}</p>

                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 space-y-2 border border-amber-100 dark:border-amber-900/30">
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('billons.crop_variety')}</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{activeCycle.crop_variety || '--'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('billons.planting_date')}</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                        {activeCycle.planting_date ? new Date(activeCycle.planting_date).toLocaleDateString('fr-FR') : '--'}
                                    </span>
                                </div>
                                {activeCycle.growing_cycle_days && (
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('billons.growing_cycle')}</span>
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{activeCycle.growing_cycle_days} {t('common.days')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('billons.harvest_date')}</label>
                                    <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('billons.yield_kg')}</label>
                                    <input type="number" min="0" step="0.01" value={yieldKg} onChange={(e) => setYieldKg(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('billons.notes')}</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold resize-none"
                                    placeholder={t('billons.notes_placeholder')} />
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><CheckCircle className="h-6 w-6" /> {t('billons.close_cycle')}</>}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
