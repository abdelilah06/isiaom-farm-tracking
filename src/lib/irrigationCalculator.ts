/**
 * Centralized hydraulic and irrigation calculations for Plots and Billons.
 */

export interface BillonHydraulicSpecs {
    length_m: number | null
    dripper_spacing_cm: number | null
    irrigation_lines: number | null
    dripper_flow_rate_lh: number | null
}

export interface PlotHydraulicSpecs {
    plant_count: number | null
    dripper_flow_rate_lh: number | null
    irrigation_lines: number | null
}

export interface IrrigationCalculationResult {
    drippersCount: number
    totalFlowRateLh: number
    estimatedVolumeLiters: number
}

/**
 * Calculates hydraulic values for a Billon (raised bed).
 */
export function calculateBillonIrrigation(
    specs: BillonHydraulicSpecs | null,
    durationMinutes: string | number
): IrrigationCalculationResult | null {
    if (
        !specs ||
        specs.length_m === null ||
        specs.dripper_spacing_cm === null ||
        specs.irrigation_lines === null ||
        specs.dripper_flow_rate_lh === null ||
        specs.dripper_spacing_cm <= 0
    ) {
        return null
    }

    const { length_m, dripper_spacing_cm, irrigation_lines, dripper_flow_rate_lh } = specs
    const drippersCount = Math.round(((length_m * 100) / dripper_spacing_cm) * irrigation_lines)
    const totalFlowRateLh = drippersCount * dripper_flow_rate_lh

    const dur = typeof durationMinutes === 'number' ? durationMinutes : parseFloat(durationMinutes)
    const estimatedVolumeLiters = !isNaN(dur) && dur > 0 ? totalFlowRateLh * (dur / 60) : 0

    return {
        drippersCount,
        totalFlowRateLh,
        estimatedVolumeLiters
    }
}

/**
 * Calculates hydraulic values for a Plot (orchard / field).
 */
export function calculatePlotIrrigation(
    specs: PlotHydraulicSpecs | null,
    durationMinutes: string | number
): IrrigationCalculationResult | null {
    if (!specs || specs.plant_count === null) {
        return null
    }

    const flow = specs.dripper_flow_rate_lh && specs.dripper_flow_rate_lh > 0 ? specs.dripper_flow_rate_lh : 4
    const lines = specs.irrigation_lines && specs.irrigation_lines > 0 ? specs.irrigation_lines : 1
    const drippersCount = specs.plant_count * lines
    const totalFlowRateLh = drippersCount * flow

    const dur = typeof durationMinutes === 'number' ? durationMinutes : parseFloat(durationMinutes)
    const estimatedVolumeLiters = !isNaN(dur) && dur > 0 ? totalFlowRateLh * (dur / 60) : 0

    return {
        drippersCount,
        totalFlowRateLh,
        estimatedVolumeLiters
    }
}
