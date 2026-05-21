import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import QRCodeGenerator from '../components/QRCodeGenerator';
import BillonActivityTimeline from '../components/BillonActivityTimeline';
import AddBillonActivityModal from '../components/AddBillonActivityModal';
import { Layers, ClipboardList, Share2, Info, ArrowLeft, Trash2, Camera, Calendar, Activity, Wheat, Hash, Clock, Ruler, Sprout, Droplets } from 'lucide-react';
import { getCachedBillon } from '@/lib/db';
import { uploadImage } from '@/lib/upload';
import type { BillonCycle } from '../types';

export default function PublicBillon() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [billon, setBillon] = useState<any>(null);
    const [activeCycle, setActiveCycle] = useState<BillonCycle | null>(null);
    const [previousCycles, setPreviousCycles] = useState<BillonCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activityCount, setActivityCount] = useState(0);

    const getCalculatedDensity = () => {
        if (!activeCycle) return null;
        const interM = (activeCycle.inter_billon_cm || 0) / 100;
        const ecartM = (activeCycle.ecartement_sur_rang_cm || 0) / 100;
        if (interM && ecartM) {
            const base = 1 / (interM * ecartM);
            if (activeCycle.semis_layout === 'double_rang') return (base * 2).toFixed(1);
            if (activeCycle.semis_layout === 'quinconce') return (base * 1.15).toFixed(1);
            return base.toFixed(1);
        }
        return null;
    };

    const getCalculatedWaterFlow = () => {
        if (!activeCycle) return null;
        const lines = activeCycle.irrigation_lines || 1;
        const spacingM = (activeCycle.dripper_spacing_cm || 0) / 100;
        const flow = activeCycle.dripper_flow_rate_lh;
        if (lines && spacingM && flow) {
            return ((flow * lines) / spacingM).toFixed(1);
        }
        return null;
    };


    useEffect(() => {
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
            if (!id) return;
            setLoading(true);
            try {
                const { data: billonData, error: billonError } = await supabase
                    .from('billons')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (billonError) throw billonError;

                if (billonData) {
                    setBillon(billonData);

                    const { count } = await supabase
                        .from('billon_activities')
                        .select('*', { count: 'exact', head: true })
                        .eq('billon_id', id);
                    setActivityCount(count || 0);

                    // Fetch active cycle
                    if (billonData.active_cycle_id) {
                        const { data: cycleData } = await supabase
                            .from('billon_cycles')
                            .select('*')
                            .eq('id', billonData.active_cycle_id)
                            .maybeSingle();
                        if (cycleData) setActiveCycle(cycleData);
                    }

                    // Fetch last 2 completed cycles
                    const { data: completedData } = await supabase
                        .from('billon_cycles')
                        .select('*')
                        .eq('billon_id', id)
                        .eq('status', 'completed')
                        .order('cycle_number', { ascending: false })
                        .limit(2);
                    if (completedData) setPreviousCycles(completedData);
                }
            } catch (error) {
                console.error('Error fetching billon, trying cache:', error);
                const cached = await getCachedBillon(id);
                if (cached) setBillon(cached);
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
                    title: `ISIAOM - ${billon?.name}`,
                    text: billon?.description || '',
                    url: window.location.href,
                });
            } catch {
                setShowQRModal(true);
            }
        } else {
            setShowQRModal(true);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t('common.confirm_delete'))) return;
        try {
            await supabase.from('billons').delete().eq('id', id);
            navigate('/');
        } catch (error) {
            console.error('Error deleting billon:', error);
            alert(t('common.error'));
        }
    };

    const handleUpdateImage = async (file: File) => {
        try {
            const publicUrl = await uploadImage(file, 'plots-images');
            await supabase.from('billons').update({ image_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', id);
            setBillon({ ...billon, image_url: publicUrl });
        } catch (error) {
            console.error('Error updating image:', error);
            alert(t('common.error'));
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/10 rounded-full" />
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute top-0" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px] animate-pulse">{t('common.loading')}</p>
        </div>
    );

    if (!billon) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-2xl text-center border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{t('public_plot.not_found', { defaultValue: 'Billon not found' })}</h1>
                <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mb-8 uppercase tracking-widest">ID: {id?.slice(0, 8)}...</p>
                <button onClick={() => navigate('/')}
                    className="w-full bg-gray-900 dark:bg-amber-600 text-white py-5 rounded-2xl font-black transition-all active:scale-95 shadow-xl">
                    {t('common.home')}
                </button>
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
            <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 h-18">
                <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Layers className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-black text-xs tracking-widest text-gray-900 dark:text-white uppercase">ISIAOM</span>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 mt-4">
                <section className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl shadow-amber-900/5 overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row relative">
                    <div className="w-full md:w-1/2 h-80 md:h-[500px] relative bg-gray-100 dark:bg-gray-800 group overflow-hidden">
                        {billon.image_url ? (
                            <img src={billon.image_url} alt={billon.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-gray-700">
                                <Layers className="h-40 w-40" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />
                        {isAdmin && (
                            <div className="absolute top-4 right-4 z-10">
                                <label className="cursor-pointer bg-white/90 dark:bg-gray-950/90 p-3 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-white dark:hover:bg-gray-900 transition-all border border-white/20 backdrop-blur-md group/cam">
                                    <Camera className="h-5 w-5 text-amber-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white max-w-0 overflow-hidden group-hover/cam:max-w-xs transition-all whitespace-nowrap">{t('common.update_image')}</span>
                                    <input type="file" className="hidden" accept="image/*"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpdateImage(f); }} />
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${billon.status === 'active' || billon.status === 'planted' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : billon.status === 'fallow' || billon.status === 'resting' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                {billon.status === 'active' || billon.status === 'planted' ? t('dashboard.active') : billon.status === 'fallow' || billon.status === 'resting' ? t('billons.statuses.fallow') : t('dashboard.harvested')}
                            </div>
                            {billon.is_control_group && (
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30 animate-pulse">
                                    🧪 Témoin
                                </div>
                            )}
                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {billon.id.slice(0, 8)}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight uppercase">
                            {billon.name}
                        </h1>

                        {billon.description && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 mb-10">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-bold">{billon.description}</p>
                            </div>
                        )}

                        <div className="hidden md:flex items-center gap-4 mt-6">
                            {isAdmin && (
                                <motion.button
                                    whileHover={{ y: -4, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowActivityModal(true)}
                                    className="w-16 h-16 flex items-center justify-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-white/10 shadow-xl hover:bg-white/80 dark:hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-11 h-11 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                                        <ClipboardList className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ y: -4, scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                className={`w-16 h-16 flex items-center justify-center rounded-[1.5rem] transition-all shadow-xl ${isAdmin ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950' : 'bg-gradient-to-br from-amber-400 to-orange-600 text-white'}`}
                            >
                                <Share2 className="h-6 w-6" />
                            </motion.button>

                            {isAdmin && (
                                <motion.button
                                    whileHover={{ y: -4, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDelete}
                                    className="w-16 h-16 flex items-center justify-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-white/10 shadow-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-all group"
                                >
                                    <div className="w-11 h-11 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                                        <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Info Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            <Calendar className="h-7 w-7" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5 block">{t('analytics.filters.date_range')}</span>
                            <span className="text-xl font-black text-gray-900 dark:text-white">
                                {billon.created_at ? new Date(billon.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '----'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            <Activity className="h-7 w-7" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5 block">{t('analytics.total_operations')}</span>
                            <span className="text-xl font-black text-gray-900 dark:text-white">{activityCount}</span>
                        </div>
                    </div>
                </section>

                {/* Active Cycle Technical Cards */}
                {activeCycle && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-green-500 rounded-full" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('billons.cycle_n', { n: activeCycle.cycle_number })}</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeCycle.target_crop && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.target_crop')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{activeCycle.target_crop}</p>
                                </div>
                            )}
                            {activeCycle.crop_variety && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.crop_variety')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{activeCycle.crop_variety}</p>
                                </div>
                            )}
                            {activeCycle.plant_count && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.plant_count')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{activeCycle.plant_count}</p>
                                </div>
                            )}
                            {activeCycle.planting_date && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.planting_date')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{new Date(activeCycle.planting_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                </div>
                            )}
                            {activeCycle.seed_type && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.seed_type')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{t(`billons.seed_types.${activeCycle.seed_type}`, { defaultValue: activeCycle.seed_type })}</p>
                                </div>
                            )}
                            {activeCycle.growing_cycle_days && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.growing_cycle')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{activeCycle.growing_cycle_days} {t('common.days')}</p>
                                </div>
                            )}
                            {activeCycle.irrigation_system && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.irrigation_system')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{t(`billons.irrigation_types.${activeCycle.irrigation_system}`, { defaultValue: activeCycle.irrigation_system })}</p>
                                </div>
                            )}
                            {activeCycle.length_m && activeCycle.width_top_cm && (
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('billons.area_m2')}</span>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{(activeCycle.length_m * activeCycle.width_top_cm / 100).toFixed(1)} <span className="text-xs font-bold text-gray-400">m²</span></p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Agronomic & Technical Specifications Section */}
                <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-amber-500 rounded-full" />
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Caractéristiques Techniques 🧪</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Geometry & Planting */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <Ruler className="h-4 w-4 text-amber-500" /> Géométrie & Plantation
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Code Unique</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{billon.billon_code || '----'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Dimensions</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                        {activeCycle?.length_m ? `${activeCycle.length_m}m` : '--'} × {activeCycle?.width_top_cm ? `${activeCycle.width_top_cm}cm` : '--'} (H: {activeCycle?.height_cm || '--'}cm)
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Espacement Inter-billon</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{activeCycle?.inter_billon_cm ? `${activeCycle.inter_billon_cm} cm` : '--'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Espacement sur Rang</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{activeCycle?.ecartement_sur_rang_cm ? `${activeCycle.ecartement_sur_rang_cm} cm` : '--'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Mode de Semis</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase">
                                        {activeCycle?.mode_semis ? t(`billons.mode_semis.${activeCycle.mode_semis}`, activeCycle.mode_semis) : '--'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Agencement (Layout)</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase">
                                        {activeCycle?.semis_layout ? t(`billons.semis_layout.${activeCycle.semis_layout}`, activeCycle.semis_layout) : '--'}
                                    </span>
                                </div>
                            </div>

                            {getCalculatedDensity() && (
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-800/30 rounded-2xl flex items-center gap-3">
                                    <Sprout className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <span className="text-xs font-bold text-green-800 dark:text-green-400">
                                        Densité calculée : <strong className="text-sm font-black">{getCalculatedDensity()}</strong> plants/m²
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Column 2: Irrigation, Cover & Soil */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <Droplets className="h-4 w-4 text-blue-500" /> Irrigation & Paillage
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Système de الري</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                        {activeCycle?.irrigation_system ? t(`billons.irrigation_types.${activeCycle.irrigation_system}`, { defaultValue: activeCycle.irrigation_system }) : '--'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Lignes de goutteurs</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{activeCycle?.irrigation_lines || '1'} lignes</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Espacement & Débit</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                        {activeCycle?.dripper_spacing_cm ? `${activeCycle.dripper_spacing_cm}cm` : '--'} ({activeCycle?.dripper_flow_rate_lh ? `${activeCycle.dripper_flow_rate_lh}L/h` : '--'})
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-1">Mulching / Paillage</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase">
                                        {activeCycle?.mulching ? t(`billons.mulching_types.${activeCycle.mulching}`, activeCycle.mulching) : 'none'}
                                    </span>
                                </div>
                            </div>

                            {getCalculatedWaterFlow() && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl flex items-center gap-3">
                                    <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                                        Débit par mètre linéaire : <strong className="text-sm font-black">{getCalculatedWaterFlow()}</strong> L/h/m
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {activeCycle?.soil_notes && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest block mb-2">Observations sur la التربة (Soil Notes)</span>
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 leading-relaxed">{activeCycle.soil_notes}</p>
                        </div>
                    )}
                </section>

                {/* Previous Cycles (last 2 completed) */}
                {previousCycles.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('billons.previous_cycles')}</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {previousCycles.map(cycle => (
                                <div key={cycle.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-amber-100 dark:border-amber-900/30 hover:shadow-xl transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                                            <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="font-black text-sm text-gray-900 dark:text-white">{t('billons.cycle_n', { n: cycle.cycle_number })}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        {cycle.crop_variety && (
                                            <div className="flex items-center gap-2">
                                                <Wheat className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                                <span className="font-bold text-gray-600 dark:text-gray-300">{cycle.crop_variety}</span>
                                            </div>
                                        )}
                                        {cycle.yield_kg && (
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                                <span className="font-bold text-gray-600 dark:text-gray-300">{cycle.yield_kg} kg</span>
                                            </div>
                                        )}
                                        {cycle.planting_date && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                <span className="font-bold text-gray-600 dark:text-gray-300">{new Date(cycle.planting_date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        )}
                                        {cycle.growing_cycle_days && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                                                <span className="font-bold text-gray-600 dark:text-gray-300">{cycle.growing_cycle_days} {t('common.days')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <BillonActivityTimeline billonId={billon.id} isAdmin={isAdmin} refreshTrigger={refreshTrigger} />
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-gray-950/90 backdrop-blur-3xl border-t border-gray-100/50 dark:border-gray-800/50 flex flex-col gap-3 md:hidden z-40 pb-safe-bottom shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                {isAdmin && (
                    <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => setShowActivityModal(true)}
                        className="bg-gradient-to-br from-amber-500 to-orange-700 text-white rounded-[2rem] font-black text-[11px] flex items-center justify-center gap-2 h-16 shadow-lg shadow-amber-500/20 uppercase tracking-widest"
                    >
                        <ClipboardList className="h-5 w-5" />
                        {t('billons.add_activity')}
                    </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="w-full bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-[2rem] font-black text-xs flex items-center justify-center gap-3 h-16 uppercase tracking-[0.2em] shadow-2xl"
                >
                    <Share2 className="h-5 w-5" />
                    {t('public_plot.share_qr')}
                </motion.button>
            </div>

            <AnimatePresence>
                {showActivityModal && (
                    <AddBillonActivityModal
                        billonId={billon.id}
                        onClose={() => setShowActivityModal(false)}
                        onAdded={() => { setRefreshTrigger(v => v + 1); setShowActivityModal(false) }}
                    />
                )}
                {showQRModal && (
                    <QRCodeGenerator plotId={billon.id} type="billon" onClose={() => setShowQRModal(false)} />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
