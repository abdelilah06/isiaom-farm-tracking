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
import { Link } from 'react-router-dom'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const COLORS = ['#059669', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#6366F1'];

export default function Analytics() {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    const [plots, setPlots] = useState<any[]>([])
    const [operations, setOperations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters state
    const [dateRange, setDateRange] = useState('30') // Last 30 days
    const [selectedType, setSelectedType] = useState('all')
    const [selectedPlot, setSelectedPlot] = useState('all')

    useEffect(() => {
        fetchData()
    }, [])

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

    // Chart Data: Operations Over Time
    const overTimeData = useMemo(() => {
        const groups: Record<string, number> = {}
        const lastDays = parseInt(dateRange === 'all' ? '30' : dateRange)

        // Initialize last X days
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

    // Chart Data: Operations by Type
    const byTypeData = useMemo(() => {
        const groups: Record<string, number> = {}
        filteredOps.forEach(op => {
            const typeLabel = t(`quick_log.types.${op.type}`)
            groups[typeLabel] = (groups[typeLabel] || 0) + 1
        })
        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }, [filteredOps, t])

    // Chart Data: Operations per Plot
    const perPlotData = useMemo(() => {
        const groups: Record<string, number> = {}
        filteredOps.forEach(op => {
            const plotName = op.plots?.name || op.plot_id.slice(0, 4)
            groups[plotName] = (groups[plotName] || 0) + 1
        })
        return Object.entries(groups)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10) // Top 10 active plots
    }, [filteredOps])

    // Chart Data: Plot Status
    const plotStatusData = useMemo(() => {
        const active = plots.filter(p => p.status === 'active').length
        const harvested = plots.filter(p => p.status === 'harvested').length
        return [
            { name: t('dashboard.active'), value: active },
            { name: t('dashboard.harvested'), value: harvested }
        ]
    }, [plots, t])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full"
            />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 font-sans"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin"
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-green-600 transition-all"
                        >
                            <ArrowLeft className={`h-6 w-6 ${isRtl ? 'rotate-180' : ''}`} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('analytics.title')}</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('dashboard.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

                {/* Filters */}
                <section className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none px-2 cursor-pointer"
                        >
                            <option value="7">7 {t('common.days')}</option>
                            <option value="30">30 {t('common.days')}</option>
                            <option value="90">90 {t('common.days')}</option>
                            <option value="all">{t('dashboard.filter_all')}</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none px-2 cursor-pointer"
                        >
                            <option value="all">{t('analytics.filters.all_types')}</option>
                            {Object.keys(t('quick_log.types', { returnObjects: true })).map(type => (
                                <option key={type} value={type}>{t(`quick_log.types.${type}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                        <Search className="h-4 w-4 text-gray-400" />
                        <select
                            value={selectedPlot}
                            onChange={(e) => setSelectedPlot(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none px-2 cursor-pointer"
                        >
                            <option value="all">{t('analytics.filters.all_plots')}</option>
                            {plots.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Summary Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <Grid className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('analytics.total_plots')}</p>
                            <p className="text-2xl font-black">{stats.totalPlots}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('analytics.total_operations')}</p>
                            <p className="text-2xl font-black">{stats.totalOps}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('analytics.avg_ops_per_plot')}</p>
                            <p className="text-2xl font-black">{stats.avgOps}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('analytics.last_operation')}</p>
                            <p className="text-sm font-black">{stats.lastOp !== '---' ? new Date(stats.lastOp).toLocaleDateString(i18n.language) : '---'}</p>
                        </div>
                    </div>
                </section>

                {/* Charts Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Operations Over Time */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            {t('analytics.ops_over_time')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={overTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#059669"
                                        strokeWidth={4}
                                        dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Operations by Type */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Grid className="h-4 w-4 text-blue-600" />
                            {t('analytics.ops_by_type')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={byTypeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {byTypeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Operations per Plot */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-purple-600" />
                            {t('analytics.ops_per_plot')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={perPlotData}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={60}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#1F2937' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Plot Status Distribution */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-600" />
                            {t('analytics.plot_status_dist')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={plotStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {plotStatusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#9CA3AF'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span className="text-xs font-bold text-gray-500">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Recent Activities Table */}
                <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-600" />
                            {t('analytics.recent_activities')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right" dir={isRtl ? 'rtl' : 'ltr'}>
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('analytics.table.plot')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('analytics.table.type')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('analytics.table.date')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('analytics.table.notes')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOps.slice(0, 10).map((op) => (
                                    <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900">{op.plots?.name || '---'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase">
                                                {t(`quick_log.types.${op.type}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500 font-medium">
                                                {new Date(op.date).toLocaleDateString(i18n.language)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-400 truncate max-w-xs">{op.notes || '---'}</p>
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
