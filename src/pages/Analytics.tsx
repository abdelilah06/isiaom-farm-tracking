import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
    Calendar, Filter, Grid, TrendingUp, Activity, ClipboardList,
    Search, ArrowLeft
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const COLORS = ['#059669', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#6366F1'];

export default function Analytics() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()

    const [plots, setPlots] = useState<any[]>([])
    const [operations, setOperations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [authChecking, setAuthChecking] = useState(true)

    // Filters state
    const [dateRange, setDateRange] = useState('30') // Last 30 days
    const [selectedType, setSelectedType] = useState('all')
    const [selectedPlot, setSelectedPlot] = useState('all')

    // SECURITY: Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user || user.user_metadata?.role !== 'admin') {
                    console.warn('Unauthorized access attempt to /admin/analytics')
                    navigate('/')
                    return
                }

                setAuthChecking(false)
            } catch (error) {
                console.error('Auth check failed:', error)
                navigate('/')
            }
        }

        checkAuth()
    }, [navigate])

    useEffect(() => {
        if (!authChecking) {
            fetchData()
        }
    }, [authChecking])

    async function fetchData() {
        setLoading(true)
        try {
            const [plotsRes, opsRes] = await Promise.all([
                supabase.from('plots').select('*'),
                supabase.from('operations').select(`
                    *,
                    plots (name)
                `).order('date', { ascending: false })
            ])

            if (plotsRes.error) throw plotsRes.error
            if (opsRes.error) throw opsRes.error

            setPlots(plotsRes.data || [])
            setOperations(opsRes.data || [])
        } catch (error) {
            console.error('Error fetching analytics data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOps = useMemo(() => {
        return operations.filter(op => {
            const matchesType = selectedType === 'all' || op.type === selectedType
            const matchesPlot = selectedPlot === 'all' || op.plot_id === selectedPlot

            if (dateRange === 'all') return matchesType && matchesPlot

            const opDate = new Date(op.date)
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - parseInt(dateRange))

            return matchesType && matchesPlot && opDate >= cutoff
        })
    }, [operations, selectedType, selectedPlot, dateRange])

    // Stats Calculations
    const stats = useMemo(() => {
        const totalPlots = plots.length
        const totalOps = filteredOps.length
        const avgOps = totalPlots > 0 ? (totalOps / totalPlots).toFixed(1) : 0
        const lastOp = filteredOps.length > 0 ? filteredOps[0].date : '---'

        return { totalPlots, totalOps, avgOps, lastOp }
    }, [plots, filteredOps])

    // Chart Data calculations remain same, but labels should handle dark mode
    const overTimeData = useMemo(() => {
        const groups: Record<string, number> = {}
        const lastDays = parseInt(dateRange === 'all' ? '30' : dateRange)

        for (let i = lastDays; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            groups[dateStr] = 0
        }

        filteredOps.forEach(op => {
            const dateStr = op.date.split('T')[0]
            if (groups[dateStr] !== undefined) {
                groups[dateStr]++
            }
        })

        return Object.entries(groups).map(([date, count]) => ({
            date: date.split('-').slice(1).reverse().join('/'),
            count
        }))
    }, [filteredOps, dateRange])

    const byTypeData = useMemo(() => {
        const groups: Record<string, number> = {}
        filteredOps.forEach(op => {
            const typeLabel = t(`quick_log.types.${op.type}`)
            groups[typeLabel] = (groups[typeLabel] || 0) + 1
        })
        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }, [filteredOps, t])

    const perPlotData = useMemo(() => {
        const groups: Record<string, number> = {}
        filteredOps.forEach(op => {
            const plotName = op.plots?.name || op.plot_id.slice(0, 4)
            groups[plotName] = (groups[plotName] || 0) + 1
        })
        return Object.entries(groups)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }, [filteredOps])

    const plotStatusData = useMemo(() => {
        const active = plots.filter(p => p.status === 'active').length
        const harvested = plots.filter(p => p.status === 'harvested').length
        return [
            { name: t('dashboard.active'), value: active },
            { name: t('dashboard.harvested'), value: harvested }
        ]
    }, [plots, t])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 gap-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-100 dark:border-green-900 border-t-green-600 rounded-full"
            />
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans"
        >
            <header className="glass sticky top-0 z-30 border-b border-white/20 dark:border-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin"
                            className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all group"
                        >
                            <ArrowLeft className="h-6 w-6 text-white group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('analytics.title')}</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Filters */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-50 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 px-4 py-3 rounded-2xl border border-green-100 dark:border-green-800/50 shadow-sm">
                            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer min-w-[120px]"
                            >
                                <option value="7">7 {t('common.days')}</option>
                                <option value="30">30 {t('common.days')}</option>
                                <option value="90">90 {t('common.days')}</option>
                                <option value="all">{t('dashboard.filter_all')}</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 px-4 py-3 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer min-w-[140px]"
                            >
                                <option value="all">{t('analytics.filters.all_types')}</option>
                                {Object.keys(t('quick_log.types', { returnObjects: true })).map(type => (
                                    <option key={type} value={type}>{t(`quick_log.types.${type}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 px-4 py-3 rounded-2xl border border-purple-100 dark:border-purple-800/50 shadow-sm">
                            <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <select
                                value={selectedPlot}
                                onChange={(e) => setSelectedPlot(e.target.value)}
                                className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer min-w-[140px]"
                            >
                                <option value="all">{t('analytics.filters.all_plots')}</option>
                                {plots.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Summary Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: t('analytics.total_plots'), val: stats.totalPlots, icon: Grid, color: 'from-green-400 to-emerald-600' },
                        { label: t('analytics.total_operations'), val: stats.totalOps, icon: Activity, color: 'from-blue-400 to-indigo-600' },
                        { label: t('analytics.avg_ops_per_plot'), val: stats.avgOps, icon: TrendingUp, color: 'from-purple-400 to-violet-600' },
                        { label: t('analytics.last_operation'), val: stats.lastOp !== '---' ? new Date(stats.lastOp).toLocaleDateString(i18n.language) : '---', icon: Calendar, color: 'from-orange-400 to-amber-600', isDate: true }
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md hover:shadow-2xl border border-gray-50 dark:border-gray-700 flex items-center gap-4 transition-all duration-300"
                        >
                            <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                                <card.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider mb-1">{card.label}</p>
                                <p className={`font-black text-gray-900 dark:text-white ${card.isDate ? 'text-sm' : 'text-3xl'}`}>{card.val}</p>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Charts Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Operations Over Time */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-50 dark:border-gray-700 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            {t('analytics.ops_over_time')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={overTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.1} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(31, 41, 55, 0.9)', color: '#fff' }} />
                                    <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={4} dot={{ fill: '#059669', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Operations by Type */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-50 dark:border-gray-700 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Grid className="h-4 w-4 text-white" />
                            </div>
                            {t('analytics.ops_by_type')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={byTypeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(31, 41, 55, 0.9)', color: '#fff' }} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {byTypeData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Operations per Plot */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-50 dark:border-gray-700 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-600 rounded-xl flex items-center justify-center">
                                <ClipboardList className="h-4 w-4 text-white" />
                            </div>
                            {t('analytics.ops_per_plot')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={perPlotData}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(31, 41, 55, 0.9)', color: '#fff' }} />
                                    <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Plot Status Dist */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-50 dark:border-gray-700 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl flex items-center justify-center">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                            {t('analytics.plot_status_dist')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={plotStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {plotStatusData.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#9CA3AF'} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(31, 41, 55, 0.9)', color: '#fff' }} />
                                    <Legend formatter={(value) => <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Recent Activities Table */}
                <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-50 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                            {t('analytics.recent_activities')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F9FAFB] dark:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('analytics.table.plot')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('analytics.table.type')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('analytics.table.date')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('analytics.table.notes')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filteredOps.slice(0, 10).map((op) => (
                                    <tr key={op.id} className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="text-sm font-black text-gray-900 dark:text-white group-hover:text-green-700 transition-colors uppercase">{op.plots?.name || '---'}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                {t(`quick_log.types.${op.type}`)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                                                {new Date(op.date).toLocaleDateString(i18n.language)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs font-medium">{op.notes || '---'}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </motion.div>
    )
}
