import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Sprout, MapPin, LayoutDashboard, Leaf, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { motion } from 'framer-motion'

export default function HomePage() {
    const { t } = useTranslation()
    const [plots, setPlots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        checkAuth()
        fetchPlots()
    }, [])

    async function checkAuth() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setIsAdmin(user?.user_metadata?.role === 'admin')
        } catch (error) {
            setIsAdmin(false)
        }
    }

    async function fetchPlots() {
        try {
            const { data, error } = await supabase
                .from('plots')
                .select('*')
                .order('name')

            if (error) throw error
            setPlots(data || [])
        } catch (error) {
            console.error('Error fetching plots:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 gap-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full"
            />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-blue-50/30"
        >
            {/* Enhanced Header */}
            <header className="glass sticky top-0 z-20 border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                            <Leaf className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ISIAOM Farm</h1>
                            <p className="text-xs text-gray-500 font-medium">مزرعة نموذجية</p>
                        </div>
                    </motion.div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/gallery"
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-green-700 bg-green-50/80 hover:bg-green-100 rounded-xl transition-all border border-green-200/50 hover-lift"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            {t('gallery.title')}
                        </Link>
                        <LanguageSwitcher />
                        {isAdmin ? (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/admin"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-primary rounded-xl transition-all shadow-md hover:shadow-xl"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('common.dashboard')}</span>
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-primary rounded-xl transition-all shadow-md hover:shadow-xl"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden sm:inline">تسجيل الدخول</span>
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {plots.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-xl"
                    >
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sprout className="h-10 w-10 text-green-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">{t('public_plot.no_operations')}</h3>
                        <p className="text-gray-500 text-sm">لا توجد قطع مسجلة حالياً</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plots.map((plot, index) => (
                            <motion.div
                                key={plot.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group"
                            >
                                <Link
                                    to={`/plot/${plot.id}`}
                                    className="block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500"
                                >
                                    <div className="h-56 bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
                                        {plot.image_url ? (
                                            <img
                                                src={plot.image_url}
                                                alt={plot.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                                                <Sprout className="h-20 w-20 text-green-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${plot.status === 'active'
                                                ? 'bg-emerald-500/90 text-white'
                                                : plot.status === 'harvested'
                                                    ? 'bg-orange-500/90 text-white'
                                                    : 'bg-gray-500/90 text-white'
                                                }`}>
                                                {plot.status === 'active'
                                                    ? t('dashboard.active')
                                                    : plot.status === 'harvested'
                                                        ? t('dashboard.harvested')
                                                        : plot.status}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                                            {plot.name}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
                                                <Sprout className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm font-bold text-gray-700 truncate">{plot.crop_variety}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl">
                                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                <span className="text-sm font-bold text-gray-700">{plot.area} {t('public_plot.area_unit', { defaultValue: 'm²' })}</span>
                                            </div>
                                        </div>
                                        {plot.training_method && (
                                            <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl text-xs font-black text-purple-700 border border-purple-100">
                                                {t(`add_plot.methods.${plot.training_method}`)}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </motion.div>
    )
}
