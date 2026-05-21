import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Grid, TrendingUp, Droplets, Plus, Search, Filter, X,
    QrCode, BarChart3, User, LayoutDashboard, ClipboardList, Leaf, Settings as SettingsIcon,
    Trash2, Layers, Activity, Eye, Wheat
} from 'lucide-react'
import QuickLogModal from '@/components/QuickLogModal'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import AddPlotModal from '@/components/AddPlotModal'
import AddBillonModal from '@/components/AddBillonModal'
import EditBillonModal from '@/components/EditBillonModal'
import StartCycleModal from '@/components/StartCycleModal'
import CloseCycleModal from '@/components/CloseCycleModal'
import BillonCycleHistory from '@/components/BillonCycleHistory'
import AddBillonActivityModal from '@/components/AddBillonActivityModal'
import type { Billon } from '../types'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { cachePlots, getCachedPlots } from '@/lib/db'

export default function AdminDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [plots, setPlots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [authChecking, setAuthChecking] = useState(true)
    const [selectedPlotForLog, setSelectedPlotForLog] = useState<string | null>(null)
    const [selectedPlotForQR, setSelectedPlotForQR] = useState<string | null>(null)
    const [showAddPlotModal, setShowAddPlotModal] = useState(false)
    const [stats, setStats] = useState({
        totalPlots: 0,
        opsThisMonth: 0,
        irrigation7d: 0
    })

    // Billon state
    const [billons, setBillons] = useState<Billon[]>([])
    const [billonsLoading, setBillonsLoading] = useState(true)
    const [showAddBillonModal, setShowAddBillonModal] = useState(false)
    const [editingBillon, setEditingBillon] = useState<Billon | null>(null)
    const [activeCycles, setActiveCycles] = useState<Record<string, any>>({})
    const [showStartCycleModalFor, setShowStartCycleModalFor] = useState<string | null>(null)
    const [showCloseCycleModalFor, setShowCloseCycleModalFor] = useState<{ billonId: string; activeCycle: any } | null>(null)
    const [showCycleHistoryFor, setShowCycleHistoryFor] = useState<{ billonId: string; billonName: string } | null>(null)
    const [showAddActivityFor, setShowAddActivityFor] = useState<string | null>(null)

    // Filters state
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // SECURITY: Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    console.warn('Unauthorized access attempt to /admin')
                    navigate('/')
                    return
                }

                // Check profile role from profiles table (source of truth)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                const role = profile?.role || user.user_metadata?.role

                if (role !== 'admin') {
                    console.warn('Unauthorized access attempt to /admin')
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
            fetchBillons()
        }
    }, [authChecking])

    async function fetchData() {
        setLoading(true)
        try {
            // Fetch Plots
            const { data: plotData, error: plotError } = await supabase
                .from('plots')
                .select('*')
                .order('name')

            if (plotError) throw plotError

            const plots = plotData || []
            setPlots(plots)
            await cachePlots(plots) // Save to IndexedDB

            // Fetch Ops this month
            const firstDayOfMonth = new Date()
            firstDayOfMonth.setDate(1)
            firstDayOfMonth.setHours(0, 0, 0, 0)

            const { count: monthCount } = await supabase
                .from('operations')
                .select('*', { count: 'exact', head: true })
                .gte('date', firstDayOfMonth.toISOString())

            // Fetch Irrigation last 7 days
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { count: irrigationCount } = await supabase
                .from('operations')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'irrigation')
                .gte('date', sevenDaysAgo.toISOString())

            setStats({
                totalPlots: plots.length,
                opsThisMonth: monthCount || 0,
                irrigation7d: irrigationCount || 0
            })

        } catch (error) {
            console.error('Error fetching dashboard data, trying cache:', error)
            const cachedPlots = await getCachedPlots()
            if (cachedPlots.length > 0) {
                setPlots(cachedPlots)
                setStats(prev => ({ ...prev, totalPlots: cachedPlots.length }))
            }
        } finally {
            setLoading(false)
        }
    }


    async function fetchBillons() {
        try {
            const { data, error } = await supabase
                .from('billons')
                .select('*')
                .order('name')

            if (error) throw error
            setBillons(data || [])

            // Fetch active cycles for billons that have one
            const billonIdsWithCycles = (data || []).filter(b => b.active_cycle_id).map(b => b.active_cycle_id)
            if (billonIdsWithCycles.length > 0) {
                const { data: cycles } = await supabase
                    .from('billon_cycles')
                    .select('*')
                    .in('id', billonIdsWithCycles)
                const cycleMap: Record<string, any> = {}
                for (const c of cycles || []) {
                    cycleMap[c.billon_id] = c
                }
                setActiveCycles(cycleMap)
            } else {
                setActiveCycles({})
            }
        } catch (error) {
            console.error('Error fetching billons:', error)
        } finally {
            setBillonsLoading(false)
        }
    }

    const handleDeleteBillon = async (billonId: string, billonName: string) => {
        if (!confirm(`${t('common.confirm_delete')}\n\n${billonName}`)) return
        try {
            await supabase.from('billon_activities').delete().eq('billon_id', billonId)
            await supabase.from('billons').delete().eq('id', billonId)
            setBillons(prev => prev.filter(b => b.id !== billonId))
        } catch (error) {
            console.error('Error deleting billon:', error)
            alert(t('common.error'))
        }
    }

    const handleDeletePlot = async (plotId: string, plotName: string) => {
        if (!confirm(`${t('common.confirm_delete')}\n\n${plotName}`)) return

        try {
            // Delete related records first to avoid FK errors (if cascades not set)
            await supabase.from('operations').delete().eq('plot_id', plotId)
            await supabase.from('disease_logs').delete().eq('plot_id', plotId)
            await supabase.from('yield_records').delete().eq('plot_id', plotId)
            await supabase.from('plot_photos').delete().eq('plot_id', plotId)

            const { error } = await supabase
                .from('plots')
                .delete()
                .eq('id', plotId)

            if (error) throw error

            setPlots(prev => prev.filter(p => p.id !== plotId))
        } catch (error) {
            console.error('Error deleting plot:', error)
            alert(t('common.error'))
        }
    }

    const filteredPlots = useMemo(() => {
        return plots.filter(plot => {
            const matchesSearch = plot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plot.id.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || plot.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [plots, searchQuery, statusFilter])

    const clearFilters = () => {
        setSearchQuery('')
        setStatusFilter('all')
    }

    // Skeleton Components
    const StatSkeleton = () => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-gray-700 flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
            <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-6 w-8 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
        </div>
    )

    const TableRowSkeleton = () => (
        <tr className="animate-pulse">
            <td className="px-8 py-6"><div className="h-4 w-32 bg-gray-50 dark:bg-gray-700 rounded mb-2" /><div className="h-2 w-16 bg-gray-50 dark:bg-gray-700 rounded" /></td>
            <td className="px-8 py-6"><div className="h-4 w-24 bg-gray-50 dark:bg-gray-700 rounded" /></td>
            <td className="px-8 py-6"><div className="h-4 w-12 bg-gray-50 dark:bg-gray-700 rounded" /></td>
            <td className="px-8 py-6"><div className="h-4 w-16 bg-gray-50 dark:bg-gray-700 rounded-full" /></td>
            <td className="px-8 py-6"><div className="flex justify-center gap-2"><div className="h-10 w-10 bg-gray-50 dark:bg-gray-700 rounded-xl" /><div className="h-10 w-10 bg-gray-50 dark:bg-gray-700 rounded-xl" /></div></td>
        </tr>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans"
        >
            {/* Enhanced Sticky Header */}
            <header className="glass sticky top-0 z-30 border-b border-white/20 dark:border-gray-800 shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-3 sm:h-20 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                            <LayoutDashboard className="h-5 w-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                                {t('common.dashboard')}
                            </h1>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate hidden xs:block">{t('dashboard.subtitle')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        <Link
                            to="/admin/analytics"
                            className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 bg-gradient-secondary text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm shadow-md"
                            title={t('common.analytics')}
                        >
                            <BarChart3 className="h-5 w-5 sm:h-4 sm:w-4" />
                            <span className="hidden md:inline ml-2">{t('common.analytics')}</span>
                        </Link>
                        <Link
                            to="/admin/tasks"
                            className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all font-bold text-sm shadow-md"
                            title={t('tasks.title')}
                        >
                            <ClipboardList className="h-5 w-5 sm:h-4 sm:w-4" />
                            <span className="hidden md:inline ml-2">{t('tasks.title')}</span>
                        </Link>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-primary hidden xs:flex items-center justify-center text-white shadow-md shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <Link
                                to="/admin/settings"
                                className="p-2 sm:p-2.5 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-gray-400 hover:text-blue-600 transition-all"
                                title="Settings"
                            >
                                <SettingsIcon className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Enhanced Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
                    {loading ? (
                        <>
                            <StatSkeleton />
                            <StatSkeleton />
                            <StatSkeleton />
                        </>
                    ) : (
                        <>
                            {/* Total Plots */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md hover:shadow-2xl border border-gray-50 dark:border-gray-700 flex items-center gap-4 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                    <Grid className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider mb-1">{t('dashboard.total_plots')}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalPlots}</p>
                                </div>
                            </motion.div>

                            {/* Ops Monthly */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md hover:shadow-2xl border border-gray-50 dark:border-gray-700 flex items-center gap-4 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                    <TrendingUp className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider mb-1">{t('dashboard.ops_this_month')}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.opsThisMonth}</p>
                                </div>
                            </motion.div>

                            {/* Irrigation 7d */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md hover:shadow-2xl border border-gray-50 dark:border-gray-700 flex items-center gap-4 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                    <Droplets className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">{t('dashboard.irrigation_7d')}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.irrigation7d}</p>
                                </div>
                            </motion.div>

                            {/* Billon Count */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md hover:shadow-2xl border border-gray-50 dark:border-gray-700 flex items-center gap-4 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                    <Activity className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider mb-1">{t('billons.title')}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{billons.length}</p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-4 mb-8">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-black flex items-center gap-2 shrink-0 dark:text-white">
                            <div className="w-2 h-8 bg-green-600 rounded-full" />
                            {t('dashboard.all_plots')}
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-green-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 dark:shadow-none font-bold text-sm active:scale-95 group w-full sm:w-auto justify-center"
                            onClick={() => setShowAddPlotModal(true)}
                        >
                            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                            {t('dashboard.add_plot')}
                        </motion.button>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('dashboard.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm min-h-[44px]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:flex-none">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 dark:text-white rounded-2xl py-3 pl-11 pr-8 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm min-h-[44px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer w-full sm:w-auto"
                                >
                                    <option value="all">{t('dashboard.filter_all')}</option>
                                    <option value="active">{t('dashboard.active')}</option>
                                    <option value="harvested">{t('dashboard.harvested')}</option>
                                </select>
                            </div>
                            {(searchQuery || statusFilter !== 'all') && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={clearFilters}
                                    className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title={t('dashboard.clear_filters')}
                                >
                                    <X className="h-4 w-4" />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB] dark:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.plot_name')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.crop_variety')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.area')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('dashboard.active')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                </tbody>
                            </table>
                        </div>
                        <div className="md:hidden p-4 space-y-4">
                            <div className="h-40 bg-gray-50 dark:bg-gray-700 rounded-2xl animate-pulse" />
                            <div className="h-40 bg-gray-50 dark:bg-gray-700 rounded-2xl animate-pulse" />
                        </div>
                    </div>
                ) : filteredPlots.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB] dark:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.plot_name')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.crop_variety')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.area')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('dashboard.active')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {filteredPlots.map(plot => (
                                        <tr key={plot.id} className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="font-black text-gray-900 dark:text-white text-lg group-hover:text-green-700 transition-colors uppercase tracking-tight">{plot.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">#{plot.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{plot.crop_variety}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{plot.area} <span className="text-[10px] text-gray-400 uppercase">m²</span></span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${plot.status === 'active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}>
                                                    {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setSelectedPlotForLog(plot.id)}
                                                        className="p-3 min-h-[44px] min-w-[44px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                        title={t('dashboard.log_operation')}
                                                    >
                                                        <ClipboardList className="h-5 w-5" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setSelectedPlotForQR(plot.id)}
                                                        className="p-3 min-h-[44px] min-w-[44px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                        title={t('dashboard.qr_code')}
                                                    >
                                                        <QrCode className="h-5 w-5" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDeletePlot(plot.id, plot.name)}
                                                        className="p-3 min-h-[44px] min-w-[44px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List View */}
                        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {filteredPlots.map(plot => (
                                <div key={plot.id} className="p-6 space-y-5 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight">{plot.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{plot.crop_variety}</span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${plot.status === 'active'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                            {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('add_plot.area')}</span>
                                            <span className="font-black text-gray-900 dark:text-white">{plot.area} <span className="text-[10px] font-normal lowercase">m²</span></span>
                                        </div>
                                        {plot.plant_count && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('add_plot.plant_count')}</span>
                                                <span className="font-black text-gray-900 dark:text-white">{plot.plant_count}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedPlotForLog(plot.id)}
                                            className="flex items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-4 rounded-2xl font-black text-xs active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors shadow-sm min-h-[44px]"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            {t('dashboard.log_operation')}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedPlotForQR(plot.id)}
                                            className="flex items-center justify-center gap-3 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 py-4 rounded-2xl font-black text-xs active:bg-purple-100 dark:active:bg-purple-900/50 transition-colors shadow-sm min-h-[44px]"
                                        >
                                            <QrCode className="h-4 w-4" />
                                            {t('dashboard.qr_code')}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleDeletePlot(plot.id, plot.name)}
                                            className="flex items-center justify-center gap-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-4 rounded-2xl font-black text-xs active:bg-red-100 dark:active:bg-red-900/50 transition-colors shadow-sm min-h-[44px] col-span-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {t('common.delete')}
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12 md:p-20 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-[2rem] flex items-center justify-center text-green-600/30 mb-8 transform -rotate-12 transition-transform hover:rotate-0">
                            <Leaf className="h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                            {plots.length === 0 ? t('dashboard.no_plots') : t('dashboard.no_results')}
                        </h3>
                        <p className="max-w-md text-gray-400 dark:text-gray-500 text-lg mb-10 font-bold">
                            {plots.length === 0 ? t('dashboard.no_plots_desc') : t('dashboard.no_results_desc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            {plots.length === 0 ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAddPlotModal(true)}
                                    className="bg-green-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg font-bold min-h-[44px]"
                                >
                                    <Plus className="h-5 w-5" />
                                    {t('dashboard.add_plot')}
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={clearFilters}
                                    className="bg-gray-900 dark:bg-gray-700 text-white px-10 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-gray-600 transition-all shadow-xl font-bold min-h-[44px]"
                                >
                                    <X className="h-5 w-5" />
                                    {t('dashboard.reset_btn')}
                                </motion.button>
                            )}
                        </div>
                    </div>
                )}

                {/* Billons Section */}
                <section className="mt-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <Layers className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">{t('billons.title')}</h2>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group bg-amber-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-amber-700 transition-all shadow-xl font-bold text-sm active:scale-95 w-full sm:w-auto justify-center"
                            onClick={() => setShowAddBillonModal(true)}
                        >
                            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                            {t('billons.add_new')}
                        </motion.button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow">
                        {billonsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : billons.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers className="h-8 w-8 text-amber-300 dark:text-amber-600" />
                                </div>
                                <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px]">{t('billons.no_billons')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {billons.map(billon => {
                                    const activeCycle = activeCycles[billon.id]
                                    // 3. Setup status pill style & localization
                                    let statusText = t('billons.statuses.harvested', 'Récolté');
                                    let statusClass = 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';

                                    switch (billon.status) {
                                        case 'active':
                                            statusText = t('billons.statuses.active', 'Actif');
                                            statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
                                            break;
                                        case 'fallow':
                                            statusText = t('billons.statuses.fallow', 'Jachère');
                                            statusClass = 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
                                            break;
                                        case 'harvested':
                                            statusText = t('billons.statuses.harvested', 'Récolté');
                                            statusClass = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
                                            break;
                                        case 'empty':
                                            statusText = t('billons.statuses.empty', 'Vide');
                                            statusClass = 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50';
                                            break;
                                        case 'planted':
                                            statusText = t('billons.statuses.planted', 'Ensemencé');
                                            statusClass = 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30';
                                            break;
                                        case 'resting':
                                            statusText = t('billons.statuses.resting', 'En Repos');
                                            statusClass = 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
                                            break;
                                    }

                                    return (
                                    <motion.div
                                        key={billon.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-gray-900/50 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800/80 hover:shadow-2xl hover:border-amber-300/40 dark:hover:border-amber-600/30 transition-all duration-300 group flex flex-col relative"
                                    >
                                        {/* Administrative hovering utilities gear */}
                                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setEditingBillon(billon)}
                                                title={t('common.edit')}
                                                className="p-1 text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <SettingsIcon className="h-3.5 w-3.5" />
                                            </motion.button>
                                            <div className="h-3 w-px bg-gray-200 dark:bg-gray-700" />
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDeleteBillon(billon.id, billon.name)}
                                                title={t('common.delete')}
                                                className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </motion.button>
                                        </div>

                                        {billon.image_url ? (
                                            <div className="h-36 overflow-hidden relative">
                                                <img src={billon.image_url} alt={billon.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            </div>
                                        ) : (
                                            <div className="h-8 bg-gradient-to-r from-amber-500/5 to-amber-600/10 dark:from-amber-500/2 dark:to-amber-600/5" />
                                        )}

                                        <div className="p-5 flex-1 flex flex-col justify-between">
                                            <div>
                                                {/* Header information */}
                                                <div className="mb-3">
                                                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                                                        <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight truncate max-w-[70%]">{billon.name}</h3>
                                                        {billon.billon_code && (
                                                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[8px] font-black tracking-wider uppercase border border-gray-200/40 dark:border-gray-700">
                                                                #{billon.billon_code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${statusClass}`}>
                                                        {statusText}
                                                    </span>
                                                </div>

                                                {billon.description && (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold line-clamp-2 mb-3.5 leading-relaxed">{billon.description}</p>
                                                )}

                                                {activeCycle ? (
                                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-3.5 mb-4 space-y-2 border border-emerald-100 dark:border-emerald-900/30">
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('billons.cycle_n', { n: activeCycle.cycle_number })}</span>
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider">{t('dashboard.active')}</span>
                                                            </div>
                                                        </div>
                                                        {(activeCycle.target_crop || activeCycle.crop_variety) && (
                                                            <div className="text-xs font-black text-gray-800 dark:text-gray-200 space-y-1.5 pt-1">
                                                                {activeCycle.target_crop && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Wheat className="h-3.5 w-3.5 text-emerald-500" />
                                                                        <span>{activeCycle.target_crop}</span>
                                                                    </div>
                                                                )}
                                                                {activeCycle.crop_variety && (
                                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold pl-5 text-[11px]">
                                                                        <Leaf className="h-3 w-3 text-emerald-400/80" />
                                                                        <span>{activeCycle.crop_variety}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50 dark:bg-gray-800/10 rounded-2xl p-3 mb-4 text-center border border-gray-100/50 dark:border-gray-800/30">
                                                        <p className="text-[8.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('billons.no_active_cycle')}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 4. Action Buttons & Operations Workflow */}
                                            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-800/50 mt-auto">
                                                {/* Field Operations Row: Add Activity & View History */}
                                                <div className="flex items-center gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowAddActivityFor(billon.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50/50 hover:bg-blue-600 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-wider border border-blue-100/30 dark:border-blue-900/20"
                                                    >
                                                        <Activity className="h-3 w-3" />
                                                        {t('billons.add_activity', 'Activité')}
                                                    </motion.button>
                                                    
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowCycleHistoryFor({ billonId: billon.id, billonName: billon.name })}
                                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-50/50 hover:bg-purple-600 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-wider border border-purple-100/30 dark:border-purple-900/20"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {t('billons.cycle_history')}
                                                    </motion.button>
                                                </div>

                                                {/* Public Page View Button */}
                                                <motion.a
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    href={`/billon/${billon.id}`}
                                                    target="_blank"
                                                    className="flex items-center justify-center gap-1.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-all text-[8.5px] font-black uppercase tracking-widest border border-gray-200/50 dark:border-gray-700/50"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    {t('billons.billon', 'Billon public')}
                                                </motion.a>

                                                {/* Primary Sowing Cycle Operations: Start / Close Cycle */}
                                                <div className="mt-1">
                                                    {activeCycle ? (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setShowCloseCycleModalFor({ billonId: billon.id, activeCycle })}
                                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest shadow-md shadow-orange-500/10"
                                                        >
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {t('billons.close_cycle')}
                                                        </motion.button>
                                                    ) : (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setShowStartCycleModalFor(billon.id)}
                                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest shadow-md shadow-emerald-600/10"
                                                        >
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {t('billons.start_cycle')}
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Footer space */}
            <footer className="py-20 text-center text-gray-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                &copy; ISIAOM Agricultural Management v2.5
            </footer>

            {/* Modals */}
            <AnimatePresence>
                {selectedPlotForLog && (
                    <QuickLogModal
                        plotId={selectedPlotForLog}
                        onClose={() => setSelectedPlotForLog(null)}
                    />
                )}

                {selectedPlotForQR && (
                    <QRCodeGenerator
                        plotId={selectedPlotForQR}
                        onClose={() => setSelectedPlotForQR(null)}
                    />
                )}
                {showAddPlotModal && (
                    <AddPlotModal
                        onClose={() => setShowAddPlotModal(false)}
                        onPlotAdded={() => {
                            fetchData()
                        }}
                    />
                )}
                {showAddBillonModal && (
                    <AddBillonModal
                        onClose={() => setShowAddBillonModal(false)}
                        onAdded={() => { fetchBillons() }}
                    />
                )}
                {editingBillon && (
                    <EditBillonModal
                        billon={editingBillon}
                        onClose={() => setEditingBillon(null)}
                        onUpdated={() => { fetchBillons(); setEditingBillon(null) }}
                    />
                )}
                {showStartCycleModalFor && (
                    <StartCycleModal
                        billonId={showStartCycleModalFor}
                        onClose={() => setShowStartCycleModalFor(null)}
                        onStarted={() => { fetchBillons(); setShowStartCycleModalFor(null) }}
                    />
                )}
                {showCloseCycleModalFor && (
                    <CloseCycleModal
                        billonId={showCloseCycleModalFor.billonId}
                        activeCycle={showCloseCycleModalFor.activeCycle}
                        onClose={() => setShowCloseCycleModalFor(null)}
                        onClosed={() => { fetchBillons(); setShowCloseCycleModalFor(null) }}
                    />
                )}
                {showCycleHistoryFor && (
                    <BillonCycleHistory
                        billonId={showCycleHistoryFor.billonId}
                        billonName={showCycleHistoryFor.billonName}
                        onClose={() => setShowCycleHistoryFor(null)}
                    />
                )}
                {showAddActivityFor && (
                    <AddBillonActivityModal
                        billonId={showAddActivityFor}
                        onClose={() => setShowAddActivityFor(null)}
                        onAdded={() => { fetchBillons() }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}
