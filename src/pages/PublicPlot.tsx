import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import QuickLogModal from '../components/QuickLogModal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { Share2, ClipboardList, MapPin, ExternalLink, TreeDeciduous, Layout, Droplet, Bug, Scissors, GitBranch, Sprout, Thermometer, Info } from 'lucide-react';
import { getCachedPlot, getCachedOperationsForPlot, cacheOperations } from '@/lib/db';

const operationStyles: Record<string, { bg: string, text: string, icon: any }> = {
    irrigation: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Droplet },
    fertilization: { bg: 'bg-orange-50', text: 'text-orange-600', icon: Sprout },
    pest_control: { bg: 'bg-red-50', text: 'text-red-600', icon: Bug },
    pruning: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Scissors },
    harvest: { bg: 'bg-green-50', text: 'text-green-600', icon: Sprout },
    observation: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Thermometer },
    planting: { bg: 'bg-lime-50', text: 'text-lime-600', icon: Sprout },
    other: { bg: 'bg-gray-50', text: 'text-gray-600', icon: ClipboardList }
};

export default function PublicPlot() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [plot, setPlot] = useState<any>(null);
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const isRtl = i18n.language === 'ar';

    useEffect(() => {
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAdmin(!!session);
        }

        async function fetchData() {
            if (!id) return;
            setLoading(true);
            try {
                const { data: plotData, error: plotError } = await supabase
                    .from('plots')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (plotError) throw plotError;

                if (plotData) {
                    setPlot(plotData);

                    // Fetch Operations
                    const { data: ops, error: opsError } = await supabase
                        .from('operations')
                        .select('*')
                        .eq('plot_id', id)
                        .order('date', { ascending: false });

                    if (opsError) throw opsError;

                    if (ops) {
                        setOperations(ops);
                        await cacheOperations(ops);
                    }
                }
            } catch (error) {
                console.error('Error fetching public plot data, trying cache:', error);
                const cachedPlot = await getCachedPlot(id);
                if (cachedPlot) {
                    setPlot(cachedPlot);
                    const cachedOps = await getCachedOperationsForPlot(id);
                    setOperations(cachedOps);
                }
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
        fetchData();
    }, [id]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `ISIAOM - ${plot?.name}`,
                    text: `${t('public_plot.crop')}: ${plot?.crop_variety}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing', error);
                setShowQRModal(true);
            }
        } else {
            setShowQRModal(true);
        }
    };

    const handleLogClick = () => {
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        setShowLogModal(true);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB] gap-4">
            <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
        </div>
    );

    if (!plot) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9FAFB]">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">{t('public_plot.not_found')}</h1>
                <p className="text-gray-400 text-sm mb-8">ID: {id?.slice(0, 8)}...</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black transition-transform active:scale-95 min-h-[44px]"
                >
                    {t('common.home')}
                </button>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`min-h-screen bg-gray-50 pb-20 ${isRtl ? 'font-arabic' : 'font-sans'}`}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg shadow-green-100">
                            I
                        </div>
                        <span className="font-black text-sm tracking-tighter">ISIAOM</span>
                    </div>
                    <LanguageSwitcher />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                {/* Hero Section */}
                <section className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 overflow-hidden border border-gray-100 flex flex-col md:flex-row-reverse">
                    {/* Plot Image / Placeholder */}
                    <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-green-50 group overflow-hidden">
                        {plot.image_url ? (
                            <img
                                src={plot.image_url}
                                alt={plot.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-green-200">
                                <Sprout className="h-32 w-32" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black/20 to-transparent" />
                    </div>

                    {/* Plot Basic Info */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-right">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 ${plot.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'} rounded-full text-[10px] font-black uppercase tracking-wider mb-4 w-fit`}>
                            <MapPin className="h-3 w-3" />
                            {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 leading-tight uppercase tracking-tight">
                            {plot.name}
                        </h1>
                        <p className="text-lg font-bold text-green-600 mb-8 flex items-center gap-2">
                            <Sprout className="h-5 w-5" />
                            {plot.crop_variety || t('public_plot.crop')}
                        </p>

                        <div className="grid grid-cols-2 gap-8 py-8 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">{t('public_plot.area')}</span>
                                <span className="text-xl font-black text-gray-900">
                                    {plot.area} <span className="text-xs font-normal lowercase">{t('public_plot.area_unit', { defaultValue: 'م²' })}</span>
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">{t('public_plot.date')}</span>
                                <span className="text-xl font-black text-gray-900">
                                    {plot.planting_date || '----'}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className={`hidden md:flex items-center gap-4 mt-8 pt-8 border-t border-gray-50 ${!isAdmin ? 'justify-center' : ''}`}>
                            {isAdmin && (
                                <button
                                    onClick={handleLogClick}
                                    className="bg-green-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-100 font-black active:scale-95"
                                >
                                    <ClipboardList className="h-5 w-5" />
                                    {t('dashboard.log_operation')}
                                </button>
                            )}
                            <button
                                onClick={handleShare}
                                className={`${isAdmin ? 'bg-white text-gray-900 border-2 border-gray-100' : 'bg-gray-900 text-white shadow-xl shadow-gray-200'} px-8 py-4 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-all font-black active:scale-95 min-w-[200px] justify-center`}
                            >
                                <Share2 className="h-5 w-5" />
                                {t('public_plot.share_qr')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Technical Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Spacing */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <TreeDeciduous className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('public_plot.spacing')}</span>
                            <span className="text-lg font-black text-gray-900" dir="ltr">
                                {plot.tree_spacing_row || '?'} × {plot.tree_spacing_between || '?'} م
                            </span>
                        </div>
                    </div>

                    {/* Plant Count */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center gap-5">
                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Layout className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('public_plot.plant_count')}</span>
                            <span className="text-lg font-black text-gray-900">
                                {plot.plant_count || '0'} <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('public_plot.plant_unit')}</span>
                            </span>
                        </div>
                    </div>

                    {/* Training Method */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 sm:col-span-2 lg:col-span-1">
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <GitBranch className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('public_plot.training_method')}</span>
                            <span className="text-lg font-black text-gray-900">
                                {plot.training_method ? t(`add_plot.methods.${plot.training_method}`) : '----'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Operations Timeline */}
                <section>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <div className="w-2 h-8 bg-green-600 rounded-full" />
                            {t('public_plot.timeline')}
                        </h2>
                        <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                            {operations.length} {t('quick_log.title').split(' ')[0]}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {operations.length === 0 ? (
                            <div className="bg-white p-16 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Droplet className="h-8 w-8" />
                                </div>
                                <p className="text-gray-400 font-bold">{t('public_plot.no_operations')}</p>
                            </div>
                        ) : (
                            <div className={`relative ${isRtl ? 'border-r-2 md:border-r-4 mr-6 md:mr-10 pr-10 md:pr-14' : 'border-l-2 md:border-l-4 ml-6 md:ml-10 pl-10 md:pl-14'} border-green-50 space-y-10 pb-10`}>
                                {operations.map((op) => {
                                    const style = operationStyles[op.type] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: Droplet };
                                    const Icon = style.icon;
                                    return (
                                        <motion.div
                                            key={op.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="relative"
                                        >
                                            {/* Timeline Node */}
                                            <div className={`absolute ${isRtl ? '-right-[51px] md:-right-[74px]' : '-left-[51px] md:-left-[74px]'} top-1 w-5 h-5 md:w-8 md:h-8 bg-white border-4 border-green-500 rounded-full z-10 shadow-sm transition-colors hover:bg-green-500`} />

                                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-50 flex flex-col md:flex-row gap-6 md:gap-10 transition-all hover:shadow-xl hover:shadow-green-900/5 group border-transparent hover:border-green-100">
                                                <div className="flex-1 text-right">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1 block">
                                                                {new Date(op.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                            <h3 className="text-xl font-black text-gray-900 group-hover:text-green-700 transition-colors">
                                                                {t(`quick_log.types.${op.type}`, { defaultValue: op.type })}
                                                            </h3>
                                                        </div>
                                                        <div className={`p-4 rounded-2xl ${style.bg} ${style.text} transition-transform group-hover:scale-110`}>
                                                            <Icon className="h-6 w-6" />
                                                        </div>
                                                    </div>

                                                    {op.notes && (
                                                        <div className="mt-4 bg-gray-50/80 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 relative">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('quick_log.notes')}</span>
                                                            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
                                                                {op.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {op.image_url && (
                                                    <div className="w-full md:w-48 h-48 rounded-[1.5rem] overflow-hidden flex-shrink-0 group/img relative shadow-lg shadow-black/5">
                                                        <img
                                                            src={op.image_url}
                                                            alt="Operation"
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                                        />
                                                        <a
                                                            href={op.image_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                                                        >
                                                            <ExternalLink className="text-white h-6 w-6" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Mobile Sticky Action Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 md:hidden z-40 pb-safe ${!isAdmin ? 'justify-center' : ''}`}>
                {isAdmin && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogClick}
                        className="flex-1 bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 h-14 shadow-lg shadow-green-100 active:scale-95 transition-transform"
                    >
                        <ClipboardList className="h-5 w-5" />
                        {t('dashboard.log_operation')}
                    </motion.button>
                )}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className={`${isAdmin ? 'flex-1 bg-white text-gray-900 border-2 border-gray-100' : 'w-full max-w-xs bg-gray-900 text-white shadow-lg shadow-gray-200'} rounded-2xl font-black text-sm flex items-center justify-center gap-2 h-14 active:scale-95 transition-transform`}
                >
                    <Share2 className="h-5 w-5" />
                    {t('public_plot.share_qr')}
                </motion.button>
            </div>

            <footer className="max-w-4xl mx-auto px-8 py-10 text-center">
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.5em]">
                    ISIAOM Model Farm Tracking v2.5
                </p>
            </footer>

            {/* Modals */}
            <AnimatePresence>
                {showLogModal && isAdmin && (
                    <QuickLogModal
                        plotId={plot.id}
                        onClose={() => setShowLogModal(false)}
                    />
                )}
                {showQRModal && (
                    <QRCodeGenerator
                        plotId={plot.id}
                        onClose={() => setShowQRModal(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
