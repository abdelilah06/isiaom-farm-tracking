import { supabase } from './supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Export plots to Excel
export async function exportPlotsToExcel() {
    try {
        const { data: plots, error } = await supabase
            .from('plots')
            .select('*')
            .order('name')

        if (error) throw error

        const worksheet = XLSX.utils.json_to_sheet(plots || [])
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Plots')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ISIAOM_Plots_${date}.xlsx`)

        return { success: true, count: plots?.length || 0 }
    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error }
    }
}

// Export operations to Excel
export async function exportOperationsToExcel() {
    try {
        const { data: operations, error } = await supabase
            .from('operations')
            .select(`
                *,
                plots (name)
            `)
            .order('date', { ascending: false })

        if (error) throw error

        // Format data for export
        const formattedData = operations?.map(op => ({
            'ID': op.id,
            'Plot': op.plots?.name || 'N/A',
            'Type': op.type,
            'Date': new Date(op.date).toLocaleDateString('ar-MA'),
            'Notes': op.notes || '',
            'Photo': op.photo_url ? 'Yes' : 'No'
        })) || []

        const worksheet = XLSX.utils.json_to_sheet(formattedData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Operations')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ISIAOM_Operations_${date}.xlsx`)

        return { success: true, count: operations?.length || 0 }
    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error }
    }
}

// Export to CSV
export async function exportToCSV(type: 'plots' | 'operations') {
    try {
        if (type === 'plots') {
            const { data: plots, error } = await supabase
                .from('plots')
                .select('*')
                .order('name')

            if (error) throw error

            const worksheet = XLSX.utils.json_to_sheet(plots || [])
            const csv = XLSX.utils.sheet_to_csv(worksheet)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

            const date = new Date().toISOString().split('T')[0]
            saveAs(blob, `ISIAOM_Plots_${date}.csv`)

            return { success: true, count: plots?.length || 0 }
        } else {
            const { data: operations, error } = await supabase
                .from('operations')
                .select(`
                    *,
                    plots (name)
                `)
                .order('date', { ascending: false })

            if (error) throw error

            const formattedData = operations?.map(op => ({
                'ID': op.id,
                'Plot': op.plots?.name || 'N/A',
                'Type': op.type,
                'Date': new Date(op.date).toLocaleDateString('ar-MA'),
                'Notes': op.notes || '',
                'Photo': op.photo_url ? 'Yes' : 'No'
            })) || []

            const worksheet = XLSX.utils.json_to_sheet(formattedData)
            const csv = XLSX.utils.sheet_to_csv(worksheet)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

            const date = new Date().toISOString().split('T')[0]
            saveAs(blob, `ISIAOM_Operations_${date}.csv`)

            return { success: true, count: operations?.length || 0 }
        }
    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error }
    }
}

