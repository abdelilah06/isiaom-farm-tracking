import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Loader2, Check, Play, Sprout, Ruler, Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface StartCycleModalProps {
    billonId: string
    onClose: () => void
    onStarted: () => void
}

type TabType = 'plantation' | 'dimensions' | 'irrigation'

export default function StartCycleModal({ billonId, onClose, onStarted }: StartCycleModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>('plantation')
    const [nextCycleNumber, setNextCycleNumber] = useState(1)

    // Tab 1: Plantation
    const [targetCrop, setTargetCrop] = useState('')
    const [cropVariety, setCropVariety] = useState('')
    const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0])
    const [growingCycleDays, setGrowingCycleDays] = useState('')
    const [modeSemis, setModeSemis] = useState<'direct' | 'plant' | 'bulbe' | 'bouture' | ''>('')
    const [semisLayout, setSemisLayout] = useState<'monorang' | 'double_rang' | 'quinconce' | ''>('')
    const [ecartementSurRangCm, setEcartementSurRangCm] = useState('')

    // Tab 2: Dimensions
    const [lengthM, setLengthM] = useState('')
    const [widthTopCm, setWidthTopCm] = useState('')
    const [heightCm, setHeightCm] = useState('')
    const [interBillonCm, setInterBillonCm] = useState('')

    // Tab 3: Irrigation & Cover
    const [irrigationLines, setIrrigationLines] = useState('1')
    const [dripperSpacingCm, setDripperSpacingCm] = useState('')
    const [dripperFlowRateLh, setDripperFlowRateLh] = useState('')
    const [mulching, setMulching] = useState<'none' | 'plastic_black' | 'plastic_transparent' | 'organic_straw' | 'plastic_white' | ''>('')
    const [soilNotes, setSoilNotes] = useState('')
    const [isControlGroup, setIsControlGroup] = useState(false)

    // Real-time Calculations
    const [calculatedDensity, setCalculatedDensity] = useState<number | null>(null)
    const [calculatedWaterFlow, setCalculatedWaterFlow] = useState<number | null>(null)

    useEffect(() => {
        async function getNextNumber() {
            const { data } = await supabase
                .from('billon_cycles')
                .select('cycle_number')
                .eq('billon_id', billonId)
                .order('cycle_number', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (data) setNextCycleNumber(data.cycle_number + 1)
        }
        getNextNumber()
    }, [billonId])

    // Calculate Sowing Density
    useEffect(() => {
        const interM = parseFloat(interBillonCm) / 100
        const ecartM = parseFloat(ecartementSurRangCm) / 100
        if (interM && ecartM) {
            const baseDensity = 1 / (interM * ecartM)
            let density = baseDensity
            if (semisLayout === 'double_rang') density = baseDensity * 2
            else if (semisLayout === 'quinconce') density = baseDensity * 1.15
            setCalculatedDensity(parseFloat(density.toFixed(2)))
        } else {
            setCalculatedDensity(null)
        }
    }, [interBillonCm, ecartementSurRangCm, semisLayout])

    // Calculate Water Flow Rate
    useEffect(() => {
        const lines = parseInt(irrigationLines)
        const spacingM = parseFloat(dripperSpacingCm) / 100
        const flow = parseFloat(dripperFlowRateLh)
        if (lines && spacingM && flow) {
            const flowPerMeter = (flow * lines) / spacingM
            setCalculatedWaterFlow(parseFloat(flowPerMeter.toFixed(2)))
        } else {
            setCalculatedWaterFlow(null)
        }
    }, [irrigationLines, dripperSpacingCm, dripperFlowRateLh])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: cycle, error: cycleError } = await supabase
                .from('billon_cycles')
                .insert({
                    billon_id: billonId,
                    cycle_number: nextCycleNumber,
                    target_crop: targetCrop.trim() || null,
                    crop_variety: cropVariety.trim() || null,
                    planting_date: plantingDate || null,
                    growing_cycle_days: growingCycleDays ? parseInt(growingCycleDays) : null,
                    mode_semis: modeSemis || null,
                    semis_layout: semisLayout || null,
                    ecartement_sur_rang_cm: ecartementSurRangCm ? parseFloat(ecartementSurRangCm) : null,
                    length_m: lengthM ? parseFloat(lengthM) : null,
                    width_top_cm: widthTopCm ? parseFloat(widthTopCm) : null,
                    height_cm: heightCm ? parseFloat(heightCm) : null,
                    inter_billon_cm: interBillonCm ? parseFloat(interBillonCm) : null,
                    irrigation_lines: irrigationLines ? parseInt(irrigationLines) : 1,
                    dripper_spacing_cm: dripperSpacingCm ? parseFloat(dripperSpacingCm) : null,
                    dripper_flow_rate_lh: dripperFlowRateLh ? parseFloat(dripperFlowRateLh) : null,
                    irrigation_system: 'goutte_a_goutte',
                    mulching: mulching || null,
                    soil_notes: soilNotes.trim() || null,
                    is_control_group: isControlGroup,
                    status: 'active'
                })
                .select()
                .single()

            if (cycleError) throw cycleError

            const { error: updateError } = await supabase
                .from('billons')
                .update({ active_cycle_id: cycle.id, status: 'planted', updated_at: new Date().toISOString() })
                .eq('id', billonId)

            if (updateError) throw updateError

            setSuccess(true)
            onStarted()
            setTimeout(onClose, 1500)
        } catch (error: any) {
            console.error('Error starting cycle:', error)
            alert(`${t('common.error')}: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    const inputClass = "w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
    const labelClass = "block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1"

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('common.success')}</h3>
                </motion.div>
            </div>
        )
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700 flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Play className="h-6 w-6 text-white ml-0.5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('billons.start_cycle')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('billons.cycle_n', { n: nextCycleNumber })} — المنصة الشاملة لمواصفات الدورة</p>
                            </div>
                        </div>
                        <button onClick={onClose} type="button" className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-900/30 px-6 py-2 gap-2 flex-shrink-0">
                        {[
                            { id: 'plantation', label: 'المحصول والزراعة', icon: Sprout },
                            { id: 'dimensions', label: 'الأبعاد الهندسية', icon: Ruler },
                            { id: 'irrigation', label: 'الري والغطاء', icon: Droplets }
                        ].map((tab) => {
                            const Icon = tab.icon
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                        active
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="px-8 py-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800">

                            {/* Tab 1: Plantation */}
                            {activeTab === 'plantation' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Culture Cible (المحصول المستهدف)</label>
                                            <input type="text" value={targetCrop} onChange={(e) => setTargetCrop(e.target.value)}
                                                className={inputClass} placeholder="Ex: Tomate, Oignon..." />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Variété / Cultivar (الصنف)</label>
                                            <input type="text" value={cropVariety} onChange={(e) => setCropVariety(e.target.value)}
                                                className={inputClass} placeholder="Ex: Roma VF, F1 San Marzano..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>{t('billons.planting_date')}</label>
                                            <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t('billons.growing_cycle')} (يوم)</label>
                                            <input type="number" min="0" value={growingCycleDays} onChange={(e) => setGrowingCycleDays(e.target.value)}
                                                className={inputClass} placeholder="Ex: 90" />
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClass}>نمط الإكثار (Semis)</label>
                                            <select value={modeSemis} onChange={(e: any) => setModeSemis(e.target.value)}
                                                className={`${inputClass} appearance-none cursor-pointer`}>
                                                <option value="">-- Sélectionner --</option>
                                                <option value="direct">بذور مباشرة (Direct)</option>
                                                <option value="plant">شتلات (Plants)</option>
                                                <option value="bulbe">أبصال (Bulbes)</option>
                                                <option value="bouture">عقل (Boutures)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>هندسة الصفوف (Layout)</label>
                                            <select value={semisLayout} onChange={(e: any) => setSemisLayout(e.target.value)}
                                                className={`${inputClass} appearance-none cursor-pointer`}>
                                                <option value="">-- Sélectionner --</option>
                                                <option value="monorang">صف واحد (Mono)</option>
                                                <option value="double_rang">صف مزدوج (Double)</option>
                                                <option value="quinconce">رجل الغراب (Quinconce)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>تباعد بين النباتات (cm)</label>
                                            <input type="number" min="0" step="1" value={ecartementSurRangCm}
                                                onChange={(e) => setEcartementSurRangCm(e.target.value)}
                                                className={inputClass} placeholder="Ex: 30" />
                                        </div>
                                    </div>

                                    {/* Live Density Badge */}
                                    {calculatedDensity !== null && (
                                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex items-start gap-4">
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                                                <Sprout className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-green-800 dark:text-green-400 uppercase tracking-wider mb-1">الكثافة الزراعية المحسوبة تلقائياً</h5>
                                                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                                    النظام يقدر كثافة الغرس بـ <span className="font-black text-lg">{calculatedDensity}</span> نبات في المتر المربع (Plant/m²).
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Tab 2: Dimensions */}
                            {activeTab === 'dimensions' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                                        أدخل الأبعاد الهندسية للمصطبة المعتمدة خلال هذه الدورة الزراعية. يمكن تغييرها مع كل دورة جديدة حسب المحصول.
                                    </p>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelClass}>الطول (m) — Longueur</label>
                                            <input type="number" min="0" step="0.1" value={lengthM} onChange={(e) => setLengthM(e.target.value)}
                                                className={inputClass} placeholder="Ex: 25" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>عرض القمة (cm) — Largeur Sommet</label>
                                            <input type="number" min="0" step="1" value={widthTopCm} onChange={(e) => setWidthTopCm(e.target.value)}
                                                className={inputClass} placeholder="Ex: 80" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>الارتفاع (cm) — Hauteur</label>
                                            <input type="number" min="0" step="1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                                                className={inputClass} placeholder="Ex: 25" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>التباعد بين المصاطب (cm)</label>
                                            <input type="number" min="0" step="1" value={interBillonCm} onChange={(e) => setInterBillonCm(e.target.value)}
                                                className={inputClass} placeholder="Ex: 40" />
                                        </div>
                                    </div>

                                    {/* Computed area preview */}
                                    {lengthM && widthTopCm && (
                                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 flex items-start gap-4">
                                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                                                <Ruler className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">المساحة المحسوبة تلقائياً</h5>
                                                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                                    المساحة التقديرية = <span className="font-black text-lg">{(parseFloat(lengthM) * parseFloat(widthTopCm) / 100).toFixed(2)}</span> م² (m²)
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Tab 3: Irrigation & Cover */}
                            {activeTab === 'irrigation' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>نظام الري</label>
                                            <div className="w-full px-5 py-4 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 dark:text-white rounded-2xl text-sm font-black text-amber-800 dark:text-amber-400 flex items-center gap-2">
                                                <Droplets className="h-4.5 w-4.5 text-amber-500" />
                                                Goutte-à-goutte (تنقيط)
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>غطاء التربة (Mulching)</label>
                                            <select value={mulching} onChange={(e: any) => setMulching(e.target.value)}
                                                className={`${inputClass} appearance-none cursor-pointer`}>
                                                <option value="">-- Sélectionner --</option>
                                                <option value="none">تربة عارية (Aucun)</option>
                                                <option value="plastic_black">بلاستيك أسود (Noir)</option>
                                                <option value="plastic_white">بلاستيك أبيض (Blanc)</option>
                                                <option value="plastic_transparent">بلاستيك شفاف (Transparent)</option>
                                                <option value="organic_straw">قش عضوي (Paille)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
                                    <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">خصائص أنابيب الري والمنقطات</h4>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClass}>عدد الأنابيب (Lines)</label>
                                            <input type="number" min="1" step="1" value={irrigationLines} onChange={(e) => setIrrigationLines(e.target.value)}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>تباعد المنقطات (cm)</label>
                                            <input type="number" min="0" step="1" value={dripperSpacingCm} onChange={(e) => setDripperSpacingCm(e.target.value)}
                                                className={inputClass} placeholder="Ex: 30" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>تدفق المنقط (L/h)</label>
                                            <input type="number" min="0" step="0.1" value={dripperFlowRateLh} onChange={(e) => setDripperFlowRateLh(e.target.value)}
                                                className={inputClass} placeholder="Ex: 2.2" />
                                        </div>
                                    </div>

                                    {/* Live Water Flow Badge */}
                                    {calculatedWaterFlow !== null && (
                                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex items-start gap-4">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                <Droplets className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">الاحتياج التدفقي للمتر الخطي</h5>
                                                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                    معدل التدفق التقديري هو <span className="font-black text-lg">{calculatedWaterFlow}</span> لتر في الساعة لكل متر طولي (L/h/m).
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />

                                    <div>
                                        <label className={labelClass}>ملاحظات وخصائص التربة (Soil Notes)</label>
                                        <textarea value={soilNotes} onChange={(e) => setSoilNotes(e.target.value)} rows={2}
                                            className={`${inputClass} resize-none`}
                                            placeholder="Ex: تربة رملية طينية، نسبة رطوبة ممتازة..." />
                                    </div>

                                    {/* Control Group Toggle */}
                                    <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                                                🧪
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">هل هذا خط شاهد (Témoin) ؟</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium max-w-sm mt-1">
                                                    تفعيل هذا الخيار يعزل هذا الخط ليصبح خط مقارنة زراعية.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input type="checkbox" checked={isControlGroup}
                                                onChange={(e) => setIsControlGroup(e.target.checked)}
                                                className="sr-only peer" />
                                            <div className="w-16 h-9 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                                        </label>
                                    </div>
                                </motion.div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0 flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-300 transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="px-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white h-16 rounded-2xl font-black text-md hover:shadow-2xl hover:shadow-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Play className="h-6 w-6" />
                                        إطلاق الدورة الزراعية
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
