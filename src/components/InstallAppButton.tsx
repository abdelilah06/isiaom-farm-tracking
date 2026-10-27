import { useState, useEffect } from 'react'
import { Download, Smartphone, X, Share, PlusSquare, Check, Laptop } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface InstallAppButtonProps {
    variant?: 'navbar' | 'footer' | 'pill'
    className?: string
}

export default function InstallAppButton({ variant = 'navbar', className = '' }: InstallAppButtonProps) {
    const { i18n } = useTranslation()
    const isArabic = i18n.language === 'ar'
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Detect if already installed in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as unknown as { standalone?: boolean }).standalone === true
        setIsInstalled(isStandalone)

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIosDevice)

        // Catch the native PWA install prompt
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        window.addEventListener('beforeinstallprompt', handler)
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true)
            setDeferredPrompt(null)
            setShowModal(false)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstallClick = async () => {
        if (isInstalled) {
            setShowModal(true)
            return
        }

        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt()
                const choice = await deferredPrompt.userChoice
                if (choice.outcome === 'accepted') {
                    setIsInstalled(true)
                }
                setDeferredPrompt(null)
            } catch (err) {
                console.error('PWA install prompt error:', err)
                setShowModal(true)
            }
        } else {
            // Show guide modal when beforeinstallprompt is not directly available (e.g. iOS Safari or desktop)
            setShowModal(true)
        }
    }

    return (
        <>
            {/* Navbar Variant */}
            {variant === 'navbar' && (
                <button
                    type="button"
                    onClick={handleInstallClick}
                    className={`p-2.5 sm:px-3 sm:py-2 rounded-xl border transition-all min-h-[40px] flex items-center gap-2 group ${
                        isInstalled
                            ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800 hover:border-green-500/40 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/30'
                    } ${className}`}
                    title={isArabic ? 'تثبيت البرنامج' : "Télécharger / Installer l'application"}
                    aria-label={isArabic ? 'تثبيت البرنامج' : "Installer l'application"}
                >
                    <Download className="h-4 w-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                    <span className="hidden lg:inline text-xs font-black uppercase tracking-wider">
                        {isInstalled 
                            ? (isArabic ? 'مثبّت' : 'Installé')
                            : (isArabic ? 'تحميل البرنامج' : 'Télécharger')}
                    </span>
                </button>
            )}

            {/* Footer Variant */}
            {variant === 'footer' && (
                <button
                    type="button"
                    onClick={handleInstallClick}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        isInstalled
                            ? 'bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                            : 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md shadow-green-600/20 hover:scale-105 active:scale-95'
                    } ${className}`}
                >
                    {isInstalled ? (
                        <>
                            <Check className="h-4 w-4" />
                            <span>{isArabic ? 'البرنامج مثبّت' : 'App Installée'}</span>
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            <span>{isArabic ? 'تحميل البرنامج' : 'Télécharger l\'App'}</span>
                        </>
                    )}
                </button>
            )}

            {/* Pill Variant */}
            {variant === 'pill' && (
                <button
                    type="button"
                    onClick={handleInstallClick}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                        isInstalled
                            ? 'bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-600'
                    } ${className}`}
                >
                    <Download className="h-3 w-3 text-green-500" />
                    <span>{isArabic ? 'تثبيت التطبيق' : 'Installer PWA'}</span>
                </button>
            )}

            {/* Installation Instructions Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">
                                        {isArabic ? 'تحميل وتثبيت برنامج ISIAOM' : 'Installer l\'Application ISIAOM'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isArabic ? 'تطبيق ويب تقدمي (PWA) يعمل بدون إنترنت' : 'Application PWA autonome & hors-ligne'}
                                    </p>
                                </div>
                            </div>

                            {isInstalled ? (
                                <div className="text-center py-6 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-200 dark:border-green-800/50 mb-4">
                                    <Check className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                    <p className="font-bold text-sm text-green-800 dark:text-green-300">
                                        {isArabic ? 'البرنامج مثبت بالفعل على جهازك!' : 'L\'application est déjà installée sur votre appareil !'}
                                    </p>
                                </div>
                            ) : isIOS ? (
                                <div className="space-y-4 mb-6 text-sm text-gray-600 dark:text-gray-300">
                                    <p className="font-medium">
                                        {isArabic 
                                            ? 'لتثبيت التطبيق على جهاز آيفون أو آيباد (Safari):' 
                                            : 'Pour installer l\'application sur iPhone / iPad (Safari) :'}
                                    </p>
                                    <ol className="space-y-3 pl-2">
                                        <li className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-black flex items-center justify-center shrink-0">1</span>
                                            <span className="flex items-center gap-1.5">
                                                {isArabic ? 'اضغط على زر المشاركة' : 'Appuyez sur le bouton Partager'}
                                                <Share className="h-4 w-4 text-blue-500 inline" />
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-black flex items-center justify-center shrink-0">2</span>
                                            <span className="flex items-center gap-1.5">
                                                {isArabic ? 'اختر "إضافة إلى الصفحة الرئيسية"' : 'Sélectionnez "Sur l\'écran d\'accueil"'}
                                                <PlusSquare className="h-4 w-4 text-gray-700 dark:text-gray-300 inline" />
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-black flex items-center justify-center shrink-0">3</span>
                                            <span>{isArabic ? 'اضغط على "إضافة" في الزاوية العلوية.' : 'Appuyez sur "Ajouter" en haut à droite.'}</span>
                                        </li>
                                    </ol>
                                </div>
                            ) : (
                                <div className="space-y-4 mb-6 text-sm text-gray-600 dark:text-gray-300">
                                    <p className="font-medium">
                                        {isArabic
                                            ? 'لتثبيت البرنامج على أندرويد أو الحاسوب (Chrome / Edge):'
                                            : 'Pour installer l\'application sur Android ou Ordinateur (Chrome / Edge) :'}
                                    </p>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Laptop className="h-4 w-4 text-green-500" />
                                            <span className="font-bold">
                                                {isArabic ? 'على الحاسوب:' : 'Sur Ordinateur :'}
                                            </span>
                                            <span>
                                                {isArabic ? 'اضغط على أيقونة التثبيت ⊕ في شريط العنوان أعلى المتصفح.' : 'Cliquez sur l\'icône ⊕ dans la barre d\'adresse.'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                            <Smartphone className="h-4 w-4 text-green-500" />
                                            <span className="font-bold">
                                                {isArabic ? 'على الهاتف:' : 'Sur Téléphone :'}
                                            </span>
                                            <span>
                                                {isArabic ? 'اضغط على قائمة المتصفح (⋮) ثم اختر "تثبيت التطبيق".' : 'Ouvrez le menu (⋮) et cliquez sur "Installer l\'application".'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                                >
                                    {isArabic ? 'حسناً، فهمت' : 'D\'accord'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
