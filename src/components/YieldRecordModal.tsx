import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import ImageUpload from './ImageUpload'
import { X, Loader2, Check, Scale, Calendar, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface YieldRecordModalProps {
    plotId: string
    plotName: string
    onClose: () => void
    onRecordAdded?: () => void
}

export default function YieldRecordModal({ plotId, plotName, onClose, onRecordAdded }: YieldRecordModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        harvest_date: new Date().toISOString().split('T')[0],
        quantity_kg: '',
        quality_grade: 'A',
        notes: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let image_url = null

            if (imageFile) {
                image_url = await uploadImage(imageFile, 'yield-images')
            }

            const { error } = await supabase
                .from('yield_records')
                .insert({
                    plot_id: plotId,
                    harvest_date: formData.harvest_date,
                    quantity_kg: parseFloat(formData.quantity_kg) || 0,
                    quality_grade: formData.quality_grade,
                    notes: formData.notes || null,
                    image_url
                })

            if (error) throw error

            setSuccess(true)
            onRecordAdded?.()
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            console.error('Error adding yield record:', error)
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-white/20 dark:border-gray-700"
                >

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Scale className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('yield.title')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{plotName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="px-8 py-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800 space-y-6">

                            {/* Harvest Date */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('yield.harvest_date')}</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        name="harvest_date"
                                        type="date"
                                        required
                                        value={formData.harvest_date}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold"
                                    />
                                </div>
                            </div>

                            {/* Quantity & Quality */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('yield.quantity')}</label>
                                    <div className="relative">
                                        <input
                                            name="quantity_kg"
                                            type="number"
                                            required
                                            min="0"
                                            step="0.1"
                                            value={formData.quantity_kg}
                                            onChange={handleChange}
                                            className="w-full pl-5 pr-14 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-black"
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
                                            name="quality_grade"
                                            value={formData.quality_grade}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
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

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('quick_log.notes')}</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
                                    placeholder={t('yield.notes_placeholder')}
                                />
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('yield.photo')}</label>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <ImageUpload
                                        label={t('add_plot.select_image')}
                                        onFileSelect={(file) => {
                                            setImageFile(file)
                                            if (file) {
                                                setPreviewUrl(URL.createObjectURL(file))
                                            }
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

                        {/* Footer - Submit */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-6 w-6" />
                                        {t('yield.submit')}
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
