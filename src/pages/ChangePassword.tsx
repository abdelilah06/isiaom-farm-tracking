import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, ArrowLeft, Check, AlertCircle, ShieldEllipsis } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function ChangePassword() {
    const { t } = useTranslation()
    const navigate = useNavigate()
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
            setError(t('account.password_min_length'))
            setLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError(t('account.passwords_dont_match'))
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setSuccess(true)
            setNewPassword('')
            setConfirmPassword('')

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/admin/settings')
            }, 2000)
        } catch (err: any) {
            setError(err.message || t('common.error'))
        } finally {
            setLoading(false)
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
                            onClick={() => navigate('/admin/settings')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-950 font-black shadow-lg">
                                <Lock className="h-4 w-4" />
                            </div>
                            <span className="font-black text-xs tracking-widest text-gray-900 dark:text-white uppercase">Sécurité</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 py-32">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                    <div className="p-10 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-primary rounded-[1.5rem] flex items-center justify-center shadow-lg">
                                <ShieldEllipsis className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('account.update_password')}</h2>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('account.password_subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10">
                        <AnimatePresence mode="wait">
                            {(error || success) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-6 rounded-2xl mb-8 flex items-center gap-4 text-[11px] font-black uppercase tracking-widest border ${success
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'}`}
                                >
                                    {success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {success ? t('account.password_updated') : error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleChangePassword} className="space-y-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
                                    {t('account.new_password')}
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
                                    {t('account.confirm_password')}
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="pt-4">
                                <motion.button
                                    whileHover={{ y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading || success}
                                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? t('common.loading') : t('account.update_password')}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                <div className="text-center mt-12">
                    <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.5em]">
                        ISIAOM Agricultural Hub
                    </p>
                </div>
            </main>
        </motion.div>
    )
}