// Export full report (both plots and operations)
export async function exportFullReport() {
    try {
        const { data: plots, error: plotsError } = await supabase
            .from('plots')
            .select('*')
            .order('name')

        if (plotsError) throw plotsError

        const { data: operations, error: opsError } = await supabase
            .from('operations')
            .select(`
                *,
                plots (name)
            `)
            .order('date', { ascending: false })

        if (opsError) throw opsError

        // Format operations data
        const formattedOps = operations?.map(op => ({
            'ID': op.id,
            'Plot': op.plots?.name || 'N/A',
            'Type': op.type,
            'Date': new Date(op.date).toLocaleDateString('ar-MA'),
            'Notes': op.notes || '',
            'Photo': op.photo_url ? 'Yes' : 'No'
        })) || []

        // Create workbook with multiple sheets
        const workbook = XLSX.utils.book_new()

        const plotsSheet = XLSX.utils.json_to_sheet(plots || [])
        XLSX.utils.book_append_sheet(workbook, plotsSheet, 'Plots')

        const opsSheet = XLSX.utils.json_to_sheet(formattedOps)
        XLSX.utils.book_append_sheet(workbook, opsSheet, 'Operations')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ISIAOM_Full_Report_${date}.xlsx`)

        return {
            success: true,
            plotsCount: plots?.length || 0,
            operationsCount: operations?.length || 0
        }
    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error }
    }
}

// Export billon activities to Excel
export async function exportBillonActivitiesToExcel() {
    try {
        const { data: acts, error: actsErr } = await supabase
            .from('billon_activities')
            .select('*')
            .order('performed_at', { ascending: false });

        if (actsErr) throw actsErr;

        const { data: billonsData } = await supabase.from('billons').select('id, name, plot_id');
        const { data: plotsData } = await supabase.from('plots').select('id, name');

        const billonMap = new Map();
        billonsData?.forEach(b => {
            const plot = plotsData?.find(p => p.id === b.plot_id);
            billonMap.set(b.id, {
                name: b.name,
                plotName: plot ? plot.name : '---'
            });
        });

        const formattedData = acts?.map(act => {
            const date = new Date(act.performed_at).toLocaleDateString('fr-FR');
            const type = act.activity_type;
            const b = billonMap.get(act.billon_id);
            const billonName = b ? b.name : '---';
            const plotName = b ? b.plotName : '---';

            let notesText = act.notes || '';
            if (notesText.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(notesText);
                    if (parsed.is_structured_treatment) {
                        notesText = `Traitement: ${parsed.product_name} (${parsed.treatment_type}, PHI: ${parsed.phi_days}j)`;
                    } else if (parsed.is_structured_irrigation) {
                        notesText = `Irrigation: ${parsed.duration_minutes}min (${parsed.estimated_volume_liters}L)`;
                    } else if (parsed.is_structured_fertilization) {
                        notesText = `Tonnage/Engrais: ${parsed.product_name} (NPK: ${parsed.npk_ratio}, Dosage: ${parsed.dosage_value} ${parsed.dosage_unit})`;
                    }
                } catch (e) {
                    // fallback
                }
            }

            return {
                'Date': date,
                "Type d'Activité": type,
                'Billon': billonName,
                'Parcelle': plotName,
                'Détails / Notes': notesText,
                'Opérateur': act.performed_by || 'Système'
            };
        }) || [];

        const worksheet = XLSX.utils.json_to_sheet(formattedData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activites')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ISIAOM_Activites_Billons_${date}.xlsx`)

        return { success: true, count: acts?.length || 0 }
    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error }
    }
}

// Export billon activities to CSV
export async function exportBillonActivitiesToCSV() {
    try {
        const { data: acts, error: actsErr } = await supabase
            .from('billon_activities')
            .select('*')
            .order('performed_at', { ascending: false });

        if (actsErr) throw actsErr;

        const { data: billonsData } = await supabase.from('billons').select('id, name, plot_id');
        const { data: plotsData } = await supabase.from('plots').select('id, name');

        const billonMap = new Map();
        billonsData?.forEach(b => {
            const plot = plotsData?.find(p => p.id === b.plot_id);
            billonMap.set(b.id, {
                name: b.name,
                plotName: plot ? plot.name : '---'
            });
        });

        const formattedData = acts?.map(act => {
            const date = new Date(act.performed_at).toLocaleDateString('fr-FR');
            const type = act.activity_type;
            const b = billonMap.get(act.billon_id);
            const billonName = b ? b.name : '---';
            const plotName = b ? b.plotName : '---';

            let notesText = act.notes || '';
            if (notesText.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(notesText);
                    if (parsed.is_structured_treatment) {
                        notesText = `Traitement: ${parsed.product_name} (${parsed.treatment_type}, PHI: ${parsed.phi_days}j)`;
                    } else if (parsed.is_structured_irrigation) {
                        notesText = `Irrigation: ${parsed.duration_minutes}min (${parsed.estimated_volume_liters}L)`;
                    } else if (parsed.is_structured_fertilization) {
                        notesText = `Tonnage/Engrais: ${parsed.product_name} (NPK: ${parsed.npk_ratio}, Dosage: ${parsed.dosage_value} ${parsed.dosage_unit})`;
                    }
                } catch (e) {
                    // fallback
                }
            }

            return {
                'Date': date,
                "Type d'Activité": type,
                'Billon': billonName,
                'Parcelle': plotName,
                'Détails / Notes': notesText,
                'Opérateur': act.performed_by || 'Système'
            };
        }) || [];

        const worksheet = XLSX.utils.json_to_sheet(formattedData)
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        const csvContent = "\uFEFF" + csv;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ISIAOM_Activites_Billons_${date}.csv`)

        return { success: true, count: acts?.length || 0 }
    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error }
    }
}
