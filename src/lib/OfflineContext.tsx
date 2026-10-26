import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { uploadImage } from './upload';
import { parseActivity } from './activityData';
import {
    getQueuedOperations,
    removeQueuedOperation,
    updateQueuedOperation,
    getQueuedBillonActivities,
    removeQueuedBillonActivity,
    updateQueuedBillonActivity,
    setLastSyncTime,
    getLastSyncTime
} from './db';

interface OfflineContextType {
    isOnline: boolean;
    lastSyncTime: string | null;
    isSyncing: boolean;
    syncSuccess: boolean;
    syncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastSyncTime, setLastSyncTimeState] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const syncQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;
        setIsSyncing(true);
        if (import.meta.env.DEV) console.log('Starting sync...');

        // Sync plot operations queue
        const opQueue = await getQueuedOperations();
        for (const op of opQueue) {
            try {
                await updateQueuedOperation(op.id, { status: 'syncing' });

                let imageUrl = null;
                if (op.image_file) {
                    const file = op.image_file instanceof File 
                        ? op.image_file 
                        : new File([op.image_file], `${Date.now()}-proof.jpg`, { type: 'image/jpeg' });
                    try {
                        imageUrl = await uploadImage(file, 'operations-images');
                    } catch {
                        imageUrl = await uploadImage(file, 'operation-proofs');
                    }
                }

                const parsed = parseActivity(op.notes);
                const metadataPayload = parsed.type !== 'standard' ? parsed.data : {};

                const insertBody: any = {
                    plot_id: op.plot_id,
                    type: op.type,
                    notes: op.notes,
                    metadata: metadataPayload,
                    date: op.date,
                    image_url: imageUrl
                };

                let { error: insertError } = await supabase
                    .from('operations')
                    .insert([insertBody]);

                if (insertError && (insertError.message?.includes('metadata') || (insertError as any).code === 'PGRST204')) {
                    delete insertBody.metadata;
                    const retry = await supabase.from('operations').insert([insertBody]);
                    insertError = retry.error;
                }

                if (insertError) throw insertError;

                await removeQueuedOperation(op.id);
            } catch (error) {
                console.error('Failed to sync operation:', error);
                await updateQueuedOperation(op.id, {
                    status: 'failed',
                    error: (error as Error).message,
                    retryCount: op.retryCount + 1
                });
            }
        }

        // Sync billon activities queue
        const billonQueue = await getQueuedBillonActivities();
        for (const op of billonQueue) {
            try {
                await updateQueuedBillonActivity(op.id, { status: 'syncing' });

                let imageUrl = null;
                if (op.image_file) {
                    const file = op.image_file instanceof File 
                        ? op.image_file 
                        : new File([op.image_file], `${Date.now()}-proof.jpg`, { type: 'image/jpeg' });
                    try {
                        imageUrl = await uploadImage(file, 'operations-images');
                    } catch {
                        imageUrl = await uploadImage(file, 'operation-proofs');
                    }
                }

                const parsed = parseActivity(op.notes);
                const metadataPayload = parsed.type !== 'standard' ? parsed.data : {};

                const insertBody: any = {
                    billon_id: op.billon_id,
                    activity_type: op.activity_type,
                    notes: op.notes,
                    metadata: metadataPayload,
                    image_url: imageUrl,
                    performed_at: new Date().toISOString()
                };

                let { error: insertError } = await supabase
                    .from('billon_activities')
                    .insert([insertBody]);

                if (insertError && (insertError.message?.includes('metadata') || (insertError as any).code === 'PGRST204')) {
                    delete insertBody.metadata;
                    const retry = await supabase.from('billon_activities').insert([insertBody]);
                    insertError = retry.error;
                }

                if (insertError) throw insertError;
                await removeQueuedBillonActivity(op.id);
            } catch (error) {
                console.error('Failed to sync billon activity:', error);
                await updateQueuedBillonActivity(op.id, {
                    status: 'failed',
                    error: (error as Error).message,
                    retryCount: op.retryCount + 1
                });
            }
        }

        const now = new Date().toISOString();
        await setLastSyncTime(now);
        setLastSyncTimeState(now);
        setIsSyncing(false);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 5000);
        if (import.meta.env.DEV) console.log('Sync completed.');
    }, [isSyncing]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setSyncSuccess(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync time load
        getLastSyncTime().then(setLastSyncTimeState);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncQueue]);

    return (
        <OfflineContext.Provider value={{ isOnline, lastSyncTime, isSyncing, syncSuccess, syncQueue }}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};
