import { QRCodeSVG } from 'qrcode.react'
import { X, ExternalLink, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface QRCodeGeneratorProps {
    plotId: string
    onClose: () => void
}

export default function QRCodeGenerator({ plotId, onClose }: QRCodeGeneratorProps) {
    const { t } = useTranslation()
    const url = `${window.location.origin}/plot/${plotId}`

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700"
                >
                    <div className="px-6 py-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">QR Code</span>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-8 flex flex-col items-center text-center">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                            {t('qr.title', { defaultValue: 'Lien de la parcelle' })}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-8 uppercase tracking-wider">
                            ID: <span className="text-green-600 dark:text-green-400">{plotId}</span>
                        </p>

                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-green-500/10 mb-8 border border-green-50">
                            <QRCodeSVG value={url} size={200} level="H" includeMargin={true} />
                        </div>

                        <div className="space-y-4 w-full">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white h-14 rounded-2xl font-black text-sm shadow-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all group"
                            >
                                <span>{t('qr.open_link', { defaultValue: 'Ouvrir le lien' })}</span>
                                <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>

                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] text-gray-400 dark:text-gray-500 font-bold break-all border border-gray-100 dark:border-gray-700/50 font-mono">
                                {url}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
