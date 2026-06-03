import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import ImageUpload from './ImageUpload'
import CustomSelect from './CustomSelect'
import { X, Loader2, Check, ClipboardList, Send, ShieldAlert, Info, Wind, Thermometer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIVITY_TYPES = [
    { id: 'irrigation',    emoji: '💧', color: 'blue' },
    { id: 'fertilization', emoji: '🌱', color: 'emerald' },
    { id: 'pest_control',  emoji: '🛡️', color: 'amber' },
] as const

type ActivityTypeId = typeof ACTIVITY_TYPES[number]['id']

interface AddBillonActivityModalProps {
    billonId: string
    onClose: () => void
    onAdded: () => void
}

export default function AddBillonActivityModal({ billonId, onClose, onAdded }: AddBillonActivityModalProps) {
    const { t } = useTranslation()
    const [type, setType] = useState<ActivityTypeId>(ACTIVITY_TYPES[0].id)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Treatment-specific states
    const [treatmentType, setTreatmentType] = useState<'preventative' | 'curative'>('preventative')
    const [treatmentCategory, setTreatmentCategory] = useState<string>('biocontrol')
    const [targetPest, setTargetPest] = useState('')
    const [productName, setProductName] = useState('')
    const [activeIngredient, setActiveIngredient] = useState('')
    const [applicationMethod, setApplicationMethod] = useState<'foliar_spray' | 'irrigation_injection' | 'soil_drench'>('foliar_spray')
    const [dosageValue, setDosageValue] = useState('')
    const [dosageUnit, setDosageUnit] = useState<'ml_l' | 'g_l' | 'l_ha' | 'kg_ha'>('ml_l')
    const [waterVolumeL, setWaterVolumeL] = useState('')
    const [phiDays, setPhiDays] = useState('0')
    const [operatorName, setOperatorName] = useState('')
    const [windCondition, setWindCondition] = useState<'low' | 'medium' | 'high'>('low')
    const [temperatureC, setTemperatureC] = useState('')
    const [ppeWorn, setPpeWorn] = useState(false)

    // Irrigation-specific states
    interface CycleSpec {
        length_m: number | null
        irrigation_lines: number | null
        dripper_spacing_cm: number | null
        dripper_flow_rate_lh: number | null
    }

    const [activeCycleSpec, setActiveCycleSpec] = useState<CycleSpec | null>(null)
    const [durationMinutes, setDurationMinutes] = useState<string>('')
    const [manualVolumeLiters, setManualVolumeLiters] = useState<string>('')
    const [isManualVolume, setIsManualVolume] = useState<boolean>(false)

    // Fertilization-specific states
    const [fertilizationType, setFertilizationType] = useState<'fertigation' | 'foliar' | 'soil'>('fertigation')
    const [fertProductName, setFertProductName] = useState('')
    const [fertNpkRatio, setFertNpkRatio] = useState('')
    const [fertDosageValue, setFertDosageValue] = useState('')
    const [fertDosageUnit, setFertDosageUnit] = useState<'kg_ha' | 'g_tree' | 'g_l' | 'ml_l' | 'kg_total'>('kg_total')
    const [fertWaterVolumeL, setFertWaterVolumeL] = useState('')
    const [fertPhValue, setFertPhValue] = useState('')
    const [fertEcValue, setFertEcValue] = useState('')
    const [fertOperatorName, setFertOperatorName] = useState('')

    // Derived states
    const hasFullSpecs = activeCycleSpec !== null && 
        activeCycleSpec.length_m !== null && 
        activeCycleSpec.irrigation_lines !== null && 
        activeCycleSpec.dripper_spacing_cm !== null && 
        activeCycleSpec.dripper_flow_rate_lh !== null && 
        activeCycleSpec.dripper_spacing_cm > 0;

    const effectiveManual = isManualVolume || !hasFullSpecs

    // Fetch Billon active cycle details on mount
    useEffect(() => {
        async function fetchBillonSpecs() {
            if (!billonId) return
            try {
                const { data: billon, error: bErr } = await supabase
                    .from('billons')
                    .select('active_cycle_id')
                    .eq('id', billonId)
                    .single()
                if (bErr) throw bErr
                if (billon && billon.active_cycle_id) {
                    const { data: cycle, error: cErr } = await supabase
                        .from('billon_cycles')
                        .select('length_m, irrigation_lines, dripper_spacing_cm, dripper_flow_rate_lh')
                        .eq('id', billon.active_cycle_id)
                        .single()
                    if (cErr) throw cErr
                    if (cycle) {
                        setActiveCycleSpec(cycle)
                    }
                }
            } catch (e) {
                console.error('Error fetching billon active cycle specs:', e)
            }
        }
        fetchBillonSpecs()
    }, [billonId])

    const getBillonIrrigationCalculations = () => {
        if (!hasFullSpecs) return null
        const { length_m, dripper_spacing_cm, irrigation_lines, dripper_flow_rate_lh } = activeCycleSpec!
        const drippersCount = Math.round(((length_m! * 100) / dripper_spacing_cm!) * irrigation_lines!)
        const totalFlowRateLh = drippersCount * dripper_flow_rate_lh!
        
        let estimatedVolumeLiters = 0
        const dur = parseFloat(durationMinutes)
        if (!isNaN(dur)) {
            estimatedVolumeLiters = totalFlowRateLh * (dur / 60)
        }
        
        return {
            drippersCount,
            totalFlowRateLh,
            estimatedVolumeLiters
        }
    }
    
    const calcs = getBillonIrrigationCalculations()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            let image_url = null
            if (imageFile) {
                image_url = await uploadImage(imageFile, 'operations-images')
            }

            let notesValue = notes.trim();
            if (type === 'pest_control') {
                const treatmentData = {
                    is_structured_treatment: true,
                    treatment_type: treatmentType,
                    treatment_category: treatmentCategory,
                    target_pest: targetPest.trim(),
                    product_name: productName.trim(),
                    active_ingredient: activeIngredient.trim(),
                    application_method: applicationMethod,
                    dosage_value: dosageValue ? parseFloat(dosageValue) : null,
                    dosage_unit: dosageUnit,
                    water_volume_l: waterVolumeL ? parseFloat(waterVolumeL) : null,
                    phi_days: phiDays ? parseInt(phiDays) : 0,
                    operator_name: operatorName.trim(),
                    wind_condition: windCondition,
                    temperature_c: temperatureC ? parseFloat(temperatureC) : null,
                    ppe_worn: ppeWorn,
                    notes: notes.trim()
                };
                notesValue = JSON.stringify(treatmentData);
            } else if (type === 'irrigation') {
                const dur = parseFloat(durationMinutes)
                const estVolume = effectiveManual 
                    ? (manualVolumeLiters ? parseFloat(manualVolumeLiters) : 0)
                    : (calcs?.estimatedVolumeLiters || 0)
                
                const irrigationData = {
                    is_structured_irrigation: true,
                    duration_minutes: isNaN(dur) ? null : dur,
                    estimated_volume_liters: estVolume,
                    is_manual: effectiveManual,
                    length_m: activeCycleSpec?.length_m || null,
                    irrigation_lines: activeCycleSpec?.irrigation_lines || null,
                    dripper_spacing_cm: activeCycleSpec?.dripper_spacing_cm || null,
                    dripper_flow_rate_lh: activeCycleSpec?.dripper_flow_rate_lh || null,
                    notes: notes.trim()
                }
                notesValue = JSON.stringify(irrigationData)
            } else if (type === 'fertilization') {
                const fertilizationData = {
                    is_structured_fertilization: true,
                    fertilization_type: fertilizationType,
                    product_name: fertProductName.trim(),
                    npk_ratio: fertNpkRatio.trim(),
                    dosage_value: fertDosageValue ? parseFloat(fertDosageValue) : null,
                    dosage_unit: fertDosageUnit,
                    water_volume_l: (fertilizationType === 'fertigation' || fertilizationType === 'foliar') && fertWaterVolumeL ? parseFloat(fertWaterVolumeL) : null,
                    ph_value: (fertilizationType === 'fertigation' || fertilizationType === 'foliar') && fertPhValue ? parseFloat(fertPhValue) : null,
                    ec_value: (fertilizationType === 'fertigation' || fertilizationType === 'foliar') && fertEcValue ? parseFloat(fertEcValue) : null,
                    operator_name: fertOperatorName.trim(),
                    notes: notes.trim()
                }
                notesValue = JSON.stringify(fertilizationData)
            }

            const { error } = await supabase
                .from('billon_activities')
                .insert({
                    billon_id: billonId,
                    activity_type: type,
                    notes: notesValue || null,
                    image_url,
                    performed_at: new Date().toISOString()
                })

            if (error) throw error

            setSuccess(true)
            onAdded()
            setTimeout(onClose, 1500)
        } catch (error: any) {
            console.error('Error adding billon activity:', error)
            alert(`${t('common.error')}: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl"
                >
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
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700 flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <ClipboardList className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('billons.add_activity')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('dashboard.subtitle')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <div className="p-8 overflow-y-auto flex-grow bg-white dark:bg-gray-800">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Column: Activity Type Selection */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 px-1">{t('billons.activity_type')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ACTIVITY_TYPES.map(({ id: actId, emoji, color }) => {
                                            const isSelected = type === actId
                                            const colorMap: Record<string, string> = {
                                                blue:    isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-4 ring-blue-500/10'    : 'border-gray-100 dark:border-gray-700 text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 hover:border-blue-200',
                                                emerald: isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-4 ring-emerald-500/10' : 'border-gray-100 dark:border-gray-700 text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 hover:border-emerald-200',
                                                amber:   isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-4 ring-amber-500/10'   : 'border-gray-100 dark:border-gray-700 text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 hover:border-amber-200',
                                            }
                                            return (
                                                <motion.button
                                                    key={actId}
                                                    type="button"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setType(actId)}
                                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center h-24 ${colorMap[color]}`}
                                                >
                                                    <span className="text-2xl mb-1">{emoji}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight">
                                                        {t(`quick_log.types.${actId}`, { defaultValue: actId })}
                                                    </span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: Notes + Image or Treatment Form */}
                                <div className="space-y-8">
                                    {type === 'pest_control' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-amber-50/30 dark:bg-amber-950/15 p-6 rounded-[2rem] border border-amber-200/50 dark:border-amber-900/30 space-y-6"
                                        >
                                            <div className="flex items-center gap-3 border-b border-amber-200/30 dark:border-amber-900/20 pb-4">
                                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                                    <ShieldAlert className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-wide">
                                                        {t('treatment.title')}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500">
                                                        {t('treatment.academic_banner', { defaultValue: 'Ferme de recherche académique - Formulaire de traitement standard' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Row 1: Intervention Type & Category */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.type')}</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setTreatmentType('preventative')}
                                                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all ${
                                                                treatmentType === 'preventative'
                                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                                                                    : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-800'
                                                            }`}
                                                        >
                                                            {t('treatment.preventative')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setTreatmentType('curative')}
                                                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all ${
                                                                treatmentType === 'curative'
                                                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                                                    : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-800'
                                                            }`}
                                                        >
                                                            {t('treatment.curative')}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.category')}</label>
                                                    <CustomSelect
                                                        value={treatmentCategory}
                                                        onChange={setTreatmentCategory}
                                                        options={[
                                                            { value: 'biocontrol', emoji: '🦠', label: 'Biocontrôle', description: 'Lutte biologique' },
                                                            { value: 'natural_pesticide', emoji: '🌿', label: 'Traitement Bio', description: 'Pesticide naturel' },
                                                            { value: 'fungicide', emoji: '🍄', label: 'Fongicide', description: 'Traitement anti-fongique' },
                                                            { value: 'insecticide', emoji: '🐛', label: 'Insecticide', description: 'Cible les insectes ravageurs' },
                                                            { value: 'herbicide', emoji: '🌾', label: 'Herbicide', description: 'Gestion des adventices' },
                                                            { value: 'acaricide', emoji: '🕷️', label: 'Acaricide', description: 'Cible les acariens' },
                                                            { value: 'foliar_fertilizer', emoji: '🍃', label: 'Engrais foliaire', description: 'Apport nutritionnel foliaire' },
                                                            { value: 'biostimulant', emoji: '⚡', label: 'Biostimulant', description: 'Activation métabolique' },
                                                            { value: 'other', emoji: '📦', label: 'Autre', description: 'Autre type de traitement' },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 2: Target & Product Name */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.target_pest')}</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={targetPest}
                                                        onChange={(e) => setTargetPest(e.target.value)}
                                                        placeholder={t('treatment.target_pest_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.product_name')}</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={productName}
                                                        onChange={(e) => setProductName(e.target.value)}
                                                        placeholder={t('treatment.product_name_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 3: Active Ingredient & Application Method */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.active_ingredient')}</label>
                                                    <input
                                                        type="text"
                                                        value={activeIngredient}
                                                        onChange={(e) => setActiveIngredient(e.target.value)}
                                                        placeholder={t('treatment.active_ingredient_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.application_method')}</label>
                                                    <CustomSelect
                                                        value={applicationMethod}
                                                        onChange={(v: any) => setApplicationMethod(v)}
                                                        options={[
                                                            { value: 'foliar_spray', emoji: '💧', label: 'Pulvérisation foliaire', description: 'Application sur le feuillage' },
                                                            { value: 'irrigation_injection', emoji: '🚿', label: 'Injection irrigation', description: 'Fertigation ou injection réseau' },
                                                            { value: 'soil_drench', emoji: '🌱', label: 'Drench sol', description: 'Application directe au collet' },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 4: Dosage & Water Volume */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.dosage')}</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            required
                                                            value={dosageValue}
                                                            onChange={(e) => setDosageValue(e.target.value)}
                                                            placeholder={t('treatment.dosage_placeholder')}
                                                            className="w-3/5 px-4 py-3.5 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all"
                                                        />
                                                        <CustomSelect
                                                            compact
                                                            value={dosageUnit}
                                                            onChange={(v: any) => setDosageUnit(v)}
                                                            options={[
                                                                { value: 'ml_l', label: 'ml/L' },
                                                                { value: 'g_l', label: 'g/L' },
                                                                { value: 'l_ha', label: 'L/ha' },
                                                                { value: 'kg_ha', label: 'kg/ha' },
                                                            ]}
                                                            className="w-2/5"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.water_volume')}</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={waterVolumeL}
                                                        onChange={(e) => setWaterVolumeL(e.target.value)}
                                                        placeholder={t('treatment.water_volume_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 5: PHI Days & Operator Name */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.phi_days')}</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={phiDays}
                                                        onChange={(e) => setPhiDays(e.target.value)}
                                                        placeholder={t('treatment.phi_days_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('treatment.operator_name')}</label>
                                                    <input
                                                        type="text"
                                                        value={operatorName}
                                                        onChange={(e) => setOperatorName(e.target.value)}
                                                        placeholder={t('treatment.operator_name_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Real-time Safe Harvest Preview */}
                                            {parseInt(phiDays || '0') > 0 && (
                                                <motion.div
                                                    initial={{ scale: 0.95, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3"
                                                >
                                                    <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">
                                                            {t('treatment.safe_harvest_date')}
                                                        </h5>
                                                        <p className="text-xs font-bold text-orange-800 dark:text-orange-300">
                                                            {new Date(Date.now() + parseInt(phiDays) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Row 6: Weather conditions */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200/20">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                        <Wind className="h-3.5 w-3.5 text-amber-500" /> {t('treatment.wind_condition')}
                                                    </label>
                                                    <CustomSelect
                                                        value={windCondition}
                                                        onChange={(v: any) => setWindCondition(v)}
                                                        options={[
                                                            { value: 'low', emoji: '🍃', label: 'Faible (Calme)', color: 'text-green-700' },
                                                            { value: 'medium', emoji: '💨', label: 'Modéré', color: 'text-amber-700' },
                                                            { value: 'high', emoji: '⚠️', label: 'Fort — Éviter de traiter', color: 'text-red-700' },
                                                        ]}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                        <Thermometer className="h-3.5 w-3.5 text-amber-500" /> {t('treatment.temperature')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={temperatureC}
                                                        onChange={(e) => setTemperatureC(e.target.value)}
                                                        placeholder={t('treatment.temperature_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Checkbox PPE */}
                                            <div className="flex items-center gap-3 pt-2">
                                                <input
                                                    type="checkbox"
                                                    id="ppe_worn"
                                                    checked={ppeWorn}
                                                    onChange={(e) => setPpeWorn(e.target.checked)}
                                                    className="w-5 h-5 rounded-lg border-gray-200 dark:border-gray-700 text-green-600 focus:ring-green-500/20 cursor-pointer"
                                                />
                                                <label htmlFor="ppe_worn" className="text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                                                    {t('treatment.ppe_worn')}
                                                </label>
                                            </div>

                                            {/* Standard notes field inside treatment */}
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('billons.notes')}</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-xs font-bold resize-none dark:placeholder:text-gray-600"
                                                    placeholder={t('billons.notes_placeholder')}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {type === 'irrigation' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-blue-50/30 dark:bg-blue-950/15 p-6 rounded-[2rem] border border-blue-200/50 dark:border-blue-900/30 space-y-6"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center gap-3 border-b border-blue-200/30 dark:border-blue-900/20 pb-4">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                                                    <ClipboardList className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-blue-900 dark:text-blue-400 uppercase tracking-wide">
                                                        {t('irrigation_calculator.title')}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500">
                                                        {t('irrigation_calculator.academic_banner')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Specifications summary */}
                                            {hasFullSpecs && (
                                                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                                                    <h5 className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[10px]">
                                                        {t('irrigation_calculator.billon_specs_summary')}
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-2 font-bold text-gray-600 dark:text-gray-400">
                                                        <div>{t('irrigation_calculator.billon_length')}: <span className="text-gray-950 dark:text-white font-black">{activeCycleSpec.length_m} m</span></div>
                                                        <div>{t('irrigation_calculator.irrigation_lines')}: <span className="text-gray-950 dark:text-white font-black">{activeCycleSpec.irrigation_lines}</span></div>
                                                        <div>{t('irrigation_calculator.dripper_spacing')}: <span className="text-gray-950 dark:text-white font-black">{activeCycleSpec.dripper_spacing_cm} cm</span></div>
                                                        <div>{t('irrigation_calculator.dripper_flow_rate')}: <span className="text-gray-950 dark:text-white font-black">{activeCycleSpec.dripper_flow_rate_lh} L/h</span></div>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                                                        <span>{t('irrigation_calculator.drippers_count')}:</span>
                                                        <span className="font-black text-gray-950 dark:text-white">{calcs?.drippersCount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{t('irrigation_calculator.total_flow_rate')}:</span>
                                                        <span className="font-black text-gray-950 dark:text-white">{calcs?.totalFlowRateLh} L/h</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Manual input toggle if specs are present */}
                                            {hasFullSpecs && (
                                                <div className="flex items-center gap-3 justify-end">
                                                    <input
                                                        type="checkbox"
                                                        id="manual_irrigation_toggle_billon"
                                                        checked={isManualVolume}
                                                        onChange={(e) => setIsManualVolume(e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                                    />
                                                    <label htmlFor="manual_irrigation_toggle_billon" className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                                                        {t('irrigation_calculator.manual_input_notice')}
                                                    </label>
                                                </div>
                                            )}

                                            {!effectiveManual ? (
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                        {t('irrigation_calculator.duration_minutes')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        min="1"
                                                        required
                                                        value={durationMinutes}
                                                        onChange={(e) => setDurationMinutes(e.target.value)}
                                                        placeholder={t('irrigation_calculator.duration_minutes_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-blue-500 transition-all"
                                                    />
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {['15', '30', '45', '60'].map(min => (
                                                            <button
                                                                key={min}
                                                                type="button"
                                                                onClick={() => setDurationMinutes(min)}
                                                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[10px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                            >
                                                                {min} min
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {!hasFullSpecs && (
                                                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400">
                                                            ⚠️ {t('irrigation_calculator.no_active_cycle')}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                            {t('irrigation_calculator.manual_liters')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            min="1"
                                                            required
                                                            value={manualVolumeLiters}
                                                            onChange={(e) => setManualVolumeLiters(e.target.value)}
                                                            placeholder={t('irrigation_calculator.manual_liters_placeholder')}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-blue-500 transition-all"
                                                        />
                                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                                            {['50', '100', '250', '500'].map(liters => (
                                                                <button
                                                                    key={liters}
                                                                    type="button"
                                                                    onClick={() => setManualVolumeLiters(liters)}
                                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[10px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                                >
                                                                    {liters} L
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Estimated Volume Card */}
                                            {((!effectiveManual && durationMinutes) || (effectiveManual && manualVolumeLiters)) && (
                                                <motion.div
                                                    initial={{ scale: 0.95, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between"
                                                >
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                                                            {t('irrigation_calculator.estimated_volume')}
                                                        </h5>
                                                        <p className="text-2xl font-black text-blue-900 dark:text-blue-300">
                                                            {effectiveManual 
                                                                ? `${parseFloat(manualVolumeLiters).toLocaleString()} ${t('irrigation_calculator.liters')}`
                                                                : `${Math.round(calcs?.estimatedVolumeLiters || 0).toLocaleString()} ${t('irrigation_calculator.liters')}`
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase">
                                                            {effectiveManual
                                                                ? `${(parseFloat(manualVolumeLiters) / 1000).toFixed(2)} ${t('irrigation_calculator.m3')}`
                                                                : `${((calcs?.estimatedVolumeLiters || 0) / 1000).toFixed(2)} ${t('irrigation_calculator.m3')}`
                                                            }
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Standard notes field inside irrigation */}
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                    {t('irrigation_calculator.notes_title')}
                                                </label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-bold resize-none dark:placeholder:text-gray-600"
                                                    placeholder="Détails de l'irrigation..."
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {type === 'fertilization' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-amber-50/30 dark:bg-amber-950/15 p-6 rounded-[2rem] border border-amber-200/50 dark:border-amber-900/30 space-y-6"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center gap-3 border-b border-amber-200/30 dark:border-amber-900/20 pb-4">
                                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                                    <span className="text-xl">🌱</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-wide">
                                                        {t('fertilization.title')}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500">
                                                        {t('fertilization.academic_banner')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Fertilization Type Tabs */}
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3">
                                                    {t('fertilization.type')}
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['fertigation', 'foliar', 'soil'] as const).map((tId) => {
                                                        const isSel = fertilizationType === tId;
                                                        const emoji = tId === 'fertigation' ? '🚿' : tId === 'foliar' ? '🍃' : '🪵';
                                                        return (
                                                            <button
                                                                key={tId}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFertilizationType(tId);
                                                                    // Update default unit based on selected type
                                                                    if (tId === 'fertigation') setFertDosageUnit('kg_total');
                                                                    else if (tId === 'foliar') setFertDosageUnit('g_l');
                                                                    else if (tId === 'soil') setFertDosageUnit('kg_ha');
                                                                }}
                                                                className={`py-3 px-2 rounded-xl text-center border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                                                    isSel
                                                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/10'
                                                                        : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-amber-300'
                                                                }`}
                                                            >
                                                                <span className="text-lg">{emoji}</span>
                                                                <span className="text-[9px] uppercase tracking-wider">{t(`fertilization.types.${tId}`)}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Commercial Name & NPK Ratio */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                        {t('fertilization.product_name')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={fertProductName}
                                                        onChange={(e) => setFertProductName(e.target.value)}
                                                        placeholder={t('fertilization.product_name_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                        {t('fertilization.npk_ratio')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={fertNpkRatio}
                                                        onChange={(e) => setFertNpkRatio(e.target.value)}
                                                        placeholder={t('fertilization.npk_ratio_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                    />
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {['20-20-20', '15-15-15', '19-19-19', '0-0-50'].map(ratio => (
                                                            <button
                                                                key={ratio}
                                                                type="button"
                                                                onClick={() => setFertNpkRatio(ratio)}
                                                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[10px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                            >
                                                                {ratio}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dosage Value & Unit */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                        {t('fertilization.dosage')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.01"
                                                        min="0.01"
                                                        required
                                                        value={fertDosageValue}
                                                        onChange={(e) => setFertDosageValue(e.target.value)}
                                                        placeholder={t('fertilization.dosage_placeholder')}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                    />
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {['0.5', '1', '2', '5', '10'].map(val => (
                                                            <button
                                                                key={val}
                                                                type="button"
                                                                onClick={() => setFertDosageValue(val)}
                                                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[10px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                            >
                                                                {val}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                        {t('fertilization.dosage_unit')}
                                                    </label>
                                                    <select
                                                        value={fertDosageUnit}
                                                        onChange={(e: any) => setFertDosageUnit(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                                                    >
                                                        {fertilizationType === 'fertigation' && (
                                                            <>
                                                                <option value="kg_total">{t('fertilization.units.kg_total')}</option>
                                                                <option value="g_l">{t('fertilization.units.g_l')}</option>
                                                            </>
                                                        )}
                                                        {fertilizationType === 'foliar' && (
                                                            <>
                                                                <option value="g_l">{t('fertilization.units.g_l')}</option>
                                                                <option value="ml_l">{t('fertilization.units.ml_l')}</option>
                                                                <option value="kg_total">{t('fertilization.units.kg_total')}</option>
                                                            </>
                                                        )}
                                                        {fertilizationType === 'soil' && (
                                                            <>
                                                                <option value="kg_ha">{t('fertilization.units.kg_ha')}</option>
                                                                <option value="g_tree">{t('fertilization.units.g_tree')}</option>
                                                                <option value="kg_total">{t('fertilization.units.kg_total')}</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Water Volume, pH & EC (For fertigation & foliar spraying) */}
                                            {(fertilizationType === 'fertigation' || fertilizationType === 'foliar') && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                            {t('fertilization.water_volume')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            min="1"
                                                            required
                                                            value={fertWaterVolumeL}
                                                            onChange={(e) => setFertWaterVolumeL(e.target.value)}
                                                            placeholder={t('fertilization.water_volume_placeholder')}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                        />
                                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                                            {['100', '200', '500', '1000'].map(vol => (
                                                                <button
                                                                    key={vol}
                                                                    type="button"
                                                                    onClick={() => setFertWaterVolumeL(vol)}
                                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[9px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                                >
                                                                    {vol}L
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                            {t('fertilization.ph')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            step="0.1"
                                                            min="0"
                                                            max="14"
                                                            required
                                                            value={fertPhValue}
                                                            onChange={(e) => setFertPhValue(e.target.value)}
                                                            placeholder={t('fertilization.ph_placeholder')}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                        />
                                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                                            {['5.5', '6.0', '6.2', '6.5', '7.0'].map(ph => (
                                                                <button
                                                                    key={ph}
                                                                    type="button"
                                                                    onClick={() => setFertPhValue(ph)}
                                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[9px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                                >
                                                                    {ph}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                            {t('fertilization.ec')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            step="0.01"
                                                            min="0"
                                                            required
                                                            value={fertEcValue}
                                                            onChange={(e) => setFertEcValue(e.target.value)}
                                                            placeholder={t('fertilization.ec_placeholder')}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                        />
                                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                                            {['1.0', '1.4', '1.8', '2.2'].map(ec => (
                                                                <button
                                                                    key={ec}
                                                                    type="button"
                                                                    onClick={() => setFertEcValue(ec)}
                                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg text-[9px] font-black text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800"
                                                                >
                                                                    {ec}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Operator Name */}
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                                    {t('fertilization.operator')}
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={fertOperatorName}
                                                    onChange={(e) => setFertOperatorName(e.target.value)}
                                                    placeholder={t('fertilization.operator_placeholder')}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-amber-500 transition-all"
                                                />
                                            </div>

                                            {/* Standard notes field inside fertilization */}
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">{t('billons.notes')}</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:text-white rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-xs font-bold resize-none dark:placeholder:text-gray-600"
                                                    placeholder={t('billons.notes_placeholder')}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {type !== 'pest_control' && type !== 'irrigation' && type !== 'fertilization' && (
                                        <div className="space-y-4">
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('billons.notes')}</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={4}
                                                className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all h-32 resize-none text-sm font-bold dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                placeholder={t('billons.notes_placeholder')}
                                            />
                                        </div>
                                    )}

                                    {/* Photo Upload */}
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('quick_log.photo_proof')}</label>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-all min-h-[160px] flex items-center justify-center">
                                            <ImageUpload
                                                label={t('quick_log.photo_proof')}
                                                onFileSelect={(file) => { setImageFile(file); if (file) setPreviewUrl(URL.createObjectURL(file)) }}
                                                previewUrl={previewUrl}
                                                onClear={() => { setImageFile(null); setPreviewUrl(null) }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white h-16 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Send className="h-6 w-6" /> {t('billons.submit_activity')}</>}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
