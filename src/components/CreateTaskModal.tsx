import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Loader2, Check, ClipboardList, Calendar, Clock, AlertCircle, Leaf } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateTaskModalProps {
    onClose: () => void
    onTaskAdded: () => void
}

export default function CreateTaskModal({ onClose, onTaskAdded }: CreateTaskModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [plots, setPlots] = useState<{ id: string, name: string }[]>([])

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        task_type: 'irrigation',
        due_date: new Date().toISOString().split('T')[0],
        due_time: '08:00',
        priority: 'medium',
        plot_id: ''
    })

    useEffect(() => {
        fetchPlots()
    }, [])

    async function fetchPlots() {
        try {
            const { data, error } = await supabase
                .from('plots')
                .select('id, name')
                .eq('status', 'active')

            if (error) throw error
            setPlots(data || [])
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, plot_id: data[0].id }))
            }
        } catch (error) {
            console.error('Error fetching plots:', error)
        }
    }

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
            const due_timestamp = `${formData.due_date}T${formData.due_time}:00Z`

            const insertData = {
                title: formData.title,
                description: formData.description,
                task_type: formData.task_type,
                due_date: due_timestamp,
                priority: formData.priority,
                plot_id: formData.plot_id,
                status: 'pending'
            }

            const { error } = await supabase
                .from('tasks')
                .insert(insertData)

            if (error) throw error

            setSuccess(true)
            onTaskAdded()
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            console.error('Error adding task:', error)
            alert(`${t('common.error')}: ${error.message}`)
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-white/20 dark:border-gray-700"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <ClipboardList className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('tasks.create_title')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('tasks.subtitle')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="px-8 py-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800 space-y-8">

                            {/* Plot Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.plot_label')}</label>
                                <div className="relative group">
                                    <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <select
                                        name="plot_id"
                                        required
                                        value={formData.plot_id}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>{t('dashboard.all_plots')}</option>
                                        {plots.map(plot => (
                                            <option key={plot.id} value={plot.id}>{plot.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Task Title */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.title_label')}</label>
                                <input
                                    name="title"
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    placeholder="Ex: Irrigation Zone B"
                                />
                            </div>

                            {/* Type & Priority */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.type_label')}</label>
                                    <select
                                        name="task_type"
                                        value={formData.task_type}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                    >
                                        {Object.entries(t('tasks.types', { returnObjects: true })).map(([key, label]) => (
                                            <option key={key} value={key}>{label as string}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.priority_label')}</label>
                                    <div className="relative group">
                                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                        >
                                            {Object.entries(t('tasks.priorities', { returnObjects: true })).map(([key, label]) => (
                                                <option key={key} value={key}>{label as string}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.due_label')} (Date)</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                        <input
                                            name="due_date"
                                            type="date"
                                            required
                                            value={formData.due_date}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.due_label')} (Time)</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                        <input
                                            name="due_time"
                                            type="time"
                                            required
                                            value={formData.due_time}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{t('tasks.desc_label')}</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
                                    placeholder="Add any specific instructions..."
                                />
                            </div>
                        </div>

                        {/* Footer - Submit */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-gray-950 h-16 rounded-2xl font-black text-lg hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-6 w-6" />
                                        {t('tasks.submit_task')}
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
