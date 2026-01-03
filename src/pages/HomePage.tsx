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

    useEffect(() => {
        fetchPlots()
    }, [])

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full"
            />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen bg-gray-50"
        >
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700">
                        <Leaf className="h-6 w-6" />
                        <h1 className="text-xl font-bold tracking-tight">ISIAOM Farm</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/gallery"
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-100"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            {t('gallery.title')}
                        </Link>
                        <LanguageSwitcher />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('common.dashboard')}</span>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {plots.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 font-bold">
                        <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('public_plot.no_operations')}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plots.map((plot) => (
                            <motion.div
                                key={plot.id}
                                whileHover={{ y: -8 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <Link
                                    to={`/plot/${plot.id}`}
                                    className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                                        {plot.image_url ? (
                                            <img
                                                src={plot.image_url}
                                                alt={plot.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-green-50">
                                                <Sprout className="h-16 w-16 text-green-200" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${plot.status === 'active'
                                                ? 'bg-green-500/90 text-white'
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
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                                            {plot.name}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Sprout className="h-4 w-4 text-green-600" />
                                                <span className="truncate">{plot.crop_variety}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span>{plot.area} {t('public_plot.area_unit', { defaultValue: 'm²' })}</span>
                                            </div>
                                            {plot.tree_spacing_row && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex flex-col text-[10px] leading-tight text-gray-400">
                                                        <span>{plot.tree_spacing_row}×{plot.tree_spacing_between}</span>
                                                        <span className="font-bold text-gray-500">{t('public_plot.spacing', { defaultValue: 'Spacing' })}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {plot.plant_count && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex flex-col text-[10px] leading-tight text-gray-400">
                                                        <span>{plot.plant_count}</span>
                                                        <span className="font-bold text-gray-500">{t('public_plot.plant_count')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {plot.training_method && (
                                            <div className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 border border-gray-100">
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
