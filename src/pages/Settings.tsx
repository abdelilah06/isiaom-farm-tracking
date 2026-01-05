import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft, Mail, Download, Moon, Sun, Check, AlertCircle,
    FileSpreadsheet, FileText, Package
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { exportPlotsToExcel, exportOperationsToExcel, exportToCSV, exportFullReport } from '@/lib/export'

export default function Settings() {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState<'account' | 'data' | 'appearance'>('account')

    // Email update state
    const [newEmail, setNewEmail] = useState('')
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [emailSuccess, setEmailSuccess] = useState(false)

    // Export state
    const [exportLoading, setExportLoading] = useState(false)
    const [exportMessage, setExportMessage] = useState<string | null>(null)

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
            setEmailError(err.message || 'حدث خطأ أثناء تحديث البريد الإلكتروني')
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
                setExportMessage('✅ تم التصدير بنجاح!')
                setTimeout(() => setExportMessage(null), 3000)
            } else {
                setExportMessage('❌ فشل التصدير')
            }
        } catch (error) {
            setExportMessage('❌ حدث خطأ أثناء التصدير')
        } finally {
            setExportLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
            dir="rtl"
        >
            {/* Header */}
            <header className="glass sticky top-0 z-30 border-b border-white/20 dark:border-gray-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all group"
                        >
                            <ArrowLeft className="h-6 w-6 text-white rotate-180 group-hover:scale-110 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">الإعدادات</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Settings</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <nav className="p-2">
                                <button
                                    onClick={() => setActiveTab('account')}
                                    className={`w-full text-right px-4 py-3 rounded-2xl font-bold transition-all mb-1 ${activeTab === 'account'
                                            ? 'bg-gradient-primary text-white shadow-md'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Mail className="h-5 w-5 inline ml-2" />
                                    الحساب
                                </button>
                                <button
                                    onClick={() => setActiveTab('data')}
                                    className={`w-full text-right px-4 py-3 rounded-2xl font-bold transition-all mb-1 ${activeTab === 'data'
                                            ? 'bg-gradient-primary text-white shadow-md'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Download className="h-5 w-5 inline ml-2" />
                                    البيانات
                                </button>
                                <button
                                    onClick={() => setActiveTab('appearance')}
                                    className={`w-full text-right px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'appearance'
                                            ? 'bg-gradient-primary text-white shadow-md'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {theme === 'dark' ? (
                                        <Moon className="h-5 w-5 inline ml-2" />
                                    ) : (
                                        <Sun className="h-5 w-5 inline ml-2" />
                                    )}
                                    المظهر
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Change Password */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">تغيير كلمة المرور</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        قم بتحديث كلمة المرور الخاصة بك للحفاظ على أمان حسابك
                                    </p>
                                    <Link
                                        to="/admin/change-password"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all shadow-md"
                                    >
                                        تغيير كلمة المرور
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </div>

                                {/* Update Email */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">تحديث البريد الإلكتروني</h3>

                                    {emailError && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-2xl mb-4 flex items-center gap-3">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                            <p className="text-sm font-bold">{emailError}</p>
                                        </div>
                                    )}

                                    {emailSuccess && (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-2xl mb-4 flex items-center gap-3">
                                            <Check className="h-5 w-5 flex-shrink-0" />
                                            <p className="text-sm font-bold">تم إرسال رابط التأكيد إلى بريدك الجديد!</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                البريد الإلكتروني الجديد
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm"
                                                placeholder="admin@example.com"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={emailLoading || emailSuccess}
                                            className="px-6 py-3 bg-gradient-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 shadow-md"
                                        >
                                            {emailLoading ? 'جاري التحديث...' : 'تحديث البريد'}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* Data Tab */}
                        {activeTab === 'data' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
                            >
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">تصدير البيانات</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    قم بتصدير بياناتك إلى ملفات Excel أو CSV
                                </p>

                                {exportMessage && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 p-4 rounded-2xl mb-6">
                                        <p className="text-sm font-bold">{exportMessage}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Plots Export */}
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">القطع</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Plots Data</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleExport('plots-excel')}
                                                disabled={exportLoading}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                                            >
                                                <FileSpreadsheet className="h-4 w-4 inline ml-1" />
                                                Excel
                                            </button>
                                            <button
                                                onClick={() => handleExport('plots-csv')}
                                                disabled={exportLoading}
                                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition-all disabled:opacity-50"
                                            >
                                                <FileText className="h-4 w-4 inline ml-1" />
                                                CSV
                                            </button>
                                        </div>
                                    </div>

                                    {/* Operations Export */}
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">العمليات</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Operations Data</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleExport('ops-excel')}
                                                disabled={exportLoading}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                                            >
                                                <FileSpreadsheet className="h-4 w-4 inline ml-1" />
                                                Excel
                                            </button>
                                            <button
                                                onClick={() => handleExport('ops-csv')}
                                                disabled={exportLoading}
                                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition-all disabled:opacity-50"
                                            >
                                                <FileText className="h-4 w-4 inline ml-1" />
                                                CSV
                                            </button>
                                        </div>
                                    </div>

                                    {/* Full Report */}
                                    <div className="md:col-span-2 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-4 bg-purple-50/50 dark:bg-purple-900/10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                                <FileSpreadsheet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">تقرير شامل</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Full Report (Plots + Operations)</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleExport('full')}
                                            disabled={exportLoading}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
                                        >
                                            {exportLoading ? 'جاري التصدير...' : 'تصدير التقرير الشامل'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
                            >
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">المظهر</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    اختر الوضع الليلي أو النهاري حسب تفضيلاتك
                                </p>

                                <div className="flex items-center justify-between p-6 border border-gray-200 dark:border-gray-600 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-100'
                                            }`}>
                                            {theme === 'dark' ? (
                                                <Moon className="h-6 w-6 text-blue-400" />
                                            ) : (
                                                <Sun className="h-6 w-6 text-yellow-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`relative w-16 h-8 rounded-full transition-all ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-1' : 'right-9'
                                            }`} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </motion.div>
    )
}
