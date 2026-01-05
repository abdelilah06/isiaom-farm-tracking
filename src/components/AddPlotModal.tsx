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
    const { t } = useTranslation()
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
        irrigation_system: 'goutte_a_goutte',
        rootstock: '',
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

            const insertData = {
                id: formData.id.trim().toUpperCase(),
                name: formData.name,
                crop_variety: formData.crop_variety,
                area: toNum(formData.area) || 0,
                planting_date: formData.planting_date,
                tree_spacing_row: toNum(formData.tree_spacing_row),
                tree_spacing_between: toNum(formData.tree_spacing_between),
                plant_count: toNum(formData.plant_count),
                training_method: formData.training_method || 'goblet',
                irrigation_system: formData.irrigation_system || null,
                rootstock: formData.rootstock || null,
                image_url,
                status: 'active'
            }

            console.log('Attempting to insert:', insertData)

            const { data, error } = await supabase
                .from('plots')
                .insert(insertData)
                .select()

            console.log('Insert result - data:', data)
            console.log('Insert result - error:', error)

            if (error) throw error

            if (!data || data.length === 0) {
                throw new Error('Insert succeeded but no data returned - check RLS policies in Supabase')
            }

            setSuccess(true)
            onPlotAdded()
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            console.error('Error adding plot - Full error object:', error)
            console.error('Error message:', error.message)  // This contains the column name!
            console.error('Error code:', error.code)
            console.error('Error details:', error.details)
            console.error('Error hint:', error.hint)
            alert(`${t('common.error')}: ${error.message || 'Unknown error'}\n\nCode: ${error.code || 'N/A'}`)
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
                                <Sprout className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('add_plot.title')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('add_plot.basic_info')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="px-8 py-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                                {/* Left Column: Technical Details */}
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.plot_id')}</label>
                                                <div className="relative group">
                                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                                    <input
                                                        name="id"
                                                        type="text"
                                                        required
                                                        value={formData.id}
                                                        onChange={handleChange}
                                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 uppercase"
                                                        placeholder="PXXX"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.plot_name')}</label>
                                                <input
                                                    name="name"
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                    placeholder="Ex: Parcelle Est"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.crop_variety')}</label>
                                                <input
                                                    name="crop_variety"
                                                    type="text"
                                                    required
                                                    value={formData.crop_variety}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                    placeholder="Variété"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.area')}</label>
                                                <div className="relative">
                                                    <input
                                                        name="area"
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={formData.area}
                                                        onChange={handleChange}
                                                        className="w-full pl-5 pr-14 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-black"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">m²</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.planting_date')}</label>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                                    <input
                                                        name="planting_date"
                                                        type="date"
                                                        required
                                                        value={formData.planting_date}
                                                        onChange={handleChange}
                                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.training_method')}</label>
                                                <select
                                                    name="training_method"
                                                    value={formData.training_method}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="goblet">{t('add_plot.methods.goblet')}</option>
                                                    <option value="central_axis">{t('add_plot.methods.central_axis')}</option>
                                                    <option value="espalier">{t('add_plot.methods.espalier')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Irrigation System & Rootstock */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.irrigation_system')}</label>
                                                <select
                                                    name="irrigation_system"
                                                    value={formData.irrigation_system}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="goutte_a_goutte">{t('add_plot.irrigation_types.goutte_a_goutte')}</option>
                                                    <option value="aspersion">{t('add_plot.irrigation_types.aspersion')}</option>
                                                    <option value="gravitaire">{t('add_plot.irrigation_types.gravitaire')}</option>
                                                    <option value="micro_aspersion">{t('add_plot.irrigation_types.micro_aspersion')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.rootstock')}</label>
                                                <input
                                                    name="rootstock"
                                                    type="text"
                                                    value={formData.rootstock}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                    placeholder="Ex: MM106, M9, Franc..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-3xl border border-green-100 dark:border-green-800/50 space-y-6">
                                        <h4 className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em] mb-4">{t('add_plot.tree_info')}</h4>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('add_plot.tree_spacing_row')}</label>
                                                <input
                                                    name="tree_spacing_row"
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.tree_spacing_row}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-white/50 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-bold"
                                                    placeholder="2.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('add_plot.tree_spacing_between')}</label>
                                                <input
                                                    name="tree_spacing_between"
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.tree_spacing_between}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-white/50 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-bold"
                                                    placeholder="4.0"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('add_plot.plant_count')}</label>
                                            <div className="relative">
                                                <input
                                                    name="plant_count"
                                                    type="number"
                                                    value={formData.plant_count}
                                                    onChange={handleChange}
                                                    className="w-full pl-4 pr-20 py-3 bg-white dark:bg-gray-900 border border-white/50 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-bold"
                                                    placeholder="500"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">
                                                    {t('public_plot.plant_unit')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Image & UX */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('add_plot.illustration')}</h4>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center">
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

                                    <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                        <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Note Importante</h5>
                                        <p className="text-xs text-blue-700/70 dark:text-blue-300/60 leading-relaxed">
                                            Toutes les données saisies seront immédiatement synchronisées avec les terminaux mobiles des techniciens. Assurez-vous de l'exactitude de l'ID parcelle.
                                        </p>
                                    </div>
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
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-6 w-6" />
                                        {t('add_plot.submit')}
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
