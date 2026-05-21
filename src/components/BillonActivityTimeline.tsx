import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, Droplets, Sprout, Bug, Scissors, Thermometer, Trash2, Camera, EyeOff, Eye, Scale, ShieldAlert, ShieldCheck, Wind, User, FlaskConical } from 'lucide-react'
import { uploadImage } from '@/lib/upload'

const activityStyles: Record<string, { bg: string, text: string, icon: any }> = {
    irrigation: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: Droplets },
    fertilization: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: Sprout },
    planting: { bg: 'bg-lime-50 dark:bg-lime-900/30', text: 'text-lime-600 dark:text-lime-400', icon: Sprout },
    harvest: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: Scale },
    observation: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: Thermometer },
    pest_control: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: Bug },
    pruning: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: Scissors },
    other: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: ClipboardList }
}

const categoryStyles: Record<string, { bg: string, text: string, border: string, icon: string }> = {
    biocontrol: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-900/30', icon: '🦠' },
    natural_pesticide: { bg: 'bg-lime-50 dark:bg-lime-950/30', text: 'text-lime-700 dark:text-lime-400', border: 'border-lime-200/50 dark:border-lime-900/30', icon: '🌿' },
    fungicide: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-900/30', icon: '🍄' },
    insecticide: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200/50 dark:border-red-900/30', icon: '🐛' },
    herbicide: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-900/30', icon: '🌾' },
    acaricide: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200/50 dark:border-rose-900/30', icon: '🕷️' },
    foliar_fertilizer: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200/50 dark:border-sky-900/30', icon: '🍃' },
    biostimulant: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', text: 'text-fuchsia-700 dark:text-fuchsia-400', border: 'border-fuchsia-200/50 dark:border-fuchsia-900/30', icon: '⚡' },
    other: { bg: 'bg-gray-50 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200/50 dark:border-gray-700/30', icon: '🧪' }
}

const parseTreatmentNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
        const trimmed = notes.trim();
        if (trimmed.startsWith('{')) {
            const data = JSON.parse(trimmed);
            if (data && data.is_structured_treatment) {
                return data;
            }
        }
    } catch (e) {
        // Not structured treatment JSON
    }
    return null;
}

interface BillonActivityTimelineProps {
    billonId: string
    isAdmin: boolean
    refreshTrigger: number
}

