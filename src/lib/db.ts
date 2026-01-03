import { openDB } from 'idb';

const DB_NAME = 'isiaom-pwa-db';
const DB_VERSION = 1;

export interface OfflineOperation {
    id?: string; // local id
    plot_id: string;
    type: string;
    notes?: string;
    date: string;
    image_file?: Blob;
    status: 'pending' | 'syncing' | 'failed';
    error?: string;
    retryCount: number;
}

export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Cache for plots
            if (!db.objectStoreNames.contains('plots')) {
                db.createObjectStore('plots', { keyPath: 'id' });
            }
            // Cache for operations
            if (!db.objectStoreNames.contains('operations')) {
                db.createObjectStore('operations', { keyPath: 'id' });
            }
            // Queue for offline operations
            if (!db.objectStoreNames.contains('operations_queue')) {
                db.createObjectStore('operations_queue', { keyPath: 'id', autoIncrement: true });
            }
            // App state / Sync status
            if (!db.objectStoreNames.contains('app_state')) {
                db.createObjectStore('app_state');
            }
        },
    });
}

// Plots Cache
export async function cachePlots(plots: any[]) {
    const db = await initDB();
    const tx = db.transaction('plots', 'readwrite');
    await tx.objectStore('plots').clear();
    for (const plot of plots) {
        await tx.objectStore('plots').put(plot);
    }
    await tx.done;
}

export async function getCachedPlots() {
    const db = await initDB();
    return db.getAll('plots');
}

export async function getCachedPlot(id: string) {
    const db = await initDB();
    return db.get('plots', id);
}

// Operations Cache
export async function cacheOperations(ops: any[]) {
    const db = await initDB();
    const tx = db.transaction('operations', 'readwrite');
    for (const op of ops) {
        await tx.objectStore('operations').put(op);
    }
    await tx.done;
}

export async function getCachedOperationsForPlot(plotId: string) {
    const db = await initDB();
    const ops = await db.getAll('operations');
    return ops.filter(op => op.plot_id === plotId);
}

// Operations Queue
export async function queueOperation(op: Omit<OfflineOperation, 'status' | 'retryCount'>) {
    const db = await initDB();
    return db.add('operations_queue', {
        ...op,
        status: 'pending',
        retryCount: 0
    });
}

export async function getQueuedOperations(): Promise<(OfflineOperation & { id: number })[]> {
    const db = await initDB();
    return db.getAll('operations_queue');
}

export async function updateQueuedOperation(id: number, updates: Partial<OfflineOperation>) {
    const db = await initDB();
    const op = await db.get('operations_queue', id);
    if (op) {
        await db.put('operations_queue', { ...op, ...updates }, id);
    }
}

export async function removeQueuedOperation(id: number) {
    const db = await initDB();
    await db.delete('operations_queue', id);
}

// Sync Status
export async function setLastSyncTime(time: string) {
    const db = await initDB();
    await db.put('app_state', time, 'lastSyncTime');
}

export async function getLastSyncTime() {
    const db = await initDB();
    return db.get('app_state', 'lastSyncTime');
}
