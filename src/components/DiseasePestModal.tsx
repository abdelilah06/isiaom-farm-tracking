import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import ImageUpload from './ImageUpload'
import { X, Loader2, Check, Bug, Calendar, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface DiseasePestModalProps {
    plotId: string
    plotName: string
    onClose: () => void
    onRecordAdded?: () => void
}

export default function DiseasePestModal({ plotId, plotName, onClose, onRecordAdded }: DiseasePestModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        log_date: new Date().toISOString().split('T')[0],
        type: 'disease',
        name: '',
        severity: 'medium',
        affected_percentage: '',
        treatment: '',
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
                image_url = await uploadImage(imageFile, 'disease-images')
            }

            const { error } = await supabase
                .from('disease_logs')
                .insert({
                    plot_id: plotId,
                    log_date: formData.log_date,
                    type: formData.type,
                    name: formData.name,
                    severity: formData.severity,
                    affected_percentage: parseFloat(formData.affected_percentage) || null,
                    treatment: formData.treatment || null,
                    image_url
                })

            if (error) throw error

            setSuccess(true)
            onRecordAdded?.()
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            console.error('Error adding disease log:', error)
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
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Bug className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('disease.title')}</h3>
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

                            {/* Date & Type */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.log_date')}</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <input
                                            name="log_date"
                                            type="date"
                                            required
                                            value={formData.log_date}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.type')}</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="disease">{t('disease.types.disease')}</option>
                                        <option value="pest">{t('disease.types.pest')}</option>
                                        <option value="deficiency">{t('disease.types.deficiency')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Problem Name */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.name')}</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    placeholder={t('disease.name_placeholder')}
                                />
                            </div>

                            {/* Severity & Affected % */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.severity')}</label>
                                    <div className="relative group">
                                        <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <select
                                            name="severity"
                                            value={formData.severity}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="low">{t('disease.severity_levels.low')}</option>
                                            <option value="medium">{t('disease.severity_levels.medium')}</option>
                                            <option value="high">{t('disease.severity_levels.high')}</option>
                                            <option value="critical">{t('disease.severity_levels.critical')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.affected')}</label>
                                    <div className="relative">
                                        <input
                                            name="affected_percentage"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.affected_percentage}
                                            onChange={handleChange}
                                            className="w-full pl-5 pr-10 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-black"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Treatment */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.treatment')}</label>
                                <textarea
                                    name="treatment"
                                    value={formData.treatment}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
                                    placeholder={t('disease.treatment_placeholder')}
                                />
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('disease.photo')}</label>
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
                                className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-6 w-6" />
                                        {t('disease.submit')}
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
