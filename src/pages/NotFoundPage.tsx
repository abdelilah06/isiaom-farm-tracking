import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Leaf } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-lg w-full text-center relative z-10"
            >
                {/* Icon */}
                <motion.div
                    initial={{ rotate: -20, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="inline-flex w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[2.5rem] mb-8 items-center justify-center shadow-2xl shadow-green-500/30 mx-auto"
                >
                    <Leaf className="h-14 w-14 text-white" />
                </motion.div>

                {/* 404 Number */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[8rem] md:text-[10rem] font-black text-gray-100 dark:text-gray-800 leading-none tracking-tighter select-none"
                >
                    404
                </motion.h1>

                {/* Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="-mt-8"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                        {t('not_found.title', 'الصفحة غير موجودة')}
                    </h2>
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto mb-10">
                        {t('not_found.description', 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها')}
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all min-h-[48px]"
                    >
                        <Home className="h-5 w-5" />
                        {t('not_found.go_home', 'الصفحة الرئيسية')}
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-105 transition-all min-h-[48px]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        {t('not_found.go_back', 'العودة')}
                    </button>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-8 text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.5em]">
                ISIAOM Agricultural Hub
            </div>
        </div>
    )
}
