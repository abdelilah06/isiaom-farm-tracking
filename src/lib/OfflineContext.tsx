import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import {
    getQueuedOperations,
    removeQueuedOperation,
    updateQueuedOperation,
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
    }, []);

    const syncQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        const queue = await getQueuedOperations();
        if (queue.length === 0) return;

        setIsSyncing(true);
        console.log(`Starting sync for ${queue.length} items...`);

        for (const op of queue) {
            try {
                await updateQueuedOperation(op.id, { status: 'syncing' });

                let imageUrl = null;
                if (op.image_file) {
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('operation-proofs')
                        .upload(fileName, op.image_file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('operation-proofs')
                        .getPublicUrl(uploadData.path);

                    imageUrl = publicUrl;
                }

                const { error: insertError } = await supabase
                    .from('operations')
                    .insert([{
                        plot_id: op.plot_id,
                        type: op.type,
                        notes: op.notes,
                        date: op.date,
                        image_url: imageUrl
                    }]);

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

        const now = new Date().toISOString();
        await setLastSyncTime(now);
        setLastSyncTimeState(now);
        setIsSyncing(false);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 5000);
        console.log('Sync completed.');
    }, [isSyncing]);

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
