import { QRCodeSVG } from 'qrcode.react'
import { X, ExternalLink } from 'lucide-react'

interface QRCodeGeneratorProps {
    plotId: string
    onClose: () => void
}

export default function QRCodeGenerator({ plotId, onClose }: QRCodeGeneratorProps) {
    const url = `${window.location.origin}/plot/${plotId}`

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 flex justify-between items-center">
                    <div></div> {/* Spacer for cleanup if needed or title */}
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-auto">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-8 pt-0 flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">رابط القطعة ({plotId})</h3>
                    <p className="text-gray-500 text-sm mb-6">امسح الرمز للوصول إلى صفحة المعلومات العامة</p>

                    <div className="bg-white p-4 rounded-xl border-2 border-green-100 shadow-sm mb-6">
                        <QRCodeSVG value={url} size={200} level="H" includeMargin={true} />
                    </div>

                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm bg-green-50 px-4 py-2 rounded-full"
                    >
                        <span>فتح الرابط</span>
                        <ExternalLink className="h-4 w-4" />
                    </a>

                    <div className="mt-6 w-full p-3 bg-gray-50 rounded-xl text-xs text-gray-500 break-all border border-gray-100">
                        {url}
                    </div>
                </div>
            </div>
        </div>
    )
}
