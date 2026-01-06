import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
    Plus, Search, Calendar, Clock,
    MoreVertical, ArrowLeft,
    Droplets, Package, Scissors, Leaf, Bug, ClipboardList,
    Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import CreateTaskModal from '@/components/CreateTaskModal'

interface Task {
    id: string
    title: string
    description: string
    task_type: 'irrigation' | 'fertilization' | 'pest_control' | 'pruning' | 'harvest' | 'other'
    due_date: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'pending' | 'completed' | 'cancelled'
    plot_id: string
    plots: {
        name: string
    }
}

export default function Tasks() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'high_priority'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        fetchTasks()
    }, [filter])

    async function updateTaskStatus(taskId: string, newStatus: 'completed' | 'pending' | 'cancelled') {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', taskId)

            if (error) throw error
            fetchTasks()
        } catch (error) {
            console.error('Error updating task status:', error)
        }
    }

    async function fetchTasks() {
        setLoading(true)
        try {
            let query = supabase
                .from('tasks')
                .select('*, plots(name)')
                .order('due_date', { ascending: true })

            if (filter === 'pending') {
                query = query.eq('status', 'pending')
            } else if (filter === 'completed') {
                query = query.eq('status', 'completed')
            } else if (filter === 'high_priority') {
                query = query.in('priority', ['high', 'critical'])
            }

            const { data, error } = await query

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500 text-white'
            case 'high': return 'bg-orange-500 text-white'
            case 'medium': return 'bg-blue-500 text-white'
            default: return 'bg-gray-400 text-white'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'irrigation': return <Droplets className="h-4 w-4" />
            case 'fertilization': return <Leaf className="h-4 w-4" />
            case 'pest_control': return <Bug className="h-4 w-4" />
            case 'pruning': return <Scissors className="h-4 w-4" />
            case 'harvest': return <Package className="h-4 w-4" />
            default: return <ClipboardList className="h-4 w-4" />
        }
    }

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.plots?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 h-20">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('tasks.title')}</h1>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('tasks.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:inline">{t('tasks.create_task')}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-32 md:px-8">
                {/* Filters & Search */}
                <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full md:w-auto">
                        {(['all', 'pending', 'completed', 'high_priority'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-lg'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {t(`tasks.filters.${f}`)}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('dashboard.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 dark:text-white rounded-[2rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
                        </div>
                    ) : filteredTasks.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTasks.map((task) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={task.id}
                                    className="group bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-xl shadow-green-900/5 hover:border-green-500/30 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-6">
                                            <div className={`p-4 rounded-2xl ${getPriorityColor(task.priority)} shadow-lg`}>
                                                {getTypeIcon(task.task_type)}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{task.title}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${task.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                                                        {t(`tasks.filters.${task.status}`)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 ring-1 ring-gray-100 dark:ring-gray-800 px-2 py-0.5 rounded-md">
                                                        <Leaf className="h-3 w-3" /> {task.plots?.name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3" /> {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-MA' : i18n.language, { dateStyle: 'long' }).format(new Date(task.due_date))}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" /> {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-MA' : i18n.language, { timeStyle: 'short' }).format(new Date(task.due_date))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 ml-16 md:ml-0">
                                            <button className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => task.status !== 'completed' && updateTaskStatus(task.id, 'completed')}
                                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${task.status === 'completed'
                                                    ? 'bg-green-50 text-green-600 dark:bg-green-900/10 cursor-default'
                                                    : 'bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95'
                                                    }`}
                                            >
                                                {task.status === 'completed' ? t('tasks.filters.completed') : t('tasks.submit_task')}
                                            </button>
                                        </div>
                                    </div>
                                    {task.description && (
                                        <p className="mt-4 ml-20 text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl border-l-2 border-gray-50 dark:border-gray-800 pl-6">
                                            {task.description}
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                                <ClipboardList className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{t('tasks.no_tasks')}</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-6 px-10 py-4 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-500/20 hover:scale-105 transition-all"
                            >
                                {t('tasks.create_task')}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateTaskModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onTaskAdded={() => fetchTasks()}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
