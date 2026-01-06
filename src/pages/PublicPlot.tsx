import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import QuickLogModal from '../components/QuickLogModal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import DiseasePestModal from '../components/DiseasePestModal';
import PhotoGallery from '../components/PhotoGallery';
import DiseaseLogTimeline from '../components/DiseaseLogTimeline';
import WeatherWidget from '../components/WeatherWidget';
import { Share2, ClipboardList, ExternalLink, TreeDeciduous, Layout, Droplet, Bug, Scissors, GitBranch, Sprout, Thermometer, Info, ArrowLeft, Trash2, Camera } from 'lucide-react';
import { getCachedPlot, getCachedOperationsForPlot, cacheOperations } from '@/lib/db';

const operationStyles: Record<string, { bg: string, text: string, icon: any }> = {
    irrigation: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: Droplet },
    fertilization: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: Sprout },
    pest_control: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: Bug },
    pruning: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: Scissors },
    harvest: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: Sprout },
    observation: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: Thermometer },
    planting: { bg: 'bg-lime-50 dark:bg-lime-900/30', text: 'text-lime-600 dark:text-lime-400', icon: Sprout },
    other: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: ClipboardList }
};

export default function PublicPlot() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [plot, setPlot] = useState<any>(null);
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showDiseaseModal, setShowDiseaseModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            setIsAdmin(user?.user_metadata?.role === 'admin');
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

    // Refresh operations after adding a new one
    const refreshOperations = async () => {
        if (!id) return;
        const { data: ops } = await supabase
            .from('operations')
            .select('*')
            .eq('plot_id', id)
            .order('date', { ascending: false });
        if (ops) {
            setOperations(ops);
            await cacheOperations(ops);
        }
    };

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

    const handleDeleteOperation = async (opId: string) => {
        if (!confirm(t('common.confirm_delete'))) return;

        try {
            const { error } = await supabase
                .from('operations')
                .delete()
                .eq('id', opId);

            if (error) throw error;
            setOperations(prev => prev.filter(op => op.id !== opId));
        } catch (error) {
            console.error('Error deleting operation:', error);
            alert(t('common.error'));
        }
    };

    const handleUpdateImage = async (id: string, table: 'plots' | 'operations', file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${table}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('plot-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('plot-images')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from(table)
                .update({ image_url: publicUrl })
                .eq('id', id);

            if (updateError) throw updateError;

            if (table === 'plots') {
                setPlot({ ...plot, image_url: publicUrl });
            } else {
                setOperations(prev => prev.map(op => op.id === id ? { ...op, image_url: publicUrl } : op));
            }
        } catch (error) {
            console.error('Error updating image:', error);
            alert(t('common.error'));
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-green-500/10 rounded-full" />
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin absolute top-0" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px] animate-pulse">{t('common.loading')}</p>
        </div>
    );

    if (!plot) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-2xl text-center border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{t('public_plot.not_found')}</h1>
                <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mb-8 uppercase tracking-widest leading-loose">
                    ID: {id?.slice(0, 8)}...
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-gray-900 dark:bg-green-600 text-white py-5 rounded-2xl font-black transition-all active:scale-95 shadow-xl hover:shadow-green-500/20"
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
            className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24"
        >
            {/* Nav */}
            <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 h-18">
                <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                                <Sprout className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-black text-xs tracking-widest text-gray-900 dark:text-white uppercase">ISIAOM</span>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 mt-4">
                {/* Hero */}
                <section className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl shadow-green-900/5 overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row relative">
                    {/* Plot Image */}
                    <div className="w-full md:w-1/2 h-80 md:h-[500px] relative bg-gray-100 dark:bg-gray-800 group overflow-hidden">
                        {plot.image_url ? (
                            <img
                                src={plot.image_url}
                                alt={plot.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-gray-700">
                                <Sprout className="h-40 w-40" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />

                        {isAdmin && (
                            <div className="absolute top-4 right-4 z-10">
                                <label className="cursor-pointer bg-white/90 dark:bg-gray-950/90 p-3 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-white dark:hover:bg-gray-900 transition-all border border-white/20 backdrop-blur-md group/cam">
                                    <Camera className="h-5 w-5 text-green-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white max-w-0 overflow-hidden group-hover/cam:max-w-xs transition-all duration-500 whitespace-nowrap">{t('common.update_image')}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpdateImage(plot.id, 'plots', file);
                                        }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-6">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${plot.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                {plot.status === 'active' ? t('dashboard.active') : t('dashboard.harvested')}
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {plot.id}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight uppercase">
                            {plot.name}
                        </h1>

                        <div className="flex items-center gap-3 text-green-600 dark:text-green-400 text-lg font-black mb-10 group cursor-default">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                                <Sprout className="h-5 w-5" />
                            </div>
                            {plot.crop_variety || t('public_plot.crop')}
                        </div>

                        <div className="grid grid-cols-2 gap-10 py-10 border-y border-gray-50 dark:border-gray-800/50">
                            <div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 block">{t('public_plot.area')}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">{plot.area}</span>
                                    <span className="text-xs font-bold text-gray-400">{t('public_plot.area_unit', { defaultValue: 'm²' })}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 block">{t('public_plot.date')}</span>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                    {plot.planting_date ? new Date(plot.planting_date).getFullYear() : '----'}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex flex-wrap items-center gap-4 mt-12">
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={handleLogClick}
                                        className="flex-1 min-w-[140px] bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-green-500/20 transition-all font-black text-xs active:scale-95 shadow-xl"
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        {t('dashboard.log_operation')}
                                    </button>
                                    <button
                                        onClick={() => setShowDiseaseModal(true)}
                                        className="flex-1 min-w-[140px] bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-red-500/20 transition-all font-black text-xs active:scale-95 shadow-xl"
                                    >
                                        <Bug className="h-4 w-4" />
                                        {t('disease.title')}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleShare}
                                className={`flex-1 min-w-[140px] ${isAdmin ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700' : 'bg-gray-900 dark:bg-green-600 text-white shadow-xl shadow-gray-200 dark:shadow-green-500/10'} px-6 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 hover:opacity-90 transition-all font-black text-xs active:scale-95`}
                            >
                                <Share2 className="h-4 w-4" />
                                {t('public_plot.share_qr')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Technical Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <TechnicalCard
                        icon={<TreeDeciduous className="h-7 w-7" />}
                        label={t('public_plot.spacing')}
                        value={`${plot.tree_spacing_row || '?'} × ${plot.tree_spacing_between || '?'} m`}
                        color="blue"
                    />
                    <TechnicalCard
                        icon={<Layout className="h-7 w-7" />}
                        label={t('public_plot.plant_count')}
                        value={plot.plant_count?.toString() || '0'}
                        unit={t('public_plot.plant_unit')}
                        color="orange"
                    />
                    <TechnicalCard
                        icon={<GitBranch className="h-7 w-7" />}
                        label={t('public_plot.training_method')}
                        value={plot.training_method ? t(`add_plot.methods.${plot.training_method}`) : '----'}
                        color="purple"
                    />
                    <TechnicalCard
                        icon={<Droplet className="h-7 w-7" />}
                        label={t('public_plot.irrigation_system')}
                        value={plot.irrigation_system ? t(`add_plot.irrigation_types.${plot.irrigation_system}`) : '----'}
                        color="cyan"
                    />
                    {plot.rootstock && (
                        <TechnicalCard
                            icon={<Sprout className="h-7 w-7" />}
                            label={t('public_plot.rootstock')}
                            value={plot.rootstock}
                            color="green"
                        />
                    )}
                </section>

                {/* Weather Widget */}
                <WeatherWidget />

                {/* Photo Gallery */}
                <PhotoGallery plotId={plot.id} isAdmin={isAdmin} />

                {/* Disease/Pest Log */}
                <DiseaseLogTimeline plotId={plot.id} />

                {/* Timeline */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-gradient-primary rounded-full shadow-lg shadow-green-500/20" />
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {t('public_plot.timeline')}
                            </h2>
                        </div>
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {operations.length} {t('quick_log.title')?.split(' ')[0]}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {operations.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 text-gray-200 dark:text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Droplet className="h-10 w-10" />
                                </div>
                                <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-xs">{t('public_plot.no_operations')}</p>
                            </div>
                        ) : (
                            <div className="relative pl-10 md:pl-16 border-l-4 border-gray-100 dark:border-gray-800/50 space-y-12 pb-10 ml-4 md:ml-8">
                                {operations.map((op) => (
                                    <TimelineItem
                                        key={op.id}
                                        op={op}
                                        t={t}
                                        isAdmin={isAdmin}
                                        onDelete={() => handleDeleteOperation(op.id)}
                                        onUpdateImage={(file: File) => handleUpdateImage(op.id, 'operations', file)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Mobile Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 flex gap-4 md:hidden z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                {isAdmin && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogClick}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[1.25rem] font-black text-xs flex items-center justify-center gap-2 h-16 shadow-xl shadow-green-500/20"
                    >
                        <ClipboardList className="h-5 w-5" />
                        {t('dashboard.log_operation')}
                    </motion.button>
                )}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    className={`${isAdmin ? 'flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700' : 'w-full bg-gray-900 dark:bg-green-600 text-white shadow-2xl shadow-green-500/10'} rounded-[1.25rem] font-black text-xs flex items-center justify-center gap-2 h-16 active:scale-95`}
                >
                    <Share2 className="h-5 w-5" />
                    {t('public_plot.share_qr')}
                </motion.button>
            </div>

            <footer className="max-w-4xl mx-auto px-8 py-16 text-center">
                <p className="text-[10px] text-gray-300 dark:text-gray-700 font-black uppercase tracking-[0.5em] mb-4">
                    ISIAOM Model Farm Tracking
                </p>
                <div className="w-10 h-1 bg-gray-100 dark:bg-gray-800 mx-auto rounded-full" />
            </footer>

            <AnimatePresence>
                {showLogModal && (
                    <QuickLogModal
                        plotId={plot.id}
                        onClose={() => {
                            setShowLogModal(false);
                            refreshOperations();
                        }}
                    />
                )}
                {showQRModal && (
                    <QRCodeGenerator plotId={plot.id} onClose={() => setShowQRModal(false)} />
                )}
                {showDiseaseModal && (
                    <DiseasePestModal
                        plotId={plot.id}
                        plotName={plot.name}
                        onClose={() => setShowDiseaseModal(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function TechnicalCard({ icon, label, value, unit, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
    }
    return (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className={`w-16 h-16 ${colors[color]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">{label}</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-gray-900 dark:text-white" dir="ltr">{value}</span>
                    {unit && <span className="text-[10px] font-bold text-gray-400 uppercase">{unit}</span>}
                </div>
            </div>
        </div>
    )
}

function TimelineItem({ op, t, isAdmin, onDelete, onUpdateImage }: any) {
    const style = operationStyles[op.type] || { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: ClipboardList };
    const Icon = style.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
        >
            <div className="absolute -left-[54px] top-1.5 w-8 h-8 bg-white dark:bg-gray-950 border-4 border-green-500 rounded-full z-10 shadow-lg shadow-green-500/20" />

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-8 transition-all hover:shadow-2xl hover:shadow-green-900/5 group">
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 block">
                                {new Date(op.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-green-600 transition-colors">
                                    {t(`quick_log.types.${op.type}`, { defaultValue: op.type })}
                                </h3>
                                {isAdmin && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={onDelete}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <label className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer">
                                            <Camera className="h-4 w-4" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) onUpdateImage(file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`p-5 rounded-[1.5rem] ${style.bg} ${style.text} shadow-sm group-hover:scale-110 transition-transform`}>
                            <Icon className="h-7 w-7" />
                        </div>
                    </div>

                    {op.notes && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-700/50">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-2 block">{t('quick_log.notes')}</span>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-bold">
                                {op.notes}
                            </p>
                        </div>
                    )}
                </div>

                {op.image_url && (
                    <div className="w-full md:w-56 h-56 rounded-[2rem] overflow-hidden flex-shrink-0 relative group/img shadow-2xl">
                        <img src={op.image_url} alt="Operation" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-4 transition-opacity backdrop-blur-sm">
                            <a href={op.image_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 hover:bg-white/40 rounded-2xl transition-all">
                                <ExternalLink className="text-white h-7 w-7" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