export default function BillonActivityTimeline({ billonId, isAdmin, refreshTrigger }: BillonActivityTimelineProps) {
    const { t } = useTranslation()
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showDetail, setShowDetail] = useState(false)

    useEffect(() => {
        fetchActivities()
    }, [billonId, refreshTrigger])

    async function fetchActivities() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('billon_activities')
                .select('*')
                .eq('billon_id', billonId)
                .order('performed_at', { ascending: false })

            if (error) throw error
            setActivities(data || [])
            if ((data?.length || 0) > 0) setShowDetail(true)
        } catch (error) {
            console.error('Error fetching billon activities:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('common.confirm_delete'))) return
        try {
            await supabase.from('billon_activities').delete().eq('id', id)
            setActivities(prev => { const next = prev.filter(a => a.id !== id); if (next.length === 0) setShowDetail(false); return next })
        } catch (error) {
            console.error('Error deleting activity:', error)
        }
    }

    const handleImageUpdate = async (id: string, file: File) => {
        try {
            const url = await uploadImage(file, 'operations-images')
            await supabase.from('billon_activities').update({ image_url: url }).eq('id', id)
            setActivities(prev => prev.map(a => a.id === id ? { ...a, image_url: url } : a))
        } catch (error) {
            console.error('Error updating image:', error)
            alert(t('common.error'))
        }
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full shadow-lg shadow-amber-500/20" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {t('billons.recent_activities')}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    {activities.length > 0 && (
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden sm:block">
                            {activities.length} {t('quick_log.title').split(' ')[0]}
                        </div>
                    )}
                    <button
                        onClick={() => setShowDetail(!showDetail)}
                        className={`p-3 rounded-2xl transition-all shadow-lg ${showDetail ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`}
                    >
                        {showDetail ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {showDetail && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {loading ? (
                            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex-shrink-0 w-[300px] h-40 bg-gray-100 dark:bg-gray-800 rounded-[2rem] animate-pulse" />
                                ))}
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 p-16 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 dark:border-gray-800 mx-2">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="h-8 w-8 text-gray-200 dark:text-gray-700" />
                                </div>
                                <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px]">{t('billons.no_activities')}</p>
                            </div>
                        ) : (
                            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 snap-x no-scrollbar">
                                {activities.map((act) => {
                                    const style = activityStyles[act.activity_type] || activityStyles.other
                                    const Icon = style.icon
                                    const treatmentData = act.activity_type === 'pest_control' ? parseTreatmentNotes(act.notes) : null
                                    return (
                                        <motion.div
                                            key={act.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex-shrink-0 w-[300px] sm:w-[350px] snap-center bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-50 dark:border-gray-800 flex flex-col gap-5 group hover:border-amber-500/30 transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className={`p-4 rounded-2xl ${style.bg} ${style.text} shadow-lg transition-transform group-hover:scale-110`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                        {new Date(act.performed_at).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleDelete(act.id)}
                                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            <label className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-300 hover:text-blue-500 rounded-xl transition-all cursor-pointer">
                                                                <Camera className="h-4 w-4" />
                                                                <input type="file" className="hidden" accept="image/*"
                                                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpdate(act.id, f) }} />
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                                                    {t(`quick_log.types.${act.activity_type}`, { defaultValue: act.activity_type })}
                                                </h3>
                                                {treatmentData ? (
                                                    <div className="space-y-4 mt-3">
                                                        {/* Intervention type and Category Badge */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                treatmentData.treatment_type === 'preventative'
                                                                    ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                                                                    : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                                                            }`}>
                                                                {t(`treatment.${treatmentData.treatment_type}`)}
                                                            </span>
                                                            {(() => {
                                                                const catInfo = categoryStyles[treatmentData.treatment_category] || categoryStyles.other;
                                                                return (
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${catInfo.bg} ${catInfo.text} ${catInfo.border} flex items-center gap-1`}>
                                                                        <span>{catInfo.icon}</span>
                                                                        <span>{t(`treatment.categories.${treatmentData.treatment_category}`, { defaultValue: treatmentData.treatment_category })}</span>
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Safety Countdown Shield Banner */}
                                                        {(() => {
                                                            const phi_days = treatmentData.phi_days || 0;
                                                            const performedDate = new Date(act.performed_at);
                                                            const safeHarvestDate = new Date(performedDate.getTime() + phi_days * 24 * 60 * 60 * 1000);
                                                            const currentDate = new Date();
                                                            const diffTime = safeHarvestDate.getTime() - currentDate.getTime();
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                            const isPHISafe = diffDays <= 0 || phi_days === 0;

                                                            if (!isPHISafe) {
                                                                return (
                                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 animate-pulse">
                                                                        <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                                                                                    {t('treatment.safe_harvest_badge')}
                                                                                </span>
                                                                                <span className="text-[9px] font-bold text-red-500 dark:text-red-400">
                                                                                    {t('treatment.days_remaining', { days: diffDays })}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[10px] font-bold text-red-800 dark:text-red-300 mt-0.5 truncate">
                                                                                🚫 {t('treatment.safe_harvest_date')}: {safeHarvestDate.toLocaleDateString('fr-FR', {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                    year: 'numeric'
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-2.5">
                                                                        <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                                                                                {t('treatment.safe_harvest_ok')}
                                                                            </span>
                                                                            <p className="text-[10px] font-bold text-green-800 dark:text-green-300 mt-0.5">
                                                                                🟢 {t('treatment.safe_harvest_ok')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        })()}

                                                        {/* Structured Data Grid */}
                                                        <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4.5 space-y-3.5 text-xs">
                                                            {/* Target and Product Details */}
                                                            <div className="flex items-start gap-2.5">
                                                                <FlaskConical className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">{t('treatment.target_pest')}</p>
                                                                    <p className="font-extrabold text-gray-900 dark:text-white mt-0.5 leading-snug">{treatmentData.target_pest}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800/60">
                                                                <div>
                                                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">{t('treatment.product_name')}</p>
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 truncate">{treatmentData.product_name}</p>
                                                                    {treatmentData.active_ingredient && (
                                                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold truncate">({treatmentData.active_ingredient})</p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">{t('treatment.dosage')}</p>
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                                                                        {treatmentData.dosage_value} <span className="text-[9px] font-black uppercase text-gray-500">{treatmentData.dosage_unit?.replace('_', '/')}</span>
                                                                    </p>
                                                                    {treatmentData.water_volume_l && (
                                                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold">in {treatmentData.water_volume_l}L H₂O</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800/60">
                                                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">{t('treatment.application_method')}</p>
                                                                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{t(`treatment.methods.${treatmentData.application_method}`, { defaultValue: treatmentData.application_method })}</p>
                                                            </div>
                                                        </div>

                                                        {/* Environmental conditions & PPE */}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold bg-gray-50/50 dark:bg-gray-800/10 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/30">
                                                            {treatmentData.operator_name && (
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3 text-gray-400" />
                                                                    {treatmentData.operator_name}
                                                                </span>
                                                            )}
                                                            {treatmentData.temperature_c && (
                                                                <span className="flex items-center gap-1">
                                                                    <Thermometer className="h-3 w-3 text-amber-500/80" />
                                                                    {treatmentData.temperature_c}°C
                                                                </span>
                                                            )}
                                                            {treatmentData.wind_condition && (
                                                                <span className="flex items-center gap-1">
                                                                    <Wind className="h-3 w-3 text-sky-500/80" />
                                                                    {t(`treatment.winds.${treatmentData.wind_condition}`)}
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
                                                                treatmentData.ppe_worn
                                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                                            }`}>
                                                                😷 {treatmentData.ppe_worn ? 'EPI OK' : 'EPI NC'}
                                                            </span>
                                                        </div>

                                                        {/* Notes (if any inside treatment notes) */}
                                                        {treatmentData.notes && (
                                                            <div className="bg-amber-50/10 dark:bg-amber-950/5 p-3 rounded-xl border border-amber-200/10 dark:border-amber-900/5 mt-2">
                                                                <p className="text-gray-600 dark:text-gray-300 text-xs italic leading-relaxed font-bold">
                                                                    💬 "{treatmentData.notes}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    act.notes && (
                                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 mt-3">
                                                            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed font-bold">{act.notes}</p>
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {act.image_url && (
                                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">
                                                    <img src={act.image_url} alt={act.activity_type}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
