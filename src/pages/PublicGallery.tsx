import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SortAsc, Calendar, Clock, ChevronRight, LayoutGrid, Leaf, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getCachedPlots } from '@/lib/db'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface PlotExtraStats {
    lastOpDate: string | null
    opsThisMonth: number
}

export default function PublicGallery() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [plots, setPlots] = useState<any[]>([])
    const [extraStats, setExtraStats] = useState<Record<string, PlotExtraStats>>({})
    const [loading, setLoading] = useState(true)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [cropFilter, setCropFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('name')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: plotData, error: plotError } = await supabase
                .from('plots')
                .select('*')
                .order('name')

            if (plotError) throw plotError
            const plotsList = plotData || []
            setPlots(plotsList)

            const firstDayOfMonth = new Date()
            firstDayOfMonth.setDate(1)
            firstDayOfMonth.setHours(0, 0, 0, 0)

            const { data: opsData } = await supabase
                .from('operations')
                .select('plot_id, date')
                .order('date', { ascending: false })

            if (opsData) {
                const stats: Record<string, PlotExtraStats> = {}
                opsData.forEach(op => {
                    if (!stats[op.plot_id]) {
                        stats[op.plot_id] = { lastOpDate: op.date, opsThisMonth: 0 }
                    }
                    if (new Date(op.date) >= firstDayOfMonth) {
                        stats[op.plot_id].opsThisMonth++
                    }
                })
                setExtraStats(stats)
            }
        } catch (error) {
            console.error('Error fetching gallery data:', error)
            const cachedPlots = await getCachedPlots()
            if (cachedPlots.length > 0) {
                setPlots(cachedPlots)
            }
        } finally {
            setLoading(false)
        }
    }

    const filteredPlots = useMemo(() => {
        return plots
            .filter(plot => {
                const matchesSearch = plot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    plot.id.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesCrop = cropFilter === 'all' || plot.crop_variety.toLowerCase().includes(cropFilter.toLowerCase())
                const matchesStatus = statusFilter === 'all' || plot.status === statusFilter
                return matchesSearch && matchesCrop && matchesStatus
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name)
                if (sortBy === 'area') return (b.area || 0) - (a.area || 0)
                if (sortBy === 'date') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                return 0
            })
    }, [plots, searchQuery, cropFilter, statusFilter, sortBy])

    const cropTypes = useMemo(() => {
        const types = new Set(plots.map(p => p.crop_variety.split('-')[0].trim()))
        return Array.from(types)
    }, [plots])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-950"
        >
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 h-16">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-black shadow-lg">
                                <Leaf className="h-5 w-5" />
                            </div>
                            <span className="font-black text-xs tracking-widest text-gray-900 dark:text-white uppercase">Explorer</span>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>
            </nav>

            {/* Hero Header */}
            <header className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-800/20 dark:from-green-900/20 dark:to-black pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight"
                    >
                        {t('gallery.title')}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-bold uppercase tracking-widest leading-loose"
                    >
                        {t('gallery.subtitle')}
                    </motion.p>

                    {/* Search Bar */}
                    <div className="mt-12 max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t('gallery.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-green-900/5 border border-transparent focus:border-green-500 dark:border-gray-800 outline-none transition-all text-gray-900 dark:text-white font-bold text-lg"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
                {/* Filters */}
                <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-6 bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-5 py-3 rounded-2xl border border-transparent focus-within:border-green-500 transition-all flex-grow sm:flex-grow-0">
                            <Leaf className="h-4 w-4 text-green-500" />
                            <select
                                value={cropFilter}
                                onChange={(e) => setCropFilter(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                            >
                                <option value="all">{t('gallery.filter_crop')}</option>
                                {cropTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-5 py-3 rounded-2xl border border-transparent focus-within:border-green-500 transition-all flex-grow sm:flex-grow-0">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                            >
                                <option value="all">{t('gallery.filter_status')}</option>
                                <option value="active">{t('dashboard.active')}</option>
                                <option value="harvested">{t('dashboard.harvested')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 px-5 py-3 rounded-2xl border border-transparent focus-within:border-green-500 transition-all w-full lg:w-auto overflow-hidden">
                        <SortAsc className="h-4 w-4 text-purple-500 shrink-0" />
                        <span className="text-[10px] font-black text-gray-400 uppercase hidden sm:inline">{t('gallery.sort_by')}</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-gray-800 dark:text-white outline-none cursor-pointer w-full lg:w-auto"
                        >
                            <option value="name">{t('gallery.sort_name')}</option>
                            <option value="area">{t('gallery.sort_area')}</option>
                            <option value="date">{t('gallery.sort_date')}</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-[3rem] aspect-[4/5] animate-pulse shadow-sm border border-gray-100 dark:border-gray-800" />
                        ))}
                    </div>
                ) : filteredPlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredPlots.map((plot) => (
                                <motion.div
                                    key={plot.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -8 }}
                                    className="group bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer flex flex-col transition-all duration-500"
                                    onClick={() => navigate(`/plot/${plot.id}`)}
                                >
                                    <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        {plot.image_url ? (
                                            <img
                                                src={plot.image_url}
                                                alt={plot.name}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 text-green-200 dark:text-gray-700">
                                                <LayoutGrid className="h-16 w-16" />
                                            </div>
                                        )}

                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-500 dark:text-gray-400 shadow-sm border border-white/20 dark:border-gray-700/50 uppercase tracking-widest">
                                                ID: {plot.id}
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${plot.status === 'active'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 dark:bg-gray-700 text-white'
                                                }`}>
                                                {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10 flex flex-col flex-grow">
                                        <div className="mb-6">
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-green-600 transition-colors uppercase tracking-tight">
                                                {plot.name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                                                <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                    <Leaf className="h-4 w-4" />
                                                </div>
                                                {plot.crop_variety}
                                            </div>
                                        </div>

                                        <div className="mt-auto grid grid-cols-2 gap-6 pt-8 border-t border-gray-50 dark:border-gray-800/50">
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('add_plot.area')}</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white">{plot.area}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">m²</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('gallery.ops_month')}</span>
                                                <span className="text-xl font-black text-gray-900 dark:text-white">{extraStats[plot.id]?.opsThisMonth || 0}</span>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {extraStats[plot.id]?.lastOpDate
                                                    ? new Date(extraStats[plot.id]?.lastOpDate!).toLocaleDateString('fr-FR')
                                                    : '---'}
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-green-500 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="p-32 text-center bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800 shadow-2xl shadow-green-900/5">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-200 dark:text-gray-700">
                            <Search className="h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{t('gallery.no_plots')}</h3>
                        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">{t('dashboard.no_results_desc')}</p>
                    </div>
                )}
            </main>

            <footer className="py-24 text-center">
                <div className="text-[10px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-[0.5em] mb-6">
                    ISIAOM Model Farm Tracking
                </div>
                <div className="w-12 h-1 bg-gray-100 dark:bg-gray-800 mx-auto rounded-full" />
            </footer>
        </motion.div>
    )
}

