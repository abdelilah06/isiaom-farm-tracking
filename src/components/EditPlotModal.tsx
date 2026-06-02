import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Loader2, Check, Sprout, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { Plot } from '../types'

interface EditPlotModalProps {
    plot: Plot
    onClose: () => void
    onUpdated: () => void
}

export default function EditPlotModal({ plot, onClose, onUpdated }: EditPlotModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    
    const [formData, setFormData] = useState({
        name: plot.name,
        crop_variety: plot.crop_variety || '',
        area: plot.area ? plot.area.toString() : '',
        tree_spacing_row: plot.tree_spacing_row ? plot.tree_spacing_row.toString() : '',
        tree_spacing_between: plot.tree_spacing_between ? plot.tree_spacing_between.toString() : '',
        plant_count: plot.plant_count ? plot.plant_count.toString() : '',
        training_method: plot.training_method || 'goblet',
        irrigation_system: plot.irrigation_system || 'goutte_a_goutte',
        rootstock: plot.rootstock || '',
        dripper_flow_rate_lh: plot.dripper_flow_rate_lh ? plot.dripper_flow_rate_lh.toString() : '4',
        irrigation_lines: plot.irrigation_lines ? plot.irrigation_lines.toString() : '1',
        planting_date: plot.planting_date || new Date().toISOString().split('T')[0]
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
            const toNum = (val: string) => {
                const num = parseFloat(val)
                return isNaN(num) ? null : num
            }

            const updateData = {
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
                dripper_flow_rate_lh: toNum(formData.dripper_flow_rate_lh) || 4,
                irrigation_lines: parseInt(formData.irrigation_lines) || 1,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('plots')
                .update(updateData)
                .eq('id', plot.id)

            if (error) throw error

            setSuccess(true)
            onUpdated()
            setTimeout(onClose, 1500)
        } catch (error: any) {
            console.error('Error updating plot:', error)
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-white/20 dark:border-gray-700"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                                <Sprout className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('common.edit')} - {plot.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">#{plot.id}</p>
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
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.plot_name')}</label>
                                                <input
                                                    name="name"
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.crop_variety')}</label>
                                                <input
                                                    name="crop_variety"
                                                    type="text"
                                                    required
                                                    value={formData.crop_variety}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">m²</span>
                                                </div>
                                            </div>
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
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.rootstock')}</label>
                                                <input
                                                    name="rootstock"
                                                    type="text"
                                                    value={formData.rootstock}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                                    placeholder="MM106, M9..."
                                                />
                                            </div>
                                            <div>
                                                {/* Filler */}
                                            </div>
                                        </div>

                                        {/* Dripper Flow Rate & Irrigation Lines */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.dripper_flow_rate_lh', { defaultValue: 'Débit goutteur (L/h)' })}</label>
                                                <input
                                                    name="dripper_flow_rate_lh"
                                                    type="number"
                                                    step="0.1"
                                                    min="0.1"
                                                    required
                                                    value={formData.dripper_flow_rate_lh}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('add_plot.irrigation_lines', { defaultValue: 'Lignes d\'irrigation' })}</label>
                                                <select
                                                    name="irrigation_lines"
                                                    value={formData.irrigation_lines}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="1">{t('add_plot.lines_1', { defaultValue: '1 Ligne (أنبوب واحد)' })}</option>
                                                    <option value="2">{t('add_plot.lines_2', { defaultValue: '2 Lignes (أنبوبين)' })}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
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
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('add_plot.plant_count')}</label>
                                            <input
                                                name="plant_count"
                                                type="number"
                                                value={formData.plant_count}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-white/50 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
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
