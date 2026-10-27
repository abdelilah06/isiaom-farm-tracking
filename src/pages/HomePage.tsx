import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Sprout, MapPin, LayoutDashboard, Leaf, ArrowRight, Layers, Sun, GraduationCap, Award, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import HeroCardStack from '../components/HeroCardStack'
import { motion } from 'framer-motion'
import type { Plot, Billon } from '../types'
import { useTheme } from '../contexts/ThemeContext'

export default function HomePage() {
    const { t } = useTranslation()
    const { isHighGlare, toggleHighGlare } = useTheme()
    const [plots, setPlots] = useState<Plot[]>([])
    const [billons, setBillons] = useState<Billon[]>([])
    const [activeCycles, setActiveCycles] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        checkAuth()
        fetchData()
    }, [])

    async function checkAuth() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()
                const role = profile?.role || user.user_metadata?.role
                setIsAdmin(role === 'admin')
            } else {
                setIsAdmin(false)
            }
        } catch {
            setIsAdmin(false)
        }
    }

    async function fetchData() {
        try {
            const [plotsRes, billonsRes] = await Promise.all([
                supabase.from('plots').select('*').order('name'),
                supabase.from('billons').select('*').order('name')
            ])

            if (plotsRes.error) throw plotsRes.error
            if (billonsRes.error) throw billonsRes.error

            setPlots(plotsRes.data || [])
            const billonsData = billonsRes.data || []
            setBillons(billonsData)

            const billonIdsWithCycles = billonsData.filter(b => b.active_cycle_id).map(b => b.active_cycle_id)
            if (billonIdsWithCycles.length > 0) {
                const { data: cycles, error: cyclesError } = await supabase
                    .from('billon_cycles')
                    .select('*')
                    .in('id', billonIdsWithCycles)
                if (cyclesError) throw cyclesError
                const cycleMap: Record<string, any> = {}
                for (const c of cycles || []) {
                    cycleMap[c.billon_id] = c
                }
                setActiveCycles(cycleMap)
            } else {
                setActiveCycles({})
            }
        } catch (error) {
            console.error('Error fetching homepage data:', error)
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
                    <div className="flex items-center">
                        <div className="bg-white dark:bg-white rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm border border-gray-200/70 dark:border-gray-700/60 flex items-center shrink-0">
                            <img src="/logo.png" alt="ISIAOM" className="h-8 sm:h-10 w-auto object-contain" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>

                        {/* High-Contrast Glare Mode Toggle */}
                        <button
                            type="button"
                            onClick={toggleHighGlare}
                            className={`p-2.5 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
                                isHighGlare 
                                    ? 'bg-amber-500 text-white border-amber-600' 
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50'
                            }`}
                            title="High-Contrast Outdoor Mode"
                        >
                            <Sun className="h-4 w-4" />
                        </button>

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
            <header className="relative pt-28 sm:pt-36 pb-12 sm:pb-16 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 dark:from-green-950/20 dark:to-transparent pointer-events-none" />
                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        {/* 3D Floating Overlapping Cards */}
                        <HeroCardStack />

                        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link to="/gallery" className="px-8 sm:px-10 py-4 sm:py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-green-500/20 transition-all flex items-center gap-3 group">
                                {t('gallery.title')}
                                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Main Content */}
            <main id="parcelles" className="max-w-7xl mx-auto px-4 md:px-8 py-20">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('home.our_plots')}</h2>
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
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('home.qr_available')}</span>
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

                {/* Billons Section */}
                <div className="flex items-center justify-between mb-12 mt-24">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('billons.title', { defaultValue: 'Nos Billons' })}</h2>
                        <div className="h-1 w-20 bg-amber-500 mt-2 rounded-full" />
                    </div>
                </div>

                {billons.length === 0 ? (
                    <div className="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <Layers className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{t('billons.no_billons', { defaultValue: 'Aucun billon enregistré' })}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {billons.map((billon, index) => {
                            const cycle = activeCycles[billon.id];
                            return (
                                <motion.div
                                    key={billon.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className="group bg-white dark:bg-gray-900 rounded-[3rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xl shadow-amber-900/5 transition-all duration-500"
                                >
                                    <Link to={`/billon/${billon.id}`} className="block">
                                        <div className="h-64 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                            {billon.image_url ? (
                                                <img
                                                    src={billon.image_url}
                                                    alt={billon.name}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
                                                    <Layers className="h-16 w-16 text-amber-200 dark:text-gray-700" />
                                                </div>
                                            )}
                                            <div className="absolute top-6 left-6">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md ${
                                                    billon.status === 'active' || billon.status === 'planted'
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-blue-500 text-white'
                                                }`}>
                                                    {t(`billons.statuses.${billon.status}`, { defaultValue: billon.status })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter group-hover:text-amber-600 transition-colors">
                                                    {billon.name}
                                                </h3>
                                                {billon.billon_code && (
                                                    <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200/50 dark:border-amber-900/30">
                                                        {billon.billon_code}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-3 mb-8">
                                                {cycle ? (
                                                    <>
                                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent group-hover:border-amber-500/20 transition-all">
                                                            <Sprout className="h-4 w-4 text-amber-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                                                {cycle.target_crop} ({cycle.crop_variety})
                                                            </span>
                                                        </div>
                                                        {cycle.length_m && cycle.width_top_cm && (
                                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent group-hover:border-blue-500/20 transition-all">
                                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                                                    {(cycle.length_m * cycle.width_top_cm / 100).toFixed(1)} m²
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent transition-all">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                            {t('billons.statuses.empty', { defaultValue: 'Aucune culture active' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-800/50">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('home.qr_available')}</span>
                                                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="pt-16 pb-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    {/* Top Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-gray-100 dark:border-gray-800/80">
                        
                        {/* Col 1: Institute Identity */}
                        <div className="md:col-span-5 flex flex-col items-start">
                            <div className="bg-white rounded-2xl px-3.5 py-1.5 shadow-sm border border-gray-200/80 inline-flex items-center mb-4">
                                <img src="/logo.png" alt="ISIAOM" className="h-9 w-auto object-contain" />
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                ISIAOM Meknès
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 leading-relaxed max-w-sm">
                                Institut Spécialisé en Industrie Agroalimentaire et Oléiculture de Meknès
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/60 border border-green-200/60 dark:border-green-800/40 text-[11px] font-bold text-green-700 dark:text-green-300">
                                    <MapPin className="h-3 w-3 text-green-500" />
                                    Meknès, Maroc
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                                    Ferme Modèle
                                </span>
                            </div>
                        </div>

                        {/* Col 2: Academic Tribute & Dedication Card (MA202 & Amine Alami) */}
                        <div className="md:col-span-4 flex flex-col">
                            <div className="h-full rounded-2xl p-5 bg-gradient-to-br from-green-50/80 via-emerald-50/40 to-white dark:from-gray-800/60 dark:via-gray-800/40 dark:to-gray-900 border border-green-200/60 dark:border-green-800/30 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-black text-[11px] uppercase tracking-wider mb-2.5">
                                        <GraduationCap className="h-4 w-4" />
                                        <span>Projet Académique & Développement</span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-200 font-medium leading-relaxed">
                                        Système conçu et développé par les stagiaires de la promotion{' '}
                                        <span className="font-black text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950 px-2 py-0.5 rounded-md border border-green-300/60 dark:border-green-700/60">
                                            MA202
                                        </span>
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-green-200/50 dark:border-gray-700/60 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-green-600/10 dark:bg-green-400/10 flex items-center justify-center shrink-0">
                                        <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="text-[11px] text-gray-600 dark:text-gray-300">
                                        <span className="text-gray-400 dark:text-gray-500 block text-[10px] uppercase font-bold tracking-wider">
                                            Encadrant
                                        </span>
                                        <span className="font-black text-gray-900 dark:text-white text-xs">
                                            M. Amine Alami
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Col 3: Navigation Links */}
                        <div className="md:col-span-3 flex flex-col items-start md:items-end justify-between">
                            <div className="w-full">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-4">
                                    Navigation
                                </span>
                                <ul className="space-y-2.5 text-xs font-bold">
                                    <li>
                                        <button 
                                            type="button"
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5"
                                        >
                                            <ArrowRight className="h-3 w-3 text-green-500" />
                                            {t('home.footer_home', { defaultValue: 'Accueil' })}
                                        </button>
                                    </li>
                                    <li>
                                        <Link 
                                            to="/gallery" 
                                            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5"
                                        >
                                            <ArrowRight className="h-3 w-3 text-green-500" />
                                            {t('home.footer_gallery', { defaultValue: 'Galerie' })}
                                        </Link>
                                    </li>
                                    <li>
                                        <a 
                                            href="#parcelles" 
                                            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5"
                                        >
                                            <ArrowRight className="h-3 w-3 text-green-500" />
                                            {t('home.our_plots', { defaultValue: 'Nos Parcelles' })}
                                        </a>
                                    </li>
                                    <li>
                                        <Link 
                                            to={isAdmin ? "/admin" : "/login"} 
                                            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5"
                                        >
                                            <ArrowRight className="h-3 w-3 text-green-500" />
                                            {isAdmin ? t('common.dashboard') : t('login.submit')}
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <button
                                type="button"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="mt-6 md:mt-0 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-green-600 hover:text-white dark:hover:bg-green-600 text-gray-500 dark:text-gray-400 transition-all flex items-center gap-1 text-[11px] font-bold"
                                title="Retour en haut"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Copyright */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            &copy; 2026 <span className="font-bold text-gray-600 dark:text-gray-400">ISIAOM Meknès</span> — Institut Spécialisé en Industrie Agroalimentaire et Oléiculture.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600/80 dark:text-green-400/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Promotion MA202
                        </div>
                    </div>
                </div>
            </footer>
        </motion.div>
    )
}
