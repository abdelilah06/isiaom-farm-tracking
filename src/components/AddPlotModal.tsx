import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import ImageUpload from './ImageUpload'
import { X, Loader2, Check, Sprout, Calendar, Hash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface AddPlotModalProps {
    onClose: () => void
    onPlotAdded: () => void
}

export default function AddPlotModal({ onClose, onPlotAdded }: AddPlotModalProps) {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        crop_variety: '',
        area: '',
        tree_spacing_row: '',
        tree_spacing_between: '',
        plant_count: '',
        training_method: 'goblet',
        planting_date: new Date().toISOString().split('T')[0]
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                image_url = await uploadImage(imageFile, 'plots-images')
            }

            const toNum = (val: string) => {
                const num = parseFloat(val)
                return isNaN(num) ? null : num
            }

            const { error } = await supabase
                .from('plots')
                .insert({
                    id: formData.id,
                    name: formData.name,
                    crop_variety: formData.crop_variety,
                    area: toNum(formData.area) || 0,
                    tree_spacing_row: toNum(formData.tree_spacing_row),
                    tree_spacing_between: toNum(formData.tree_spacing_between),
                    plant_count: toNum(formData.plant_count),
                    training_method: formData.training_method,
                    planting_date: formData.planting_date,
                    image_url,
                    status: 'active'
                })

            if (error) throw error

            setSuccess(true)
            onPlotAdded()
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            console.error('Error adding plot:', error)
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
                    className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
                >

                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Sprout className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">{t('add_plot.title')}</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form Body - Scrollable */}
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-grow bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Left Column: Basic Information */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('add_plot.basic_info')}</h4>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.plot_id')}</label>
                                            <div className="relative">
                                                <Hash className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    name="id"
                                                    type="text"
                                                    required
                                                    value={formData.id}
                                                    onChange={handleChange}
                                                    className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                    placeholder="P001"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.plot_name')}</label>
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                placeholder="Plot name"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.crop_variety')}</label>
                                                <input
                                                    name="crop_variety"
                                                    type="text"
                                                    required
                                                    value={formData.crop_variety}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                    placeholder="Crop type"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.area')}</label>
                                                <input
                                                    name="area"
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={formData.area}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                    placeholder="1000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.planting_date')}</label>
                                            <div className="relative">
                                                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    name="planting_date"
                                                    type="date"
                                                    required
                                                    value={formData.planting_date}
                                                    onChange={handleChange}
                                                    className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* New Spacing & Training Fields */}
                                        <div className="pt-2 border-t border-gray-100 mt-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('add_plot.tree_info', { defaultValue: 'Tree Information' })}</h4>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.tree_spacing_row')}</label>
                                                    <input
                                                        name="tree_spacing_row"
                                                        type="number"
                                                        step="0.1"
                                                        value={formData.tree_spacing_row}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                        placeholder="2.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.tree_spacing_between')}</label>
                                                    <input
                                                        name="tree_spacing_between"
                                                        type="number"
                                                        step="0.1"
                                                        value={formData.tree_spacing_between}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                        placeholder="4.0"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.training_method')}</label>
                                                <select
                                                    name="training_method"
                                                    value={formData.training_method}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm appearance-none bg-white"
                                                >
                                                    <option value="goblet">{t('add_plot.methods.goblet')}</option>
                                                    <option value="central_axis">{t('add_plot.methods.central_axis')}</option>
                                                    <option value="espalier">{t('add_plot.methods.espalier')}</option>
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add_plot.plant_count')}</label>
                                                <div className="relative">
                                                    <input
                                                        name="plant_count"
                                                        type="number"
                                                        value={formData.plant_count}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                                        placeholder="500"
                                                    />
                                                    <span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3 text-xs text-gray-400`}>
                                                        {t('public_plot.plant_unit')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Image Upload */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('add_plot.illustration')}</h4>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 h-full">
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
                        </div>

                        {/* Footer - Sticky Button */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white h-14 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('add_plot.submit')}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
