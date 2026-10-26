import type {
    StructuredIrrigationData,
    StructuredFertilizationData,
    StructuredTreatmentData,
    ParsedActivityData
} from '../types'

/**
 * Centrally parses operation or billon activity data from both:
 * 1. The new structured 'metadata' JSONB column.
 * 2. The legacy JSON string stored inside the 'notes' column.
 * 
 * Provides 100% backward-compatibility with zero runtime crashes.
 */
export function parseActivity(
    notes: string | null | undefined,
    metadata?: Record<string, any> | null
): ParsedActivityData {
    let sourceObj: any = null

    // 1. Prioritize structured metadata if present
    if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
        sourceObj = metadata
    } 
    // 2. Fall back to parsing JSON string in notes
    else if (notes && typeof notes === 'string' && notes.trim().startsWith('{')) {
        try {
            sourceObj = JSON.parse(notes)
        } catch {
            sourceObj = null
        }
    }

    if (sourceObj && typeof sourceObj === 'object') {
        const displayNote = (typeof sourceObj.notes === 'string' ? sourceObj.notes.trim() : '') || 
                           (notes && !notes.trim().startsWith('{') ? notes.trim() : '')

        if (sourceObj.is_structured_treatment) {
            return {
                type: 'pest_control',
                data: sourceObj as StructuredTreatmentData,
                displayNote
            }
        }

        if (sourceObj.is_structured_irrigation) {
            return {
                type: 'irrigation',
                data: sourceObj as StructuredIrrigationData,
                displayNote
            }
        }

        if (sourceObj.is_structured_fertilization) {
            return {
                type: 'fertilization',
                data: sourceObj as StructuredFertilizationData,
                displayNote
            }
        }
    }

    // Default standard plain text notes
    return {
        type: 'standard',
        data: null,
        displayNote: typeof notes === 'string' ? notes.trim() : ''
    }
}

/**
 * Helper to prepare insertion payload for Supabase.
 * Supplies both `metadata` (for new schema) and a backward-compatible `notes` fallback.
 */
export function prepareActivityPayload(params: {
    type: 'irrigation' | 'fertilization' | 'pest_control' | string
    structuredData: any
    rawNote: string
}) {
    const { type, structuredData, rawNote } = params
    const trimmedNote = (rawNote || '').trim()

    if (['irrigation', 'fertilization', 'pest_control'].includes(type) && structuredData) {
        const payloadData = {
            ...structuredData,
            notes: trimmedNote
        }
        return {
            metadata: payloadData,
            // Keep JSON string in notes as backward-compatible fallback until all DB clients migrate
            notes: JSON.stringify(payloadData),
            rawNotes: trimmedNote
        }
    }

    return {
        metadata: {},
        notes: trimmedNote || null,
        rawNotes: trimmedNote || null
    }
}
