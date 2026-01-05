import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import ImageUpload from './ImageUpload'
import { X, Loader2, Check, ClipboardList, Send, Scale, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '../lib/OfflineContext'
import { queueOperation } from '../lib/db'

const OPERATION_TYPES = [
    'irrigation',
    'fertilization',
    'pest_control',
    'pruning',
    'harvest',
    'observation',
    'planting',
    'other'
]

interface QuickLogModalProps {
    plotId: string
    onClose: () => void
}

export default function QuickLogModal({ plotId, onClose }: QuickLogModalProps) {
    const { t } = useTranslation()
    const { isOnline } = useOffline()
    const [type, setType] = useState(OPERATION_TYPES[0])
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    // Harvest-specific fields
    const [harvestQuantity, setHarvestQuantity] = useState('')
    const [harvestQuality, setHarvestQuality] = useState('A')

    // Drafts
    useEffect(() => {
        const draft = localStorage.getItem(`draft_op_${plotId}`)
        if (draft) {
            try {
                const { type: dType, notes: dNotes } = JSON.parse(draft)
                setType(dType)
                setNotes(dNotes)
            } catch (e) {
                console.error('Failed to parse draft', e)
            }
        }
    }, [plotId])

    useEffect(() => {
        localStorage.setItem(`draft_op_${plotId}`, JSON.stringify({ type, notes }))
    }, [type, notes, plotId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!isOnline) {
                await queueOperation({
                    plot_id: plotId,
                    type: type,
                    notes: notes,
                    date: new Date().toISOString(),
                    image_file: imageFile || undefined
                })
                localStorage.removeItem(`draft_op_${plotId}`)
                setSuccess(true)
                setTimeout(() => onClose(), 1500)
                return
            }

            let image_url = null
            if (imageFile) {
                image_url = await uploadImage(imageFile, 'operations-images')
            }

            // Build notes including harvest data if applicable
            let finalNotes = notes
            if (type === 'harvest' && harvestQuantity) {
                const harvestInfo = `📦 ${harvestQuantity} kg | ⭐ ${harvestQuality}`
                finalNotes = harvestInfo + (notes ? ` | ${notes}` : '')
            }

            const { error } = await supabase
                .from('operations')
                .insert({
                    plot_id: plotId,
                    type: type,
                    notes: finalNotes,
                    date: new Date().toISOString(),
                    image_url
                })

            if (error) throw error

            // If harvest, also save to yield_records for analytics
            if (type === 'harvest' && harvestQuantity) {
                await supabase.from('yield_records').insert({
                    plot_id: plotId,
                    harvest_date: new Date().toISOString().split('T')[0],
                    quantity_kg: parseFloat(harvestQuantity) || 0,
                    quality_grade: harvestQuality,
                    notes: notes || null,
                    image_url
                })
            }

            localStorage.removeItem(`draft_op_${plotId}`)
            setSuccess(true)
            setTimeout(() => onClose(), 1500)
        } catch (error: any) {
            console.error('Error logging operation:', error)
            alert(`${t('common.error')}: ${error.message || error.error_description || 'Unknown error'}`)
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
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-white/20 dark:border-gray-700"
                >

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                                <ClipboardList className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('quick_log.title')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('dashboard.subtitle')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="p-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                                {/* Type Selection */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 px-1">{t('quick_log.operation_type')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {OPERATION_TYPES.map(opId => (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={opId}
                                                type="button"
                                                onClick={() => setType(opId)}
                                                className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center text-center h-24 ${type === opId
                                                    ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-4 ring-green-500/10'
                                                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50'
                                                    }`}
                                            >
                                                {t(`quick_log.types.${opId}`)}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes & Upload */}
                                <div className="space-y-8">

                                    {/* Harvest-specific fields */}
                                    {type === 'harvest' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-3xl border border-amber-200 dark:border-amber-800/50 space-y-4"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                                <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">{t('yield.title')}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('yield.quantity')}</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            value={harvestQuantity}
                                                            onChange={(e) => setHarvestQuantity(e.target.value)}
                                                            className="w-full pl-5 pr-14 py-4 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-black"
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">kg</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('yield.quality')}</label>
                                                    <div className="relative group">
                                                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                                                        <select
                                                            value={harvestQuality}
                                                            onChange={(e) => setHarvestQuality(e.target.value)}
                                                            className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                                        >
                                                            <option value="A">{t('yield.grades.A')}</option>
                                                            <option value="B">{t('yield.grades.B')}</option>
                                                            <option value="C">{t('yield.grades.C')}</option>
                                                            <option value="export">{t('yield.grades.export')}</option>
                                                            <option value="local">{t('yield.grades.local')}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('quick_log.notes')}</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all h-32 resize-none text-sm font-bold dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                            placeholder="Détails de l'intervention..."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('quick_log.photo_proof')}</label>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-all duration-300 min-h-[200px] flex items-center justify-center">
                                            <ImageUpload
                                                label={t('quick_log.photo_proof')}
                                                onFileSelect={(file) => {
                                                    setImageFile(file)
                                                    if (file) setPreviewUrl(URL.createObjectURL(file))
                                                }}
                                                previewUrl={previewUrl}
                                                onClear={() => {
                                                    setImageFile(null)
                                                    setPreviewUrl(null)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-6 w-6" />
                                        {t('quick_log.submit')}
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
