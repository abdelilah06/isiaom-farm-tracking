import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, Save, Grid, Copy, Check, 
    Search, Filter, Loader2, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import type { BillonCycle } from '../types';

export default function BulkOperations() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Data states
    const [plots, setPlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Grid states
    const [gridData, setGridData] = useState<Array<{
        billonId: string;
        billonName: string;
        billonCode: string | null;
        plotId: string | null;
        plotName: string;
        status: string;
        hasActiveCycle: boolean;
        cycleId: string | null;
        
        // Sowing specs
        targetCrop: string;
        cropVariety: string;
        plantCount: string;
        modeSemis: 'direct' | 'plant' | 'bulbe' | 'bouture' | '';
        semisLayout: 'monorang' | 'double_rang' | 'quinconce' | '';
        mulching: 'none' | 'plastic_black' | 'plastic_transparent' | 'organic_straw' | 'plastic_white' | '';
        isControlGroup: boolean;
        soilNotes: string;

        // Irrigation specs
        lengthM: string;
        irrigationLines: string;
        dripperSpacingCm: string;
        dripperFlowRateLh: string;
        irrigationSystem: string;
    }>>([]);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

    // Bulk Apply values
    const [bulkField, setBulkField] = useState<string>('');
    const [bulkValue, setBulkValue] = useState<string>('');

    // Tab control ('grid' | 'activity')
    const [activeTab, setActiveTab] = useState<'grid' | 'activity'>('grid');

    // Bulk Activity state
    const [activityType, setActivityType] = useState<'irrigation' | 'fertilization' | 'pest_control'>('irrigation');
    const [activityLoading, setActivityLoading] = useState(false);
    const [activitySuccess, setActivitySuccess] = useState(false);

    // Bulk activity details
    const [notes, setNotes] = useState('');
    // Irrigation
    const [durationMinutes, setDurationMinutes] = useState('');
    const [manualVolumeLiters, setManualVolumeLiters] = useState('');
    const [isManualIrrigation] = useState(true);
    // Fertilization
    const [fertType, setFertType] = useState<'fertigation' | 'foliar' | 'soil'>('fertigation');
    const [fertProduct, setFertProduct] = useState('');
    const [fertNpk, setFertNpk] = useState('');
    const [fertDosage, setFertDosage] = useState('');
    const [fertUnit] = useState('kg_total');
    const [fertWaterVolume, setFertWaterVolume] = useState('');
    const [fertPh, setFertPh] = useState('');
    const [fertEc, setFertEc] = useState('');
    // Pest control
    const [pestType] = useState<'preventative' | 'curative'>('preventative');
    const [pestCategory] = useState('biocontrol');
    const [pestProduct, setPestProduct] = useState('');
    const [pestPest, setPestPest] = useState('');
    const [pestDosage, setPestDosage] = useState('');
    const [pestUnit] = useState('ml_l');
    const [pestWaterVolume, setPestWaterVolume] = useState('');
    const [pestPhi, setPestPhi] = useState('0');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [plotFilter, setPlotFilter] = useState('all');

    useEffect(() => {
        checkAuth();
        fetchInitialData();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
        if (profile?.role !== 'admin' && user.user_metadata?.role !== 'admin') {
            navigate('/');
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch plots
            const { data: plotData } = await supabase.from('plots').select('*').order('name');
            setPlots(plotData || []);

            // Fetch billons
            const { data: billonsData } = await supabase.from('billons').select('*').order('name');
            const bList = billonsData || [];

            // Fetch active cycles
            const activeCycleIds = bList.filter(b => b.active_cycle_id).map(b => b.active_cycle_id);
            let cycles: BillonCycle[] = [];
            if (activeCycleIds.length > 0) {
                const { data: cycleData } = await supabase
                    .from('billon_cycles')
                    .select('*')
                    .in('id', activeCycleIds);
                cycles = cycleData || [];
            }

            const cycleMap = new Map<string, BillonCycle>();
            cycles.forEach(c => cycleMap.set(c.billon_id, c));

            // Map to Grid Rows
            const rows = bList.map(b => {
                const c = cycleMap.get(b.id);
                const plot = (plotData || []).find(p => p.id === b.plot_id);
                return {
                    billonId: b.id,
                    billonName: b.name || '',
                    billonCode: b.billon_code,
                    plotId: b.plot_id,
                    plotName: plot ? plot.name : '---',
                    status: b.status,
                    hasActiveCycle: !!c,
                    cycleId: c ? c.id : null,
                    
                    targetCrop: c?.target_crop || '',
                    cropVariety: c?.crop_variety || '',
                    plantCount: c?.plant_count ? c.plant_count.toString() : '',
                    modeSemis: (c?.mode_semis || '') as any,
                    semisLayout: (c?.semis_layout || '') as any,
                    mulching: (c?.mulching || '') as any,
                    isControlGroup: c?.is_control_group || false,
                    soilNotes: c?.soil_notes || '',

                    lengthM: c?.length_m ? c.length_m.toString() : '',
                    irrigationLines: c?.irrigation_lines ? c.irrigation_lines.toString() : '1',
                    dripperSpacingCm: c?.dripper_spacing_cm ? c.dripper_spacing_cm.toString() : '',
                    dripperFlowRateLh: c?.dripper_flow_rate_lh ? c.dripper_flow_rate_lh.toString() : '',
                    irrigationSystem: c?.irrigation_system || 'goutte_a_goutte',
                };
            });

            setGridData(rows);
            // Default select all
            const initialSel: Record<string, boolean> = {};
            rows.forEach(r => { initialSel[r.billonId] = false; });
            setSelectedIds(initialSel);

        } catch (error) {
            console.error('Error fetching bulk data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered data for display
    const filteredRows = useMemo(() => {
        return gridData.filter(row => {
            const matchesSearch = row.billonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (row.billonCode && row.billonCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                row.targetCrop.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPlot = plotFilter === 'all' || row.plotId === plotFilter;
            return matchesSearch && matchesPlot;
        });
    }, [gridData, searchQuery, plotFilter]);

    // Handle Checkbox row selection
    const handleSelectRow = (billonId: string) => {
        setSelectedIds(prev => ({
            ...prev,
            [billonId]: !prev[billonId]
        }));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        const next: Record<string, boolean> = {};
        filteredRows.forEach(row => {
            next[row.billonId] = checked;
        });
        setSelectedIds(prev => ({ ...prev, ...next }));
    };

    // Number of selected billons
    const selectedCount = useMemo(() => {
        return Object.values(selectedIds).filter(Boolean).length;
    }, [selectedIds]);

    // Apply values in bulk to checked rows
    const handleBulkApply = () => {
        if (!bulkField) return;
        setGridData(prev => prev.map(row => {
            if (!selectedIds[row.billonId]) return row;
            return {
                ...row,
                [bulkField]: bulkValue
            };
        }));
    };

    // Handle Cell Edit
    const handleCellChange = (billonId: string, field: string, val: any) => {
        setGridData(prev => prev.map(row => {
            if (row.billonId !== billonId) return row;
            return {
                ...row,
                [field]: val
            };
        }));
    };

    // Batch Close Cycles
    const handleBulkCloseCycles = async () => {
        const checkedIds = Object.keys(selectedIds).filter(id => selectedIds[id]);
        if (checkedIds.length === 0) return;
        if (!confirm(t('billons.confirm_close_selected', { defaultValue: 'Voulez-vous fermer les cycles actifs des lignes sélectionnées ?' }))) return;

        setSaving(true);
        try {
            const targetRows = gridData.filter(r => checkedIds.includes(r.billonId) && r.hasActiveCycle && r.cycleId);
            
            for (const r of targetRows) {
                // 1) Update cycle status to completed
                await supabase
                    .from('billon_cycles')
                    .update({ status: 'completed', harvest_date: new Date().toISOString() })
                    .eq('id', r.cycleId);

                // 2) Update billon active cycle to null and fallow
                await supabase
                    .from('billons')
                    .update({ active_cycle_id: null, status: 'harvested' })
                    .eq('id', r.billonId);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            await fetchInitialData();
        } catch (e) {
            console.error('Failed to close cycles in bulk:', e);
            alert(t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    // Bulk Save Grid changes
    const handleSaveGrid = async () => {
        setSaving(true);
        try {
            for (const row of gridData) {
                const l = parseFloat(row.lengthM);
                const lines = parseInt(row.irrigationLines);
                const spacing = parseFloat(row.dripperSpacingCm);
                const flow = parseFloat(row.dripperFlowRateLh);
                const plants = parseInt(row.plantCount);

                const lengthVal = isNaN(l) ? null : l;
                const linesVal = isNaN(lines) ? 1 : lines;
                const spacingVal = isNaN(spacing) ? null : spacing;
                const flowVal = isNaN(flow) ? null : flow;
                const plantsVal = isNaN(plants) ? null : plants;

                if (row.hasActiveCycle && row.cycleId) {
                    // Update active cycle specifications
                    await supabase
                        .from('billon_cycles')
                        .update({
                            target_crop: row.targetCrop || null,
                            crop_variety: row.cropVariety || null,
                            plant_count: plantsVal,
                            mode_semis: row.modeSemis || null,
                            semis_layout: row.semisLayout || null,
                            mulching: row.mulching || null,
                            soil_notes: row.soilNotes || null,
                            is_control_group: row.isControlGroup,
                            length_m: lengthVal,
                            irrigation_lines: linesVal,
                            dripper_spacing_cm: spacingVal,
                            dripper_flow_rate_lh: flowVal,
                        })
                        .eq('id', row.cycleId);
                } else if (row.targetCrop) {
                    // Start a new cycle in bulk!
                    const { data: newCycle, error: cErr } = await supabase
                        .from('billon_cycles')
                        .insert({
                            billon_id: row.billonId,
                            cycle_number: 1,
                            target_crop: row.targetCrop,
                            crop_variety: row.cropVariety || null,
                            plant_count: plantsVal,
                            planting_date: new Date().toISOString(),
                            status: 'active',
                            mode_semis: row.modeSemis || null,
                            semis_layout: row.semisLayout || null,
                            mulching: row.mulching || null,
                            soil_notes: row.soilNotes || null,
                            is_control_group: row.isControlGroup,
                            length_m: lengthVal,
                            irrigation_lines: linesVal,
                            dripper_spacing_cm: spacingVal,
                            dripper_flow_rate_lh: flowVal,
                        })
                        .select()
                        .single();

                    if (cErr) throw cErr;

                    if (newCycle) {
                        await supabase
                            .from('billons')
                            .update({
                                active_cycle_id: newCycle.id,
                                status: 'planted'
                            })
                            .eq('id', row.billonId);
                    }
                }
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            await fetchInitialData();
        } catch (error) {
            console.error('Error saving grid updates:', error);
            alert(t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    // Bulk Log Activity Submission
    const handleLogBulkActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        const checkedIds = Object.keys(selectedIds).filter(id => selectedIds[id]);
        if (checkedIds.length === 0) {
            alert('Veuillez sélectionner au moins une ligne.');
            return;
        }

        setActivityLoading(true);
        try {
            let notesValue = notes.trim();

            if (activityType === 'irrigation') {
                const dur = parseFloat(durationMinutes);
                const manualVol = parseFloat(manualVolumeLiters);
                const irrigationData = {
                    is_structured_irrigation: true,
                    duration_minutes: isNaN(dur) ? null : dur,
                    estimated_volume_liters: isManualIrrigation ? (isNaN(manualVol) ? 0 : manualVol) : 0,
                    is_manual: isManualIrrigation,
                    notes: notes.trim()
                };
                notesValue = JSON.stringify(irrigationData);
            } else if (activityType === 'fertilization') {
                const fDos = parseFloat(fertDosage);
                const fWat = parseFloat(fertWaterVolume);
                const fPh = parseFloat(fertPh);
                const fEc = parseFloat(fertEc);
                const fertilizationData = {
                    is_structured_fertilization: true,
                    fertilization_type: fertType,
                    product_name: fertProduct.trim(),
                    npk_ratio: fertNpk.trim(),
                    dosage_value: isNaN(fDos) ? null : fDos,
                    dosage_unit: fertUnit,
                    water_volume_l: isNaN(fWat) ? null : fWat,
                    ph_value: isNaN(fPh) ? null : fPh,
                    ec_value: isNaN(fEc) ? null : fEc,
                    notes: notes.trim()
                };
                notesValue = JSON.stringify(fertilizationData);
            } else if (activityType === 'pest_control') {
                const pDos = parseFloat(pestDosage);
                const pWat = parseFloat(pestWaterVolume);
                const pPhi = parseInt(pestPhi);
                const treatmentData = {
                    is_structured_treatment: true,
                    treatment_type: pestType,
                    treatment_category: pestCategory,
                    product_name: pestProduct.trim(),
                    target_pest: pestPest.trim(),
                    dosage_value: isNaN(pDos) ? null : pDos,
                    dosage_unit: pestUnit,
                    water_volume_l: isNaN(pWat) ? null : pWat,
                    phi_days: isNaN(pPhi) ? 0 : pPhi,
                    notes: notes.trim()
                };
                notesValue = JSON.stringify(treatmentData);
            }

            // Insert activities in parallel
            await Promise.all(checkedIds.map(billonId => {
                return supabase.from('billon_activities').insert({
                    billon_id: billonId,
                    activity_type: activityType,
                    notes: notesValue || null,
                    performed_at: new Date().toISOString()
                });
            }));

            setActivitySuccess(true);
            setNotes('');
            setFertProduct('');
            setFertNpk('');
            setFertDosage('');
            setFertWaterVolume('');
            setFertPh('');
            setFertEc('');
            setPestProduct('');
            setPestPest('');
            setPestDosage('');
            setPestWaterVolume('');
            setTimeout(() => setActivitySuccess(false), 3000);
        } catch (err) {
            console.error('Failed to log bulk activities:', err);
            alert(t('common.error'));
        } finally {
            setActivityLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8 font-sans">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin"
                        className="p-3 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Grid className="h-6 w-6 text-green-600 dark:text-green-400" />
                            <h1 className="text-2xl font-black text-gray-950 dark:text-white uppercase tracking-tight">
                                {t('common.bulk_operations', 'Saisie en masse')}
                            </h1>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1">
                            Gérer et consigner les données de plusieurs مصاطب (Billons) simultanément.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab('grid')}
                        className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border ${
                            activeTab === 'grid'
                                ? 'bg-green-600 text-white border-green-700 shadow-lg shadow-green-600/10'
                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        📊 Grille Excel
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border ${
                            activeTab === 'activity'
                                ? 'bg-green-600 text-white border-green-700 shadow-lg shadow-green-600/10'
                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        🚿 Actions en masse
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="max-w-7xl mx-auto py-20 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse">
                    <RefreshCw className="h-10 w-10 text-gray-300 dark:text-gray-700 animate-spin mb-4" />
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('common.loading')}</span>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Active Filters bar */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtrer les lignes (nom, code, culture)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 sm:flex-none">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={plotFilter}
                                    onChange={(e) => setPlotFilter(e.target.value)}
                                    className="appearance-none bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 dark:text-white rounded-2xl py-3 pl-11 pr-8 text-xs font-black outline-none cursor-pointer w-full sm:w-auto"
                                >
                                    <option value="all">Tous les Plots</option>
                                    {plots.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="px-4 py-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-2xl text-xs font-black uppercase">
                                Selected: {selectedCount} / {filteredRows.length}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'grid' ? (
                            <motion.div
                                key="grid-tab"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                {/* Excel Grid View Card */}
                                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    {/* Toolbar */}
                                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Recopier la valeur (Fill Down):</span>
                                            <select
                                                value={bulkField}
                                                onChange={(e) => setBulkField(e.target.value)}
                                                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none cursor-pointer"
                                            >
                                                <option value="">Sélectionner colonne...</option>
                                                <option value="targetCrop">Culture (Crop)</option>
                                                <option value="cropVariety">Variété</option>
                                                <option value="plantCount">Nbr de Plants</option>
                                                <option value="modeSemis">Mode de Semis</option>
                                                <option value="semisLayout">Disposition</option>
                                                <option value="mulching">Tissage/Mulch</option>
                                                <option value="lengthM">Longueur (m)</option>
                                                <option value="irrigationLines">Lignes de goutteurs</option>
                                                <option value="dripperSpacingCm">Espacement (cm)</option>
                                                <option value="dripperFlowRateLh">Débit المنقط (L/h)</option>
                                            </select>

                                            <input
                                                type="text"
                                                placeholder="Valeur à appliquer..."
                                                value={bulkValue}
                                                onChange={(e) => setBulkValue(e.target.value)}
                                                className="px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-green-500"
                                            />

                                            <button
                                                type="button"
                                                onClick={handleBulkApply}
                                                disabled={selectedCount === 0 || !bulkField}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-1.5"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                                Appliquer aux cochés
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleBulkCloseCycles}
                                                disabled={selectedCount === 0}
                                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
                                            >
                                                🚫 Clôturer Cycles
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveGrid}
                                                disabled={saving}
                                                className="px-6 py-2.5 bg-gradient-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                Sauvegarder la grille
                                            </button>
                                        </div>
                                    </div>

                                    {/* Spreadsheet Responsive Grid */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-950/60 border-b border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                    <th className="px-6 py-4 text-center w-12">
                                                        <input
                                                            type="checkbox"
                                                            onChange={handleSelectAll}
                                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-green-600 focus:ring-green-500/20 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4">Billon / Plot</th>
                                                    <th className="px-6 py-4 min-w-[120px]">Culture</th>
                                                    <th className="px-6 py-4 min-w-[120px]">Variété</th>
                                                    <th className="px-6 py-4 min-w-[80px]">Plants</th>
                                                    <th className="px-6 py-4 min-w-[100px]">Semis Mode</th>
                                                    <th className="px-6 py-4 min-w-[100px]">Disposition</th>
                                                    <th className="px-6 py-4 min-w-[100px]">Paillage</th>
                                                    <th className="px-6 py-4 min-w-[70px]">Long (m)</th>
                                                    <th className="px-6 py-4 min-w-[80px]">Tubes Irr.</th>
                                                    <th className="px-6 py-4 min-w-[70px]">Espace. (cm)</th>
                                                    <th className="px-6 py-4 min-w-[70px]">Débit (L/h)</th>
                                                    <th className="px-6 py-4 text-center">Témoin</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80 text-xs text-gray-700 dark:text-gray-300">
                                                {filteredRows.map(row => (
                                                    <tr key={row.billonId} className={`hover:bg-green-50/20 dark:hover:bg-green-950/5 transition-colors ${selectedIds[row.billonId] ? 'bg-green-50/10 dark:bg-green-950/2' : ''}`}>
                                                        <td className="px-6 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds[row.billonId] || false}
                                                                onChange={() => handleSelectRow(row.billonId)}
                                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-green-600 focus:ring-green-500/20 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap">
                                                            <div className="font-black text-gray-900 dark:text-white uppercase">{row.billonName}</div>
                                                            <div className="text-[9px] text-gray-400 font-bold">{row.plotName}</div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="text"
                                                                value={row.targetCrop}
                                                                onChange={(e) => handleCellChange(row.billonId, 'targetCrop', e.target.value)}
                                                                placeholder="ex: Tomates"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="text"
                                                                value={row.cropVariety}
                                                                onChange={(e) => handleCellChange(row.billonId, 'cropVariety', e.target.value)}
                                                                placeholder="ex: Marmande"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-medium focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.plantCount}
                                                                onChange={(e) => handleCellChange(row.billonId, 'plantCount', e.target.value)}
                                                                placeholder="24"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-mono focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.modeSemis}
                                                                onChange={(e) => handleCellChange(row.billonId, 'modeSemis', e.target.value)}
                                                                className="w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg py-1 px-1 outline-none font-bold text-gray-600 dark:text-gray-400 cursor-pointer focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            >
                                                                <option value="">---</option>
                                                                <option value="direct">Direct</option>
                                                                <option value="plant">Plant</option>
                                                                <option value="bulbe">Bulbe</option>
                                                                <option value="bouture">Bouture</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.semisLayout}
                                                                onChange={(e) => handleCellChange(row.billonId, 'semisLayout', e.target.value)}
                                                                className="w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg py-1 px-1 outline-none font-bold text-gray-600 dark:text-gray-400 cursor-pointer focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            >
                                                                <option value="">---</option>
                                                                <option value="monorang">Monorang</option>
                                                                <option value="double_rang">Double Rang</option>
                                                                <option value="quinconce">Quinconce</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.mulching}
                                                                onChange={(e) => handleCellChange(row.billonId, 'mulching', e.target.value)}
                                                                className="w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg py-1 px-1 outline-none font-bold text-gray-600 dark:text-gray-400 cursor-pointer focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            >
                                                                <option value="">---</option>
                                                                <option value="none">Aucun</option>
                                                                <option value="plastic_black">Plastique Noir</option>
                                                                <option value="plastic_white">Plastique Blanc</option>
                                                                <option value="plastic_transparent">Transparent</option>
                                                                <option value="organic_straw">Paille Organique</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.lengthM}
                                                                onChange={(e) => handleCellChange(row.billonId, 'lengthM', e.target.value)}
                                                                placeholder="10"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-mono focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.irrigationLines}
                                                                onChange={(e) => handleCellChange(row.billonId, 'irrigationLines', e.target.value)}
                                                                placeholder="1"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-mono focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.dripperSpacingCm}
                                                                onChange={(e) => handleCellChange(row.billonId, 'dripperSpacingCm', e.target.value)}
                                                                placeholder="20"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-mono focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.dripperFlowRateLh}
                                                                onChange={(e) => handleCellChange(row.billonId, 'dripperFlowRateLh', e.target.value)}
                                                                placeholder="2.2"
                                                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-800 rounded-lg outline-none font-mono focus:bg-white dark:focus:bg-gray-950 focus:border-green-500"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={row.isControlGroup}
                                                                onChange={(e) => handleCellChange(row.billonId, 'isControlGroup', e.target.checked)}
                                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="activity-tab"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Left Side: Checked Billons status */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                                    <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                                        🎯 Cibles sélectionnées ({selectedCount})
                                    </h3>
                                    <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                                        {gridData.filter(r => selectedIds[r.billonId]).map(r => (
                                            <div key={r.billonId} className="p-3 bg-gray-50 dark:bg-gray-950/60 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-black text-gray-900 dark:text-white uppercase">{r.billonName}</span>
                                                    <span className="block text-[10px] text-gray-400 font-bold">{r.plotName}</span>
                                                </div>
                                                {r.targetCrop ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold text-[9px] uppercase border border-green-100/30">
                                                        {r.targetCrop}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-bold text-[9px] uppercase border border-gray-200/30">
                                                        Resting/Fallow
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {selectedCount === 0 && (
                                            <div className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                                ⚠️ Aucune ligne sélectionnée
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Activity Input Form */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <form onSubmit={handleLogBulkActivity} className="space-y-6">
                                        {/* Activity Selector Tabs */}
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                                                Type d'activité collective
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['irrigation', 'fertilization', 'pest_control'] as const).map(act => {
                                                    const isSel = activityType === act;
                                                    const colors: Record<string, string> = {
                                                        irrigation: isSel ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-gray-500',
                                                        fertilization: isSel ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-gray-500',
                                                        pest_control: isSel ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-gray-500',
                                                    };
                                                    const emojis = { irrigation: '💧', fertilization: '🌱', pest_control: '🛡️' };
                                                    const labels = { irrigation: 'Irrigation', fertilization: 'Fertilisation', pest_control: 'Pesticide / Traitement' };
                                                    return (
                                                        <button
                                                            key={act}
                                                            type="button"
                                                            onClick={() => setActivityType(act)}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center h-24 font-black text-[10px] uppercase tracking-wider ${colors[act]}`}
                                                        >
                                                            <span className="text-2xl mb-1">{emojis[act]}</span>
                                                            {labels[act]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Dynamic Form Content */}
                                        <AnimatePresence mode="wait">
                                            {activityType === 'irrigation' && (
                                                <motion.div
                                                    key="irr-form"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Durée (minutes)</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                required={activityType === 'irrigation'}
                                                                value={durationMinutes}
                                                                onChange={(e) => setDurationMinutes(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                                                                placeholder="ex: 30"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Volume par défaut (litres/billon)</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                required={activityType === 'irrigation'}
                                                                value={manualVolumeLiters}
                                                                onChange={(e) => setManualVolumeLiters(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                                                                placeholder="ex: 150"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activityType === 'fertilization' && (
                                                <motion.div
                                                    key="fert-form"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(['fertigation', 'foliar', 'soil'] as const).map(tId => (
                                                            <button
                                                                key={tId}
                                                                type="button"
                                                                onClick={() => setFertType(tId)}
                                                                className={`py-2 rounded-xl text-center border font-bold text-[9px] uppercase tracking-wider transition-all ${
                                                                    fertType === tId
                                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                                                        : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                {tId === 'fertigation' ? '🚿' : tId === 'foliar' ? '🍃' : '🪵'} {tId}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Produit Engrais</label>
                                                            <input
                                                                type="text"
                                                                required={activityType === 'fertilization'}
                                                                value={fertProduct}
                                                                onChange={(e) => setFertProduct(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                                                placeholder="Nom commercial"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Rapport NPK</label>
                                                            <input
                                                                type="text"
                                                                required={activityType === 'fertilization'}
                                                                value={fertNpk}
                                                                onChange={(e) => setFertNpk(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                                                placeholder="ex: 20-20-20"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Dosage</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                required={activityType === 'fertilization'}
                                                                value={fertDosage}
                                                                onChange={(e) => setFertDosage(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">pH</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                step="0.1"
                                                                value={fertPh}
                                                                onChange={(e) => setFertPh(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                                                placeholder="6.2"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">EC (mS/cm)</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                step="0.01"
                                                                value={fertEc}
                                                                onChange={(e) => setFertEc(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                                                placeholder="1.6"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activityType === 'pest_control' && (
                                                <motion.div
                                                    key="pest-form"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Produit chimique / bio</label>
                                                            <input
                                                                type="text"
                                                                required={activityType === 'pest_control'}
                                                                value={pestProduct}
                                                                onChange={(e) => setPestProduct(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                                                                placeholder="ex: Cuivre"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Cible pathogène / ravageur</label>
                                                            <input
                                                                type="text"
                                                                required={activityType === 'pest_control'}
                                                                value={pestPest}
                                                                onChange={(e) => setPestPest(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                                                                placeholder="ex: Mildiou"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Dosage (ml_l ou g_l)</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                required={activityType === 'pest_control'}
                                                                value={pestDosage}
                                                                onChange={(e) => setPestDosage(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Volume d'eau pulvérisé</label>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                required={activityType === 'pest_control'}
                                                                value={pestWaterVolume}
                                                                onChange={(e) => setPestWaterVolume(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Délai d'attente (PHI - Jours)</label>
                                                            <input
                                                                type="number"
                                                                inputMode="numeric"
                                                                required={activityType === 'pest_control'}
                                                                value={pestPhi}
                                                                onChange={(e) => setPestPhi(e.target.value)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 dark:text-white rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Notes area */}
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Observations générales</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                                                placeholder="Notes complémentaires pour toutes les مصاطب..."
                                            />
                                        </div>

                                        {/* Submit button */}
                                        <div className="pt-4">
                                            <motion.button
                                                whileHover={{ y: -2, scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={activityLoading || selectedCount === 0}
                                                className="w-full bg-gradient-primary text-white h-16 rounded-2xl font-black text-md hover:shadow-2xl hover:shadow-green-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-green-600/5"
                                            >
                                                {activityLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> Consigner l'intervention en masse</>}
                                            </motion.button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success Modal Notification */}
                    <AnimatePresence>
                        {(saveSuccess || activitySuccess) && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-green-700"
                            >
                                <Check className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-wider">Modifications enregistrées avec succès!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
