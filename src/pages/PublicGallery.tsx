import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SortAsc, MapPin, Calendar, Clock, ChevronRight, LayoutGrid, Leaf, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getCachedPlots } from '@/lib/db'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface PlotExtraStats {
    lastOpDate: string | null
    opsThisMonth: number
}

export default function PublicGallery() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [plots, setPlots] = useState<any[]>([])
    const [extraStats, setExtraStats] = useState<Record<string, PlotExtraStats>>({})
    const [loading, setLoading] = useState(true)
    const isRtl = i18n.language === 'ar'

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
            // Fetch Plots
            const { data: plotData, error: plotError } = await supabase
                .from('plots')
                .select('*')
                .order('name')

            if (plotError) throw plotError
            const plotsList = plotData || []
            setPlots(plotsList)

            // Fetch Extra Stats for each plot (optimized)
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
        const types = new Set(plots.map(p => {
            // Extract core crop type if possible, otherwise use full variety
            return p.crop_variety.split('-')[0].trim()
        }))
        return Array.from(types)
    }, [plots])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#f8f9fa] font-sans"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Hero Header */}
            <header className="relative h-[35vh] md:h-[40vh] min-h-[280px] max-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-800" />
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl w-full">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 font-bold text-sm transition-colors decoration-none">
                        <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                        {t('gallery.back_home')}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        {t('gallery.title')}
                    </h1>
                    <p className="text-green-50 text-lg md:text-xl font-medium opacity-90">
                        {t('gallery.subtitle')}
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 max-w-xl mx-auto relative group">
                        <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors pointer-events-none`} />
                        <input
                            type="text"
                            placeholder={t('gallery.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-white rounded-2xl shadow-xl shadow-green-900/10 border-none focus:ring-2 focus:ring-green-400 outline-none transition-all text-gray-900 font-medium`}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 md:py-12 md:px-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-10 gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex-grow sm:flex-grow-0">
                            <Leaf className="h-4 w-4 text-green-500" />
                            <select
                                value={cropFilter}
                                onChange={(e) => setCropFilter(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none cursor-pointer"
                            >
                                <option value="all">{t('gallery.filter_crop')}</option>
                                {cropTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex-grow sm:flex-grow-0">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none cursor-pointer"
                            >
                                <option value="all">{t('gallery.filter_status')}</option>
                                <option value="active">{t('dashboard.active')}</option>
                                <option value="harvested">{t('dashboard.harvested')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto overflow-hidden">
                        <SortAsc className="h-4 w-4 text-purple-500 shrink-0" />
                        <span className="text-xs font-black text-gray-400 uppercase hidden sm:inline">{t('gallery.sort_by')}:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-black text-gray-800 outline-none cursor-pointer w-full md:w-auto"
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
                            <div key={i} className="bg-white rounded-[2rem] aspect-[4/5] animate-pulse shadow-sm border border-gray-100" />
                        ))}
                    </div>
                ) : filteredPlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredPlots.map((plot) => (
                                <motion.div
                                    key={plot.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="group bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden cursor-pointer flex flex-col transition-all duration-300"
                                    onClick={() => navigate(`/plot/${plot.id}`)}
                                >
                                    {/* Image Section */}
                                    <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                                        {plot.image_url ? (
                                            <img
                                                src={plot.image_url}
                                                alt={plot.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-green-300">
                                                <LayoutGrid className="h-16 w-16" />
                                            </div>
                                        )}

                                        {/* Status & ID */}
                                        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} flex flex-col gap-2`}>
                                            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-gray-500 shadow-sm border border-white/20">
                                                #{plot.id.slice(0, 8)}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${plot.status === 'active'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                                }`}>
                                                {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                                            </div>
                                        </div>

                                        <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'}`}>
                                            <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-gray-600 shadow-sm border border-white/20">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-8 flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <h3 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight">
                                                {plot.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                                <Leaf className="h-4 w-4 text-green-400" />
                                                {plot.crop_variety}
                                            </div>
                                        </div>

                                        <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                                            <div className="space-y-1">
                                                <span className="block text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">{t('add_plot.area')}</span>
                                                <span className="block text-lg font-black text-gray-800">{plot.area} <span className="text-[10px] text-gray-400 font-normal">m²</span></span>
                                            </div>
                                            {plot.plant_count && (
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none whitespace-nowrap">{t('add_plot.plant_count')}</span>
                                                    <span className="block text-lg font-black text-gray-800">{plot.plant_count}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 flex flex-col gap-3">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{t('gallery.last_op')}:</span>
                                                </div>
                                                <span className="text-gray-900">
                                                    {extraStats[plot.id]?.lastOpDate
                                                        ? new Date(extraStats[plot.id]?.lastOpDate!).toLocaleDateString(i18n.language)
                                                        : '---'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <LayoutGrid className="h-3.5 w-3.5" />
                                                    <span>{t('gallery.ops_month')}:</span>
                                                </div>
                                                <span className="text-gray-900">{extraStats[plot.id]?.opsThisMonth || 0}</span>
                                            </div>
                                        </div>

                                        <button className="mt-8 w-full bg-green-50 text-green-700 py-4 rounded-2xl font-black text-sm group-hover:bg-green-600 group-hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm shadow-green-100">
                                            {t('gallery.view_details')}
                                            <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <Search className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-950 mb-2">{t('gallery.no_plots')}</h3>
                        <p className="text-gray-400 font-medium">{t('dashboard.no_results_desc')}</p>
                    </div>
                )}
            </main>

            <footer className="py-20 text-center">
                <div className="mb-8">
                    <LanguageSwitcher />
                </div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                    &copy; ISIAOM Agricultural Management v2.5
                </div>
            </footer>
        </motion.div>
    )
}
