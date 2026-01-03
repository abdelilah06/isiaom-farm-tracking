import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, QrCode, ClipboardList, TrendingUp, Droplets, Grid, LogOut, User, Search, Filter, X, Leaf, BarChart3 } from 'lucide-react'
import QuickLogModal from '@/components/QuickLogModal'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import AddPlotModal from '@/components/AddPlotModal'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cachePlots, getCachedPlots } from '@/lib/db'

export default function AdminDashboard() {
    const { t, i18n } = useTranslation()
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

    // Filters state
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const isRtl = i18n.language === 'ar'

    // SECURITY: Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user || user.user_metadata?.role !== 'admin') {
                    console.warn('Unauthorized access attempt to /admin')
                    window.location.href = '/'
                    return
                }

                setAuthChecking(false)
            } catch (error) {
                console.error('Auth check failed:', error)
                window.location.href = '/'
            }
        }

        checkAuth()
    }, [])

    useEffect(() => {
        if (!authChecking) {
            fetchData()
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

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-100 rounded-xl" />
            <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-6 w-8 bg-gray-100 rounded" />
            </div>
        </div>
    )

    const TableRowSkeleton = () => (
        <tr className="animate-pulse">
            <td className="px-8 py-6"><div className="h-4 w-32 bg-gray-50 rounded mb-2" /><div className="h-2 w-16 bg-gray-50 rounded" /></td>
            <td className="px-8 py-6"><div className="h-4 w-24 bg-gray-50 rounded" /></td>
            <td className="px-8 py-6"><div className="h-4 w-12 bg-gray-50 rounded" /></td>
            <td className="px-8 py-6"><div className="h-4 w-16 bg-gray-50 rounded-full" /></td>
            <td className="px-8 py-6"><div className="flex justify-center gap-2"><div className="h-10 w-10 bg-gray-50 rounded-xl" /><div className="h-10 w-10 bg-gray-50 rounded-xl" /></div></td>
        </tr>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen bg-gray-50 font-sans"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {t('common.dashboard')}
                        </h1>
                        <p className="text-[10px] md:text-xs text-gray-500 font-medium">{t('dashboard.subtitle')}</p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <Link
                            to="/admin/analytics"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-green-50 hover:text-green-700 transition-all font-bold text-sm border border-gray-100"
                        >
                            <BarChart3 className="h-4 w-4" />
                            {t('common.analytics')}
                        </Link>
                        <LanguageSwitcher />
                        <div className="h-8 w-px bg-gray-100 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <User className="h-4 w-4" />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout}
                                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                                whileHover={{ scale: 1.02 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 transition-transform"
                            >
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                                    <Grid className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('dashboard.total_plots')}</p>
                                    <p className="text-2xl font-black">{stats.totalPlots}</p>
                                </div>
                            </motion.div>

                            {/* Ops Monthly */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 transition-transform"
                            >
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('dashboard.ops_this_month')}</p>
                                    <p className="text-2xl font-black">{stats.opsThisMonth}</p>
                                </div>
                            </motion.div>

                            {/* Irrigation 7d */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform"
                            >
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <Droplets className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('dashboard.irrigation_7d')}</p>
                                    <p className="text-2xl font-black">{stats.irrigation7d}</p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                    <h2 className="text-xl font-black flex items-center gap-2 shrink-0">
                        <div className="w-2 h-8 bg-green-600 rounded-full" />
                        {t('dashboard.title')}
                    </h2>

                    {/* Filters Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl">
                        <div className="relative w-full">
                            <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                            <input
                                type="text"
                                placeholder={t('dashboard.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm min-h-[44px]`}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative shrink-0 w-full sm:w-auto">
                                <Filter className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none`} />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={`appearance-none bg-white border border-gray-100 rounded-2xl py-3 ${isRtl ? 'pr-11 pl-8' : 'pl-11 pr-8'} text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm min-h-[44px] font-bold text-gray-600 cursor-pointer w-full`}
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
                                    className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title={t('dashboard.clear_filters')}
                                >
                                    <X className="h-4 w-4" />
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-green-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 font-bold text-sm active:scale-95 group shrink-0 min-h-[44px]"
                                onClick={() => setShowAddPlotModal(true)}
                            >
                                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                                <span className="hidden sm:inline">{t('dashboard.add_plot')}</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="hidden md:block">
                            <table className="w-full text-right" dir={isRtl ? 'rtl' : 'ltr'}>
                                <thead className="bg-[#F9FAFB] border-b border-gray-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.plot_name')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.crop_variety')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.area')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('dashboard.active')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">{t('common.dashboard')}</th>
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
                            <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
                            <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
                        </div>
                    </div>
                ) : filteredPlots.length > 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-right" dir={isRtl ? 'rtl' : 'ltr'}>
                                <thead className="bg-[#F9FAFB] border-b border-gray-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.plot_name')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.crop_variety')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('add_plot.area')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('dashboard.active')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">{t('common.dashboard')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredPlots.map(plot => (
                                        <tr key={plot.id} className="hover:bg-green-50/30 transition-colors group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="font-black text-gray-900 text-lg group-hover:text-green-700 transition-colors uppercase tracking-tight">{plot.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">#{plot.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                                    <span className="text-sm font-bold text-gray-600">{plot.crop_variety}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-black text-gray-900">{plot.area} <span className="text-[10px] text-gray-400 uppercase">m²</span></span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${plot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
                                                        className="p-3 min-h-[44px] min-w-[44px] bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100 flex items-center justify-center"
                                                        title={t('dashboard.log_operation')}
                                                    >
                                                        <ClipboardList className="h-5 w-5" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setSelectedPlotForQR(plot.id)}
                                                        className="p-3 min-h-[44px] min-w-[44px] bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm shadow-purple-100 flex items-center justify-center"
                                                        title={t('dashboard.qr_code')}
                                                    >
                                                        <QrCode className="h-5 w-5" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List View */}
                        <div className="md:hidden divide-y divide-gray-50 bg-white">
                            {filteredPlots.map(plot => (
                                <div key={plot.id} className="p-6 space-y-5 active:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">{plot.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                                <span className="text-sm font-bold text-gray-500">{plot.crop_variety}</span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${plot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('add_plot.area')}</span>
                                            <span className="font-black text-gray-900">{plot.area} <span className="text-[10px] font-normal lowercase">m²</span></span>
                                        </div>
                                        {plot.plant_count && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('add_plot.plant_count')}</span>
                                                <span className="font-black text-gray-900">{plot.plant_count}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedPlotForLog(plot.id)}
                                            className="flex items-center justify-center gap-3 bg-blue-50 text-blue-700 py-4 rounded-2xl font-black text-xs active:bg-blue-100 transition-colors shadow-sm shadow-blue-50 min-h-[44px]"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            {t('dashboard.log_operation')}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedPlotForQR(plot.id)}
                                            className="flex items-center justify-center gap-3 bg-purple-50 text-purple-700 py-4 rounded-2xl font-black text-xs active:bg-purple-100 transition-colors shadow-sm shadow-purple-50 min-h-[44px]"
                                        >
                                            <QrCode className="h-4 w-4" />
                                            {t('dashboard.qr_code')}
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl shadow-green-900/5 p-12 md:p-20 border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-600/30 mb-8 transform -rotate-12 transition-transform hover:rotate-0">
                            <Leaf className="h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                            {plots.length === 0 ? t('dashboard.no_plots') : t('dashboard.no_results')}
                        </h3>
                        <p className="max-w-md text-gray-400 text-lg mb-10 font-bold">
                            {plots.length === 0 ? t('dashboard.no_plots_desc') : t('dashboard.no_results_desc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            {plots.length === 0 ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAddPlotModal(true)}
                                    className="bg-green-600 text-white p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100 font-bold min-h-[44px] min-w-[44px]"
                                >
                                    <Plus className="h-5 w-5" />
                                    <span className="hidden sm:inline">{t('dashboard.add_plot')}</span>
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={clearFilters}
                                    className="bg-gray-900 text-white px-10 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-100 font-bold min-h-[44px]"
                                >
                                    <X className="h-5 w-5" />
                                    {t('dashboard.reset_btn')}
                                </motion.button>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer space */}
            <footer className="py-20 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
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
            </AnimatePresence>
        </motion.div>
    )
}
