import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Wheat } from 'lucide-react';
import type { Plot, Billon } from '../types';

interface FarmMapProps {
    plots: Plot[];
    billons: Billon[];
    activeCycles: Record<string, any>;
    treatmentActivities: any[];
    onBillonSelect: (billonId: string, name: string) => void;
    onAddActivity: (billonId: string) => void;
    onStartCycle: (billonId: string) => void;
    onCloseCycle: (billonId: string, activeCycle: any) => void;
    onPlotSelect: (plotId: string) => void;
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
        // ignore
    }
    return null;
};

export default function FarmMap({
    plots,
    billons,
    activeCycles,
    treatmentActivities,
    onBillonSelect,
    onPlotSelect
}: FarmMapProps) {
    const { t } = useTranslation();
    const [hoveredBillon, setHoveredBillon] = useState<Billon | null>(null);
    const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Detect if a billon is quarantined today
    const quarantineMap = useMemo(() => {
        const map = new Map<string, { daysLeft: number; product: string }>();
        const now = new Date().getTime();

        treatmentActivities.forEach(act => {
            if (act.activity_type !== 'pest_control') return;
            const treatmentData = parseTreatmentNotes(act.notes);
            if (!treatmentData || !treatmentData.phi_days) return;
            
            const perfTime = new Date(act.performed_at).getTime();
            const phiMs = treatmentData.phi_days * 24 * 60 * 60 * 1000;
            const safeTime = perfTime + phiMs;

            if (now >= perfTime && now <= safeTime) {
                const daysLeft = Math.ceil((safeTime - now) / (1000 * 60 * 60 * 24));
                // Keep the one with the maximum days left if multiple
                const existing = map.get(act.billon_id);
                if (!existing || existing.daysLeft < daysLeft) {
                    map.set(act.billon_id, {
                        daysLeft,
                        product: treatmentData.product_name || 'Treatment'
                    });
                }
            }
        });

        return map;
    }, [treatmentActivities]);

    // Handle mouse movement for tooltip
    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left + 15,
            y: e.clientY - rect.top - 70
        });
    };

    // Layout configuration
    const cols = Math.min(plots.length, 3) || 1;
    const plotWidth = 240;
    const plotHeight = 220;
    const gapX = 30;
    const gapY = 30;
    const padding = 20;

    const mapWidth = cols * (plotWidth + gapX) - gapX + padding * 2;
    const mapHeight = Math.ceil(plots.length / cols) * (plotHeight + gapY) - gapY + padding * 2;

    const getStatusColor = (status: string, isQuarantined: boolean) => {
        if (isQuarantined) return {
            fill: 'rgba(239, 68, 68, 0.1)',
            stroke: '#ef4444',
            lightFill: 'bg-red-500/10',
            lightText: 'text-red-600 dark:text-red-400'
        };
        switch (status) {
            case 'active':
            case 'planted':
                return {
                    fill: 'rgba(16, 185, 129, 0.08)',
                    stroke: '#10b981',
                    lightFill: 'bg-emerald-500/10',
                    lightText: 'text-emerald-600 dark:text-emerald-450'
                };
            case 'harvested':
                return {
                    fill: 'rgba(245, 158, 11, 0.08)',
                    stroke: '#f59e0b',
                    lightFill: 'bg-amber-500/10',
                    lightText: 'text-amber-600 dark:text-amber-400'
                };
            case 'fallow':
            case 'resting':
                return {
                    fill: 'rgba(59, 130, 246, 0.08)',
                    stroke: '#3b82f6',
                    lightFill: 'bg-blue-500/10',
                    lightText: 'text-blue-600 dark:text-blue-400'
                };
            case 'empty':
            default:
                return {
                    fill: 'rgba(156, 163, 175, 0.05)',
                    stroke: '#9ca3af',
                    lightFill: 'bg-gray-500/10',
                    lightText: 'text-gray-500 dark:text-gray-400'
                };
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="w-2 h-8 bg-green-600 rounded-full" />
                        🗺️ Layout spatial interactif de la ferme
                    </h2>
                    <p className="text-xs text-gray-450 dark:text-gray-500 font-bold mt-0.5">
                        Vue aérienne dynamique de vos lignes et billons. Passez la souris pour analyser.
                    </p>
                </div>

                {/* Legends */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-gray-650 dark:text-gray-400">Actif / Ensemencé</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-gray-650 dark:text-gray-400">Récolté</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-gray-650 dark:text-gray-400">Jachère / Repos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-650 dark:text-red-400">Quarantaine PHI</span>
                    </div>
                </div>
            </div>

            {plots.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                    <p className="text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest">
                        Créer d'abord un Plot pour générer la carte
                    </p>
                </div>
            ) : (
                <div className="relative border border-gray-50 dark:border-gray-850 rounded-3xl overflow-auto no-scrollbar bg-gray-50/50 dark:bg-gray-950/20" onMouseMove={handleMouseMove}>
                    <svg
                        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                        width="100%"
                        height="100%"
                        className="min-w-[700px] overflow-visible"
                    >
                        {plots.map((plot, plotIndex) => {
                            const colIndex = plotIndex % cols;
                            const rowIndex = Math.floor(plotIndex / cols);
                            const x = colIndex * (plotWidth + gapX) + padding;
                            const y = rowIndex * (plotHeight + gapY) + padding;

                            // Filter billons of this plot
                            const plotBillons = billons.filter(b => b.plot_id === plot.id);
                            const isHoveredPlot = hoveredPlot?.id === plot.id;

                            return (
                                <g key={plot.id} className="cursor-pointer">
                                    {/* Plot boundary rectangle */}
                                    <rect
                                        x={x}
                                        y={y}
                                        width={plotWidth}
                                        height={plotHeight}
                                        rx={20}
                                        fill={isHoveredPlot ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-card, rgba(255,255,255,0.7))'}
                                        stroke={isHoveredPlot ? '#22c55e' : 'rgba(156, 163, 175, 0.15)'}
                                        strokeWidth={isHoveredPlot ? 2.5 : 1.5}
                                        onClick={() => onPlotSelect(plot.id)}
                                        onMouseEnter={() => setHoveredPlot(plot)}
                                        onMouseLeave={() => setHoveredPlot(null)}
                                        className="transition-all duration-200"
                                    />

                                    {/* Plot title */}
                                    <text
                                        x={x + 18}
                                        y={y + 35}
                                        fill="currentColor"
                                        className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white"
                                        onClick={() => onPlotSelect(plot.id)}
                                    >
                                        {plot.name}
                                    </text>
                                    <text
                                        x={x + 18}
                                        y={y + 50}
                                        fill="currentColor"
                                        className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                                        onClick={() => onPlotSelect(plot.id)}
                                    >
                                        {plot.crop_variety || 'Mix'} • {plot.area || 0} m²
                                    </text>

                                    {/* Line separator */}
                                    <line
                                        x1={x + 18}
                                        y1={y + 60}
                                        x2={x + plotWidth - 18}
                                        y2={y + 60}
                                        stroke="rgba(156, 163, 175, 0.1)"
                                    />

                                    {/* Draw beds (billons) inside the plot */}
                                    {plotBillons.length === 0 ? (
                                        <text
                                            x={x + plotWidth / 2}
                                            y={y + plotHeight / 2 + 20}
                                            textAnchor="middle"
                                            fill="currentColor"
                                            className="text-[8px] font-black uppercase text-gray-405 tracking-widest"
                                        >
                                            Aucun billon
                                        </text>
                                    ) : (
                                        plotBillons.slice(0, 5).map((billon, billonIndex) => {
                                            const bY = y + 75 + billonIndex * 26;
                                            const bWidth = plotWidth - 36;
                                            const bHeight = 18;
                                            const isBillonQuarantined = quarantineMap.has(billon.id);
                                            const colors = getStatusColor(billon.status, isBillonQuarantined);
                                            const activeCycle = activeCycles[billon.id];
                                            const isHoveredBillon = hoveredBillon?.id === billon.id;

                                            return (
                                                <g
                                                    key={billon.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onBillonSelect(billon.id, billon.name);
                                                    }}
                                                    onMouseEnter={() => setHoveredBillon(billon)}
                                                    onMouseLeave={() => setHoveredBillon(null)}
                                                    className="transition-all"
                                                >
                                                    {/* Bed rectangle */}
                                                    <rect
                                                        x={x + 18}
                                                        y={bY}
                                                        width={bWidth}
                                                        height={bHeight}
                                                        rx={6}
                                                        fill={colors.fill}
                                                        stroke={isHoveredBillon ? '#f59e0b' : colors.stroke}
                                                        strokeWidth={isHoveredBillon ? 2 : isBillonQuarantined ? 1.5 : 1}
                                                        strokeDasharray={isBillonQuarantined ? "3,3" : undefined}
                                                        className="transition-all duration-200"
                                                    />

                                                    {/* Bed status marker */}
                                                    <circle
                                                        cx={x + 28}
                                                        cy={bY + 9}
                                                        r={3.5}
                                                        fill={colors.stroke}
                                                        className={isBillonQuarantined ? 'animate-pulse' : ''}
                                                    />

                                                    {/* Bed name */}
                                                    <text
                                                        x={x + 38}
                                                        y={bY + 12}
                                                        fill="currentColor"
                                                        className="text-[9px] font-black uppercase text-gray-800 dark:text-gray-200"
                                                    >
                                                        {billon.name}
                                                    </text>

                                                    {/* Bed crop text */}
                                                    {activeCycle?.target_crop && (
                                                        <text
                                                            x={x + bWidth - 10}
                                                            y={bY + 12}
                                                            textAnchor="end"
                                                            fill="currentColor"
                                                            className="text-[8px] font-bold text-gray-400 dark:text-gray-500"
                                                        >
                                                            {activeCycle.target_crop.slice(0, 10)}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        })
                                    )}

                                    {/* Check if there are more than 5 billons */}
                                    {plotBillons.length > 5 && (
                                        <text
                                            x={x + 18}
                                            y={y + plotHeight - 12}
                                            fill="currentColor"
                                            className="text-[8px] font-black text-amber-500 uppercase tracking-widest"
                                        >
                                            + {plotBillons.length - 5} autres billons
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Interactive Tooltip Card */}
                    <AnimatePresence>
                        {hoveredBillon && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    left: tooltipPos.x,
                                    top: tooltipPos.y,
                                    zIndex: 50,
                                    pointerEvents: 'none'
                                }}
                                className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-2xl space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                            {hoveredBillon.name}
                                        </h4>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                            {t(`billons.statuses.${hoveredBillon.status}`, hoveredBillon.status)}
                                        </span>
                                    </div>

                                    {quarantineMap.has(hoveredBillon.id) && (
                                        <span className="p-1 bg-red-500/10 text-red-500 rounded-lg flex-shrink-0 animate-pulse">
                                            <ShieldAlert className="h-4 w-4" />
                                        </span>
                                    )}
                                </div>

                                {quarantineMap.has(hoveredBillon.id) && (
                                    <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2">
                                        <ShieldAlert className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-[9px] font-bold text-red-600 dark:text-red-400">
                                            Quarantaine: {quarantineMap.get(hoveredBillon.id)?.daysLeft} jours restants. (Produit: {quarantineMap.get(hoveredBillon.id)?.product})
                                        </div>
                                    </div>
                                )}

                                {activeCycles[hoveredBillon.id] ? (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-[10px] font-bold text-gray-700 dark:text-gray-300 space-y-1">
                                        <div className="flex items-center gap-1 text-emerald-600">
                                            <Wheat className="h-3 w-3" />
                                            <span className="uppercase font-black text-[9px]">Cycle {activeCycles[hoveredBillon.id].cycle_number}</span>
                                        </div>
                                        <div>Culture: {activeCycles[hoveredBillon.id].target_crop || '---'}</div>
                                        <div>Variété: {activeCycles[hoveredBillon.id].crop_variety || '---'}</div>
                                        {activeCycles[hoveredBillon.id].plant_count && (
                                            <div>Plants: {activeCycles[hoveredBillon.id].plant_count} units</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 dark:bg-gray-800/40 p-2 text-center rounded-xl text-[9px] font-bold text-gray-400 uppercase">
                                        Aucun cycle actif
                                    </div>
                                )}

                                <div className="text-[7.5px] font-black text-amber-500 uppercase tracking-widest text-center">
                                    cliquer pour modifier ou consigner
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
