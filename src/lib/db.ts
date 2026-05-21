import { openDB } from 'idb';

const DB_NAME = 'isiaom-pwa-db';
const DB_VERSION = 2;

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
            // Cache for billons
            if (!db.objectStoreNames.contains('billons')) {
                db.createObjectStore('billons', { keyPath: 'id' });
            }
            // Cache for billon activities
            if (!db.objectStoreNames.contains('billon_activities')) {
                db.createObjectStore('billon_activities', { keyPath: 'id' });
            }
            // Queue for offline billon activities
            if (!db.objectStoreNames.contains('billon_activities_queue')) {
                db.createObjectStore('billon_activities_queue', { keyPath: 'id', autoIncrement: true });
            }
            // Cache for billon cycles
            if (!db.objectStoreNames.contains('billon_cycles')) {
                db.createObjectStore('billon_cycles', { keyPath: 'id' });
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

// Billons Cache
export async function cacheBillons(billons: any[]) {
    const db = await initDB();
    const tx = db.transaction('billons', 'readwrite');
    await tx.objectStore('billons').clear();
    for (const b of billons) {
        await tx.objectStore('billons').put(b);
    }
    await tx.done;
}

export async function getCachedBillons() {
    const db = await initDB();
    return db.getAll('billons');
}

export async function getCachedBillon(id: string) {
    const db = await initDB();
    return db.get('billons', id);
}

// Billon Activities Cache
export async function cacheBillonActivities(activities: any[]) {
    const db = await initDB();
    const tx = db.transaction('billon_activities', 'readwrite');
    for (const a of activities) {
        await tx.objectStore('billon_activities').put(a);
    }
    await tx.done;
}

export async function getCachedActivitiesForBillon(billonId: string) {
    const db = await initDB();
    const acts = await db.getAll('billon_activities');
    return acts.filter(a => a.billon_id === billonId);
}

// Billon Activities Offline Queue
export interface OfflineBillonActivity {
    id?: string;
    billon_id: string;
    activity_type: string;
    notes?: string;
    image_file?: Blob;
    status: 'pending' | 'syncing' | 'failed';
    error?: string;
    retryCount: number;
}

export async function queueBillonActivity(op: Omit<OfflineBillonActivity, 'status' | 'retryCount'>) {
    const db = await initDB();
    return db.add('billon_activities_queue', {
        ...op,
        status: 'pending',
        retryCount: 0
    });
}

export async function getQueuedBillonActivities(): Promise<(OfflineBillonActivity & { id: number })[]> {
    const db = await initDB();
    return db.getAll('billon_activities_queue');
}

export async function updateQueuedBillonActivity(id: number, updates: Partial<OfflineBillonActivity>) {
    const db = await initDB();
    const op = await db.get('billon_activities_queue', id);
    if (op) {
        await db.put('billon_activities_queue', { ...op, ...updates }, id);
    }
}

export async function removeQueuedBillonActivity(id: number) {
    const db = await initDB();
    await db.delete('billon_activities_queue', id);
}

// Billon Cycles Cache
export async function cacheBillonCycles(cycles: any[]) {
    const db = await initDB();
    const tx = db.transaction('billon_cycles', 'readwrite');
    for (const c of cycles) {
        await tx.objectStore('billon_cycles').put(c);
    }
    await tx.done;
}

export async function getCachedCyclesForBillon(billonId: string) {
    const db = await initDB();
    const cycles = await db.getAll('billon_cycles');
    return cycles.filter(c => c.billon_id === billonId);
}

export async function getCachedCycle(id: string) {
    const db = await initDB();
    return db.get('billon_cycles', id);
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
