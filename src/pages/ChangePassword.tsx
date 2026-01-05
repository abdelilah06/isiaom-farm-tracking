import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function ChangePassword() {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'
    const navigate = useNavigate()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        // Validation
        if (newPassword.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
            setLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError('كلمات المرور غير متطابقة')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/admin')
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-blue-50/30"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <header className="glass sticky top-0 z-30 border-b border-white/20 shadow-lg">
                <div className="max-w-3xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all group"
                        >
                            <ArrowLeft className={`h-6 w-6 text-white ${isRtl ? 'rotate-180' : ''} group-hover:scale-110 transition-transform`} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">تغيير كلمة المرور</h1>
                            <p className="text-xs text-gray-500 font-medium">Change Password</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                >
                    <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">تحديث كلمة المرور</h2>
                                <p className="text-sm text-gray-600">قم بتغيير كلمة المرور الخاصة بك</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 flex items-center gap-3"
                            >
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl mb-6 flex items-center gap-3"
                            >
                                <Check className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm font-bold">تم تغيير كلمة المرور بنجاح! جاري التحويل...</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    كلمة المرور الجديدة
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm"
                                    placeholder="أدخل كلمة المرور الجديدة"
                                    minLength={6}
                                />
                                <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    تأكيد كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm"
                                    placeholder="أعد إدخال كلمة المرور"
                                    minLength={6}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin')}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 shadow-md"
                                >
                                    {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </main>
        </motion.div>
    )
}
