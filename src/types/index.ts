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
