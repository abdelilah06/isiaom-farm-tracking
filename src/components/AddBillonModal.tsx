import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Loader2, Check, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface AddBillonModalProps {
    onClose: () => void
    onAdded: () => void
}

interface Plot {
    id: string
    name: string
}

export default function AddBillonModal({ onClose, onAdded }: AddBillonModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [billonCode, setBillonCode] = useState('')
    const [name, setName] = useState('')
    const [plotId, setPlotId] = useState('')
    const [description, setDescription] = useState('')

    const [plots, setPlots] = useState<Plot[]>([])
    const [plotsLoading, setPlotsLoading] = useState(true)

    useEffect(() => {
        const fetchPlots = async () => {
            setPlotsLoading(true)
            const { data } = await supabase
                .from('plots')
                .select('id, name')
                .order('name')
            setPlots(data || [])
            setPlotsLoading(false)
        }
        fetchPlots()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('billons')
                .insert({
                    billon_code: billonCode.trim() || null,
                    name: name.trim(),
                    plot_id: plotId || null,
                    description: description.trim() || null,
                    status: 'empty',
                })

            if (error) throw error

            setSuccess(true)
            onAdded()
            setTimeout(onClose, 1500)
        } catch (error: any) {
            console.error('Error adding billon:', error)
            alert(`${t('common.error')}: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 15 }}
                        className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <Check className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {t('common.success')}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-bold mt-2">
                        {t('billons.add_new')}
                    </p>
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border border-white/20 dark:border-gray-700"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-900/80 dark:to-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                    {t('billons.add_new')}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                                    إنشاء مصطبة جديدة
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            type="button"
                            className="p-3 bg-white/80 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all shadow-sm"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="px-8 py-8 space-y-5">
                            {/* Row: Billon Code + Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                                        رمز المصطبة (Code)
                                    </label>
                                    <input
                                        type="text"
                                        value={billonCode}
                                        onChange={(e) => setBillonCode(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                        placeholder="Ex: B-01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                                        الاسم (Nom) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                        placeholder="Ex: المصطبة الرئيسية"
                                    />
                                </div>
                            </div>

                            {/* Plot Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                                    القطعة (Parcelle)
                                </label>
                                <select
                                    value={plotId}
                                    onChange={(e) => setPlotId(e.target.value)}
                                    disabled={plotsLoading}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer disabled:opacity-50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                >
                                    <option value="">
                                        {plotsLoading ? '...' : '-- اختر القطعة (اختياري) --'}
                                    </option>
                                    {plots.map((plot) => (
                                        <option key={plot.id} value={plot.id}>
                                            {plot.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                                    الوصف (Description)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    placeholder="وصف اختياري للمصطبة..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-300 transition-all"
                            >
                                {t('common.cancel')}
                            </button>

                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="px-10 bg-gradient-to-r from-amber-500 to-orange-600 text-white h-14 rounded-2xl font-black text-sm hover:shadow-2xl hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl uppercase tracking-wide"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-5 w-5" />
                                        {t('common.save')}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
