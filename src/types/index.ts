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
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface Operation {
    id: string
    plot_id: string
    type: 'irrigation' | 'fertilization' | 'pest_control' | 'pruning' | 'harvest' | 'observation' | 'planting' | 'other'
    notes: string | null
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
    activity_type: 'irrigation' | 'fertilization' | 'planting' | 'harvest' | 'observation' | 'other'
    notes: string | null
    image_url: string | null
    performed_at: string
    performed_by: string | null
    created_at: string
    // Joined fields
    billons?: { name: string }
    profiles?: { full_name: string }
}
