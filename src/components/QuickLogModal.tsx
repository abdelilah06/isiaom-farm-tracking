import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import ImageUpload from './ImageUpload'
import { X, Loader2, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

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

import { useOffline } from '../lib/OfflineContext'
import { queueOperation } from '../lib/db'

export default function QuickLogModal({ plotId, onClose }: QuickLogModalProps) {
    const { t } = useTranslation()
    const { isOnline } = useOffline()
    const [type, setType] = useState(OPERATION_TYPES[0])
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Drafts
    useEffect(() => {
        const draft = localStorage.getItem(`draft_op_${plotId}`)
        if (draft) {
            const { type: dType, notes: dNotes } = JSON.parse(draft)
            setType(dType)
            setNotes(dNotes)
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
                // Queue for offline sync
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

            const { error } = await supabase
                .from('operations')
                .insert({
                    plot_id: plotId,
                    type: type,
                    notes: notes,
                    date: new Date().toISOString(),
                    image_url
                })

            if (error) throw error

            localStorage.removeItem(`draft_op_${plotId}`)
            setSuccess(true)
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            console.error('Error logging operation:', error)
            alert(`${t('common.error')}: ${error.message || error.error_description || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('common.success')}</h3>
                </div>
            </div>
        )
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >

                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                        <h3 className="font-bold text-gray-900">{t('quick_log.title')}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form Body - Scrollable */}
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Left Column: Operation Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">{t('quick_log.operation_type')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {OPERATION_TYPES.map(opId => (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={opId}
                                                type="button"
                                                onClick={() => setType(opId)}
                                                className={`p-4 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center text-center h-20 ${type === opId
                                                    ? 'border-green-600 bg-green-50 text-green-700 ring-2 ring-green-600 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {t(`quick_log.types.${opId}`)}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Column: Notes & Image */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('quick_log.notes')}</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all h-24 resize-none"
                                            placeholder="..."
                                        />
                                    </div>

                                    <div>
                                        <ImageUpload
                                            label={t('quick_log.photo_proof')}
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
                        </div>

                        {/* Footer - Sticky Button */}
                        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 z-10">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white h-14 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('quick_log.submit')}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
