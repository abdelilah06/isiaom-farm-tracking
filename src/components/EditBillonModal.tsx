import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Loader2, Check, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { Billon } from '../types'

interface EditBillonModalProps {
    billon: Billon
    onClose: () => void
    onUpdated: () => void
}

export default function EditBillonModal({ billon, onClose, onUpdated }: EditBillonModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [name, setName] = useState(billon.name)
    const [description, setDescription] = useState(billon.description || '')
    const [status, setStatus] = useState(billon.status)
    const [billonCode, setBillonCode] = useState(billon.billon_code || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase
                .from('billons')
                .update({
                    name: name.trim(),
                    description: description.trim() || null,
                    status,
                    billon_code: billonCode.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', billon.id)

            if (error) throw error

            setSuccess(true)
            onUpdated()
            setTimeout(onClose, 1500)
        } catch (error: any) {
            console.error('Error updating billon:', error)
            alert(`${t('common.error')}: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl"
                >
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700"
                >
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('common.edit')} Billon</h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white dark:bg-gray-800">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('add_plot.plot_name')}</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('billons.notes')}</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold resize-none" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('billons.billon_code')}</label>
                            <input type="text" value={billonCode} onChange={(e) => setBillonCode(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('billons.status')}</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as Billon['status'])}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer">
                                <option value="active">{t('dashboard.active')}</option>
                                <option value="fallow">{t('billons.statuses.fallow')}</option>
                                <option value="harvested">{t('dashboard.harvested')}</option>
                                <option value="empty">{t('billons.statuses.empty')}</option>
                                <option value="planted">{t('billons.statuses.planted')}</option>
                                <option value="resting">{t('billons.statuses.resting')}</option>
                            </select>
                        </div>

                        <motion.button
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> {t('common.save')}</>}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
