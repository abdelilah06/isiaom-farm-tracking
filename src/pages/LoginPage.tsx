import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LoginPage() {
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            navigate('/admin')
        } catch (err: any) {
            setError(t('login.error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500 rounded-full blur-[100px] dark:opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[100px] dark:opacity-20" />
            </div>

            <nav className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                </Link>
                <LanguageSwitcher />
            </nav>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl shadow-green-900/10 border border-gray-100 dark:border-gray-800 p-10 md:p-12 relative z-10">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ rotate: -20, scale: 0.5 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="inline-flex w-20 h-20 bg-gradient-primary rounded-3xl mb-6 items-center justify-center shadow-2xl shadow-green-500/40"
                        >
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </motion.div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
                            {t('login.title')}
                        </h1>
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                            {t('login.subtitle')}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 p-5 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-4"
                        >
                            <div className="w-1.5 h-6 bg-red-500 rounded-full flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
                                {t('login.email')}
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold shadow-sm"
                                placeholder="admin@isiaom.ma"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
                                {t('login.password')}
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-bold shadow-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4">
                            <motion.button
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    t('login.submit')
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-12">
                    <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.5em]">
                        ISIAOM Agricultural Hub
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
