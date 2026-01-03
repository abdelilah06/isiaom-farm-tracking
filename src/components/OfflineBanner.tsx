import React from 'react';
import { useOffline } from '../lib/OfflineContext';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const OfflineBanner: React.FC = () => {
    const { isOnline, lastSyncTime, isSyncing, syncSuccess } = useOffline();
    const { t, i18n } = useTranslation();

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '---';
        return new Date(isoString).toLocaleTimeString(i18n.language, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            {(!isOnline || syncSuccess) && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`${syncSuccess ? 'bg-green-600' : 'bg-orange-500'} text-white overflow-hidden`}
                >
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            {syncSuccess ? (
                                <>
                                    <RefreshCw className="h-4 w-4" />
                                    <span>{t('offline.synced')}</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-4 w-4" />
                                    <span>{t('offline.you_are_offline')}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 opacity-80">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{t('offline.last_sync')}: {formatTime(lastSyncTime)}</span>
                            </div>
                            {isSyncing && (
                                <div className="flex items-center gap-1.5">
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    <span>{t('offline.syncing')}...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
