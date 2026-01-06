import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft, Mail, Download, Moon, Sun, Check, AlertCircle,
    FileSpreadsheet, Package, Leaf, Lock, Shield, Settings as SettingsIcon, Loader2,
    Bell, Smartphone, ToggleLeft, ToggleRight, Droplets
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { exportPlotsToExcel, exportOperationsToExcel, exportToCSV, exportFullReport } from '@/lib/export'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Settings() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState<'account' | 'data' | 'appearance' | 'notifications'>('account')

    // Email update state
    const [newEmail, setNewEmail] = useState('')
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [emailSuccess, setEmailSuccess] = useState(false)

    // Export state
    const [exportLoading, setExportLoading] = useState(false)
    const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Notifications state
    const [notificationPrefs, setNotificationPrefs] = useState({
        irrigation_alerts: true,
        pest_alerts: true,
        harvest_reminders: true,
        system_updates: true,
        email_notifications: true,
        push_notifications: false
    })
    const [prefsLoading, setPrefsLoading] = useState(false)

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setEmailLoading(true)
        setEmailError(null)
        setEmailSuccess(false)

        try {
            const { error } = await supabase.auth.updateUser({
                email: newEmail
            })

            if (error) throw error

            setEmailSuccess(true)
            setNewEmail('')
            setTimeout(() => setEmailSuccess(false), 5000)
        } catch (err: any) {
            setEmailError(err.message || t('common.error'))
        } finally {
            setEmailLoading(false)
        }
    }

    const handleExport = async (type: 'plots-excel' | 'ops-excel' | 'plots-csv' | 'ops-csv' | 'full') => {
        setExportLoading(true)
        setExportMessage(null)

        try {
            let result
            switch (type) {
                case 'plots-excel':
                    result = await exportPlotsToExcel()
                    break
                case 'ops-excel':
                    result = await exportOperationsToExcel()
                    break
                case 'plots-csv':
                    result = await exportToCSV('plots')
                    break
                case 'ops-csv':
                    result = await exportToCSV('operations')
                    break
                case 'full':
                    result = await exportFullReport()
                    break
            }

            if (result.success) {
                setExportMessage({ type: 'success', text: '✅ ' + t('common.success') })
                setTimeout(() => setExportMessage(null), 3000)
            } else {
                setExportMessage({ type: 'error', text: '❌ ' + t('common.error') })
            }
        } catch (error) {
            setExportMessage({ type: 'error', text: '❌ ' + t('common.error') })
        } finally {
            setExportLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-950"
        >
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 h-20">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-950 font-black shadow-lg">
                                <SettingsIcon className="h-4 w-4" />
                            </div>
                            <span className="font-black text-xs tracking-widest text-gray-900 dark:text-white uppercase">{t('settings.title')}</span>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-32 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 p-4 sticky top-32">
                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('account')}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'account'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-2xl'
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Mail className="h-4 w-4" />
                                    {t('settings.tabs.account')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('data')}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'data'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-2xl'
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Download className="h-4 w-4" />
                                    {t('settings.tabs.data')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('appearance')}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'appearance'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-2xl'
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                    {t('settings.tabs.appearance')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notifications'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-2xl'
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Bell className="h-4 w-4" />
                                    {t('settings.tabs.notifications')}
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {/* Account Section */}
                            {activeTab === 'account' && (
                                <motion.div
                                    key="account"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 overflow-hidden">
                                        <div className="p-10 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-gradient-primary rounded-[1.5rem] flex items-center justify-center shadow-lg">
                                                    <Lock className="h-8 w-8 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('account.change_password')}</h3>
                                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('account.password_subtitle')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/admin/change-password')}
                                                className="px-8 py-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-750 transition-all border border-transparent dark:border-gray-700 shadow-sm"
                                            >
                                                Mettre à jour
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 p-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-1.5 h-8 bg-green-500 rounded-full" />
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                {t('account.update_email')}
                                            </h3>
                                        </div>

                                        <form onSubmit={handleUpdateEmail} className="space-y-8 max-w-xl">
                                            <div className="space-y-3">
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
                                                    {t('account.new_email')}
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    className="w-full px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold shadow-sm"
                                                    placeholder="new-admin@isiaom.ma"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={emailLoading || emailSuccess}
                                                className="px-12 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
                                            >
                                                {emailLoading ? t('common.loading') : 'Confirmer le Changement'}
                                            </button>

                                            <AnimatePresence>
                                                {(emailError || emailSuccess) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`p-6 rounded-2xl flex items-center gap-4 text-[11px] font-black uppercase tracking-widest border ${emailSuccess
                                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50'
                                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'}`}
                                                    >
                                                        {emailSuccess ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                                        {emailSuccess ? t('account.confirm_sent') : emailError}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {/* Data Section */}
                            {activeTab === 'data' && (
                                <motion.div
                                    key="data"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 p-10">
                                        <div className="mb-12">
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Centre d'Exportation</h3>
                                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">Gérez vos données agricoles hors ligne</p>
                                        </div>

                                        <AnimatePresence>
                                            {exportMessage && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={`p-6 rounded-2xl mb-10 flex items-center gap-4 text-[11px] font-black uppercase tracking-widest border ${exportMessage.type === 'success'
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50'
                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'
                                                        }`}
                                                >
                                                    {exportMessage.text}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Plots Card */}
                                            <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 group hover:border-green-500/30 transition-all duration-500">
                                                <div className="flex items-center gap-5 mb-8">
                                                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md">
                                                        <Package className="h-7 w-7 text-green-500" />
                                                    </div>
                                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Liste des Parcelles</h4>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => handleExport('plots-excel')}
                                                        className="flex-1 px-4 py-4 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-700 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm"
                                                    >
                                                        Excel
                                                    </button>
                                                    <button
                                                        onClick={() => handleExport('plots-csv')}
                                                        className="flex-1 px-4 py-4 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-700 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-950 transition-all shadow-sm"
                                                    >
                                                        CSV
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Operations Card */}
                                            <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 group hover:border-blue-500/30 transition-all duration-500">
                                                <div className="flex items-center gap-5 mb-8">
                                                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md">
                                                        <FileSpreadsheet className="h-7 w-7 text-blue-500" />
                                                    </div>
                                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Historique Logs</h4>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => handleExport('ops-excel')}
                                                        className="flex-1 px-4 py-4 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm"
                                                    >
                                                        Excel
                                                    </button>
                                                    <button
                                                        onClick={() => handleExport('ops-csv')}
                                                        className="flex-1 px-4 py-4 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-700 hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                                    >
                                                        CSV
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Full Report Upgrade */}
                                            <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-900 dark:to-emerald-950 p-10 rounded-[3rem] text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12">
                                                    <Leaf className="h-32 w-32" />
                                                </div>
                                                <div className="relative z-10">
                                                    <h4 className="text-3xl font-black mb-4 uppercase tracking-tighter leading-tight">Générer le Rapport<br />Technique Intégral</h4>
                                                    <p className="text-green-50/80 mb-10 font-bold max-w-lg text-sm leading-relaxed">Fusionnez toutes les parcelles et les opérations historiques dans un document maître optimisé pour l'analyse.</p>
                                                    <button
                                                        onClick={() => handleExport('full')}
                                                        disabled={exportLoading}
                                                        className="inline-flex items-center gap-4 px-10 py-5 bg-white text-green-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-green-50 transition-all disabled:opacity-50"
                                                    >
                                                        {exportLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                                                        Exporter Tout le Projet
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Appearance Section */}
                            {activeTab === 'appearance' && (
                                <motion.div
                                    key="appearance"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 p-10"
                                >
                                    <div className="mb-12">
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Design & Vision</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">Optimisez votre confort de lecture</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <button
                                            onClick={() => theme !== 'light' && toggleTheme()}
                                            className={`group relative overflow-hidden rounded-[2.5rem] p-10 border-2 transition-all text-left ${theme === 'light'
                                                ? 'border-green-500 bg-green-50/30 shadow-2xl shadow-green-900/10'
                                                : 'border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] hover:border-green-500/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-16">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${theme === 'light' ? 'bg-white text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>
                                                    <Sun className="h-8 w-8" />
                                                </div>
                                                {theme === 'light' && (
                                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                        <Check className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tight mb-2">Clair</h4>
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">High Clarity</p>
                                        </button>

                                        <button
                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                            className={`group relative overflow-hidden rounded-[2.5rem] p-10 border-2 transition-all text-left ${theme === 'dark'
                                                ? 'border-green-500 bg-gray-950 shadow-2xl shadow-green-900/40'
                                                : 'border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] hover:border-green-500/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-16">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${theme === 'dark' ? 'bg-gray-800 text-blue-400' : 'bg-white text-gray-400'}`}>
                                                    <Moon className="h-8 w-8" />
                                                </div>
                                                {theme === 'dark' && (
                                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                        <Check className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tight mb-2">Sombre</h4>
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">Deep Focus</p>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Notifications Section */}
                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 p-10">
                                        <div className="mb-12">
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{t('notifications.title')}</h3>
                                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">{t('notifications.subtitle')}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { id: 'irrigation_alerts', label: t('notifications.irrigation_alerts'), icon: <Droplets className="h-5 w-5" /> },
                                                { id: 'pest_alerts', label: t('notifications.pest_alerts'), icon: <AlertCircle className="h-5 w-5" /> },
                                                { id: 'harvest_reminders', label: t('notifications.harvest_reminders'), icon: <Package className="h-5 w-5" /> },
                                                { id: 'system_updates', label: t('notifications.system_updates'), icon: <SettingsIcon className="h-5 w-5" /> },
                                                { id: 'email_notifications', label: t('notifications.email'), icon: <Mail className="h-5 w-5" /> },
                                                { id: 'push_notifications', label: t('notifications.push'), icon: <Smartphone className="h-5 w-5" /> }
                                            ].map((pref) => (
                                                <button
                                                    key={pref.id}
                                                    onClick={() => setNotificationPrefs(prev => ({
                                                        ...prev,
                                                        [pref.id]: !prev[pref.id as keyof typeof notificationPrefs]
                                                    }))}
                                                    className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${notificationPrefs[pref.id as keyof typeof notificationPrefs]
                                                        ? 'border-green-500 bg-green-50/30 dark:bg-green-500/10'
                                                        : 'border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] hover:border-gray-200 dark:hover:border-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-xl transition-colors ${notificationPrefs[pref.id as keyof typeof notificationPrefs] ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600'}`}>
                                                            {pref.icon}
                                                        </div>
                                                        <span className="font-black text-[10px] uppercase tracking-widest text-gray-900 dark:text-white">
                                                            {pref.label}
                                                        </span>
                                                    </div>
                                                    {notificationPrefs[pref.id as keyof typeof notificationPrefs] ? (
                                                        <ToggleRight className="h-8 w-8 text-green-500" />
                                                    ) : (
                                                        <ToggleLeft className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-gray-50 dark:border-gray-800">
                                            <button
                                                onClick={async () => {
                                                    setPrefsLoading(true)
                                                    // Mock save delay
                                                    await new Promise(r => setTimeout(r, 1000))
                                                    setPrefsLoading(false)
                                                    setExportMessage({ type: 'success', text: t('notifications.save_success') })
                                                    setTimeout(() => setExportMessage(null), 3000)
                                                }}
                                                disabled={prefsLoading}
                                                className="w-full md:w-auto px-12 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                            >
                                                {prefsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                                {t('common.save')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </motion.div>
    )
}
