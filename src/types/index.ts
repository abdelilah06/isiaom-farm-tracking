// ============================================================
// Shared TypeScript interfaces for ISIAOM Farm Tracking
// ============================================================

export interface Profile {
    id: string
    full_name: string | null
    role: 'admin' | 'manager' | 'worker' | 'viewer'
    avatar_url: string | null
    updated_at: string | null
    created_at: string
}

export interface Plot {
    id: string
    name: string
    description: string | null
    location_data: Record<string, unknown> | null
    area: number | null
    tree_spacing_row: number | null
    tree_spacing_between: number | null
    plant_count: number | null
    training_method: 'goblet' | 'central_axis' | 'espalier' | null
    crop_variety: string | null
    planting_date: string | null
    status: 'active' | 'fallow' | 'harvested'
    image_url: string | null
    irrigation_system: string | null
    rootstock: string | null
    dripper_flow_rate_lh: number | null
    irrigation_lines: number | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface Operation {
    id: string
    plot_id: string
    type: 'irrigation' | 'fertilization' | 'pest_control' | 'pruning' | 'harvest' | 'observation' | 'planting' | 'other'
    notes: string | null
    metadata?: Record<string, any> | null
    image_url: string | null
    date: string
    performed_by: string | null
    created_at: string
    // Joined fields
    plots?: { name: string }
    profiles?: { full_name: string }
}

export interface Task {
    id: string
    title: string
    description: string | null
    task_type: 'irrigation' | 'fertilization' | 'pest_control' | 'pruning' | 'harvest' | 'other'
    due_date: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'pending' | 'completed' | 'cancelled'
    plot_id: string | null
    created_at: string
    updated_at: string
    // Joined fields
    plots?: { name: string }
}

export interface YieldRecord {
    id: string
    plot_id: string
    harvest_date: string
    quantity_kg: number
    quality_grade: string | null
    notes: string | null
    metadata?: Record<string, any> | null
    image_url: string | null
    created_at: string
    // Joined fields
    plots?: { name: string }
}

export interface DiseaseLog {
    id: string
    plot_id: string
    log_date: string
    type: 'disease' | 'pest' | 'deficiency'
    name: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    affected_area: string | null
    treatment: string | null
    image_url: string | null
    notes: string | null
    metadata?: Record<string, any> | null
    created_at: string
    // Joined fields
    plots?: { name: string }
}

export interface Billon {
    id: string
    plot_id: string | null
    billon_code: string | null
    name: string
    description: string | null
    status: 'active' | 'fallow' | 'harvested' | 'empty' | 'planted' | 'resting'
    location_data: Record<string, unknown> | null
    image_url: string | null
    active_cycle_id: string | null
    created_by: string | null
    created_at: string
    updated_at: string
    // Joined fields
    active_cycle?: BillonCycle | null
}


export interface BillonCycle {
    id: string
    billon_id: string
    cycle_number: number
    target_crop: string | null
    crop_variety: string | null
    plant_count: number | null
    planting_date: string | null
    harvest_date: string | null
    growing_cycle_days: number | null
    seed_type: string | null
    status: 'planned' | 'active' | 'completed'
    yield_kg: number | null
    notes: string | null
    metadata?: Record<string, any> | null
    length_m: number | null
    width_top_cm: number | null
    height_cm: number | null
    inter_billon_cm: number | null
    ecartement_sur_rang_cm: number | null
    mode_semis: 'direct' | 'plant' | 'bulbe' | 'bouture' | null
    semis_layout: 'monorang' | 'double_rang' | 'quinconce' | null
    mulching: 'none' | 'plastic_black' | 'plastic_transparent' | 'organic_straw' | 'plastic_white' | null
    irrigation_lines: number | null
    dripper_spacing_cm: number | null
    dripper_flow_rate_lh: number | null
    irrigation_system: string | null
    soil_notes: string | null
    is_control_group: boolean | null
    created_at: string
    updated_at: string
    // Joined fields
    billons?: { name: string }
}

export interface BillonActivity {
    id: string
    billon_id: string
    activity_type: 'irrigation' | 'fertilization' | 'pest_control' | 'observation' | 'other'
    notes: string | null
    metadata?: Record<string, any> | null
    image_url: string | null
    performed_at: string
    performed_by: string | null
    created_at: string
    // Joined fields
    billons?: { name: string }
    profiles?: { full_name: string }
}


export interface StructuredIrrigationData {
    is_structured_irrigation: true
    duration_minutes: number | null
    estimated_volume_liters: number
    is_manual?: boolean
    dripper_count?: number | null
    dripper_flow_rate_lh?: number | null
    dripper_flow_rate?: number | null
    irrigation_lines?: number | null
    plant_count?: number | null
    length_m?: number | null
    dripper_spacing_cm?: number | null
    notes?: string
}

export interface StructuredFertilizationData {
    is_structured_fertilization: true
    fertilization_type: 'fertigation' | 'foliar' | 'soil'
    product_name: string
    npk_ratio?: string
    dosage_value: number | null
    dosage_unit: 'kg_ha' | 'g_tree' | 'g_l' | 'ml_l' | 'kg_total' | string
    water_volume_l?: number | null
    ph_value?: number | null
    ec_value?: number | null
    operator_name?: string
    notes?: string
}

export interface StructuredTreatmentData {
    is_structured_treatment: true
    treatment_type: 'preventative' | 'curative'
    treatment_category: string
    target_pest: string
    product_name: string
    active_ingredient?: string
    application_method: 'foliar_spray' | 'irrigation_injection' | 'soil_drench' | string
    dosage_value: number | null
    dosage_unit: 'ml_l' | 'g_l' | 'l_ha' | 'kg_ha' | string
    water_volume_l?: number | null
    phi_days: number
    operator_name?: string
    wind_condition?: 'low' | 'medium' | 'high'
    temperature_c?: number | null
    ppe_worn?: boolean
    notes?: string
}

export type ParsedActivityData = 
    | { type: 'irrigation'; data: StructuredIrrigationData; displayNote: string }
    | { type: 'fertilization'; data: StructuredFertilizationData; displayNote: string }
    | { type: 'pest_control'; data: StructuredTreatmentData; displayNote: string }
    | { type: 'standard'; data: null; displayNote: string }
