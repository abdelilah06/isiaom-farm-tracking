import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldAlert,
    ShieldCheck, Search, Loader2, Clock, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

// Notes parser
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
        // Not JSON
    }
    return null;
};

interface TreatmentActivity {
    id: string;
    billon_id: string;
    activity_type: string;
    notes: string | null;
    performed_at: string;
    performed_by: string | null;
    
    // Mapped fields
    billonName: string;
    plotName: string;
    billonStatus: string;
    treatmentData: any;
    safeHarvestDate: Date;
    performedDate: Date;
    phiDays: number;
}

export default function SafeHarvestCalendar() {
    const { t } = useTranslation();
    const [activities, setActivities] = useState<TreatmentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch activities and map names
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch acts
                const { data: acts, error: actsErr } = await supabase
                    .from('billon_activities')
                    .select('*')
                    .eq('activity_type', 'pest_control')
                    .order('performed_at', { ascending: false });

                if (actsErr) throw actsErr;

                // Fetch billons & plots
                const { data: billons } = await supabase.from('billons').select('*');
                const { data: plots } = await supabase.from('plots').select('*');

                const billonMap = new Map<string, any>();
                billons?.forEach(b => {
                    const plot = plots?.find(p => p.id === b.plot_id);
                    billonMap.set(b.id, {
                        ...b,
                        plotName: plot ? plot.name : '---'
                    });
                });

                const mapped: TreatmentActivity[] = (acts || []).map(act => {
                    const billon = billonMap.get(act.billon_id);
                    const treatmentData = parseTreatmentNotes(act.notes);
                    const performedDate = new Date(act.performed_at);
                    const phiDays = treatmentData?.phi_days || 0;
                    const safeHarvestDate = new Date(performedDate.getTime() + phiDays * 24 * 60 * 60 * 1000);

                    return {
                        ...act,
                        billonName: billon ? billon.name : t('billons.billon', 'Billon'),
                        plotName: billon ? billon.plotName : '---',
                        billonStatus: billon ? billon.status : 'unknown',
                        treatmentData,
                        performedDate,
                        phiDays,
                        safeHarvestDate
                    };
                });

                setActivities(mapped);
            } catch (err) {
                console.error('Error fetching calendar data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [t]);

    // Calendar generation helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
    const firstDayIndex = useMemo(() => {
        // Adjust for Monday start: 0 = Mon, ..., 6 = Sun
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }, [year, month]);

    const prevMonthDays = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

    // Calendar grid items
    const calendarCells = useMemo(() => {
        const cells: Date[] = [];
        
        // Prev month days padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            cells.push(new Date(year, month - 1, prevMonthDays - i));
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push(new Date(year, month, i));
        }

        // Next month days padding to make it perfect grid of 42
        const remaining = 42 - cells.length;
        for (let i = 1; i <= remaining; i++) {
            cells.push(new Date(year, month + 1, i));
        }

        return cells;
    }, [year, month, daysInMonth, firstDayIndex, prevMonthDays]);

    // Find active quarantines on a specific date
    const getQuarantinesForDate = (date: Date) => {
        // Set date hours to 0:00:00 for comparison
        const checkTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

        return activities.filter(act => {
            if (act.phiDays <= 0) return false;
            
            // Performed date set to 0:00
            const perfTime = new Date(
                act.performedDate.getFullYear(),
                act.performedDate.getMonth(),
                act.performedDate.getDate()
            ).getTime();
            
            // Safe date set to 23:59:59 of safe day
            const safeTime = new Date(
                act.safeHarvestDate.getFullYear(),
                act.safeHarvestDate.getMonth(),
                act.safeHarvestDate.getDate(),
                23, 59, 59
            ).getTime();

            return checkTime >= perfTime && checkTime <= safeTime;
        });
    };

    // Current active quarantines (today)
    const activeQuarantinesToday = useMemo(() => {
        return getQuarantinesForDate(new Date()).filter(act => {
            if (!searchQuery) return true;
            return act.billonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                act.plotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (act.treatmentData?.product_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [activities, searchQuery]);

    // Quarantines for the selected calendar day
    const selectedDayQuarantines = useMemo(() => {
        return getQuarantinesForDate(selectedDate);
    }, [selectedDate, activities]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 dark:border-gray-800 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 dark:bg-red-500/20 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
                            <ShieldAlert className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {t('treatment.safe_harvest_calendar', 'Sécurité Récolte & Délais (PHI)')}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                                Suivi des quarantaines de pesticides / fertilisants chimiques (Délai d'Attente avant Récolte).
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Search Bar for Quarantines */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par مصطبة ou produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-red-500 animate-spin mb-3" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('common.loading')}</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Monthly Calendar Grid (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/40 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider pl-2">
                                {monthNames[month]} {year}
                            </h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-850 rounded-xl text-gray-500 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-850 rounded-xl text-gray-500 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5 text-center">
                            {/* Weekday headers */}
                            {weekDays.map(wd => (
                                <div key={wd} className="py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {wd}
                                </div>
                            ))}

                            {/* Day cells */}
                            {calendarCells.map((cellDate, index) => {
                                const isCurrentMonth = cellDate.getMonth() === month;
                                const cellQuarantines = getQuarantinesForDate(cellDate);
                                const hasQuarantine = cellQuarantines.length > 0;
                                const isSelectedDay = isSelected(cellDate);
                                const isTodayDay = isToday(cellDate);

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setSelectedDate(cellDate)}
                                        className={`relative aspect-square p-1 rounded-2xl flex flex-col items-center justify-between border transition-all ${
                                            isSelectedDay
                                                ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                                                : isTodayDay
                                                    ? 'bg-gray-150 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 font-black'
                                                    : isCurrentMonth
                                                        ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
                                                        : 'bg-gray-50/50 dark:bg-gray-950/20 text-gray-300 dark:text-gray-600 border-transparent cursor-default'
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold mt-1">{cellDate.getDate()}</span>
                                        
                                        {/* Quarantine indicator */}
                                        {hasQuarantine && (
                                            <span className={`w-1.5 h-1.5 rounded-full mb-1.5 ${
                                                isSelectedDay ? 'bg-white' : 'bg-red-500'
                                            }`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Selected Day Details & Active Quarantines (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Day Details Panel */}
                        <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800/80 pb-3">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-red-500" />
                                    <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                        {selectedDate.toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    selectedDayQuarantines.length > 0
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                }`}>
                                    {selectedDayQuarantines.length > 0 
                                        ? `${selectedDayQuarantines.length} Alerte(s)` 
                                        : 'Récolte Sûre'}
                                </span>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                                {selectedDayQuarantines.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                            Toutes les مصاطب sont prêtes pour la récolte.
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Aucun délai d'attente chimique n'est actif à cette date.
                                        </p>
                                    </div>
                                ) : (
                                    selectedDayQuarantines.map(act => {
                                        const daysRem = Math.ceil((act.safeHarvestDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={act.id} className="p-3.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-805 rounded-2xl space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-tight">
                                                            {act.billonName}
                                                        </h4>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{act.plotName}</span>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-lg text-[9px] font-black uppercase">
                                                        {daysRem > 0 ? `Quarantaine` : `Jour de libération`}
                                                    </span>
                                                </div>

                                                <div className="border-t border-dashed border-gray-100 dark:border-gray-850 pt-2 text-[10.5px] text-gray-500 dark:text-gray-400 font-bold space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Produit :</span>
                                                        <span className="text-gray-800 dark:text-gray-250 font-black">{act.treatmentData?.product_name || 'Inconnu'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Traité le :</span>
                                                        <span>{act.performedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Sécurisé le :</span>
                                                        <span className="text-green-600 font-black">{act.safeHarvestDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* List: Current Active Quarantines (Right Now) */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-red-500" />
                                Quarantaines actives aujourd'hui ({activeQuarantinesToday.length})
                            </h3>

                            <div className="space-y-3">
                                {activeQuarantinesToday.length === 0 ? (
                                    <div className="p-5 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Aucun lit n'est en quarantaine actuellement
                                        </p>
                                    </div>
                                ) : (
                                    activeQuarantinesToday.map(act => {
                                        const now = new Date();
                                        const diffTime = act.safeHarvestDate.getTime() - now.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        
                                        return (
                                            <motion.div
                                                key={act.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-950/40 rounded-2xl hover:shadow-md transition-all shadow-sm"
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-tight truncate">
                                                            {act.billonName}
                                                        </h4>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate">
                                                        {act.treatmentData?.product_name || 'Pesticide'} • {act.plotName}
                                                    </p>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <span className="block text-[11px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-xl uppercase">
                                                        {diffDays} {diffDays === 1 ? 'jour restant' : 'jours restants'}
                                                    </span>
                                                    <span className="block text-[8px] text-gray-400 font-bold mt-1">
                                                        Safe: {act.safeHarvestDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
