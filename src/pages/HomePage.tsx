import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Sprout, MapPin, LayoutDashboard, Leaf, ArrowRight } from 'lucide-react'
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 gap-6">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-gray-100 dark:border-gray-800 border-t-green-500 rounded-full"
            />
            <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">{t('common.loading')}</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-950"
        >
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 h-20">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                            <Leaf className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="block font-black text-sm tracking-tight text-gray-900 dark:text-white uppercase leading-none">ISIAOM</span>
                            <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Model Farm</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>
                        {isAdmin ? (
                            <Link
                                to="/admin"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                {t('common.dashboard')}
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                            >
                                {t('login.submit')}
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-40 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 dark:from-green-950/20 dark:to-transparent pointer-events-none" />
                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter leading-none">
                            Système de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Suivi Digital</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-2xl font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
                            {t('common.model_farm')} & Gestion de Parcelles
                        </p>

                        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                            <Link to="/gallery" className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-500/20 transition-all flex items-center gap-3 group">
                                {t('gallery.title')}
                                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-20">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Nos Parcelles</h2>
                        <div className="h-1 w-20 bg-green-500 mt-2 rounded-full" />
                    </div>
                </div>

                {plots.length === 0 ? (
                    <div className="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <Sprout className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{t('public_plot.no_operations')}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plots.map((plot, index) => (
                            <motion.div
                                key={plot.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group bg-white dark:bg-gray-900 rounded-[3rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xl shadow-green-900/5 transition-all duration-500"
                            >
                                <Link to={`/plot/${plot.id}`} className="block">
                                    <div className="h-64 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                        {plot.image_url ? (
                                            <img
                                                src={plot.image_url}
                                                alt={plot.name}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
                                                <Sprout className="h-16 w-16 text-green-200 dark:text-gray-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-6 left-6">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md ${plot.status === 'active'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-orange-500 text-white'
                                                }`}>
                                                {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-10">
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter group-hover:text-green-600 transition-colors">
                                            {plot.name}
                                        </h3>

                                        <div className="flex flex-wrap gap-3 mb-8">
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent group-hover:border-green-500/20 transition-all">
                                                <Leaf className="h-4 w-4 text-green-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">{plot.crop_variety}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent group-hover:border-blue-500/20 transition-all">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">{plot.area} m²</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-800/50">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanner QR Dispo</span>
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                                                <ArrowRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                            <Leaf className="h-6 w-6" />
                        </div>
                        <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white uppercase leading-none">ISIAOM</span>
                    </div>

                    <div className="flex gap-8 mb-10">
                        {['Accueil', 'Galerie', 'Admin', 'Contact'].map(item => (
                            <span key={item} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-green-500 cursor-pointer transition-colors">{item}</span>
                        ))}
                    </div>

                    <div className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.5em]">
                        &copy; 2026 Model Farm Tracking System
                    </div>
                </div>
            </footer>
        </motion.div>
    )
}
