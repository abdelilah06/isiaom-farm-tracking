import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/upload'
import { X, Plus, Loader2, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoGalleryProps {
    plotId: string
    isAdmin: boolean
}

interface PlotPhoto {
    id: string
    image_url: string
    caption: string | null
    photo_date: string
    created_at: string
}

export default function PhotoGallery({ plotId, isAdmin }: PhotoGalleryProps) {
    const { t } = useTranslation()
    const [photos, setPhotos] = useState<PlotPhoto[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<PlotPhoto | null>(null)

    useEffect(() => {
        fetchPhotos()
    }, [plotId])

    const fetchPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('plot_photos')
                .select('*')
                .eq('plot_id', plotId)
                .order('photo_date', { ascending: false })

            if (error) throw error
            setPhotos(data || [])
        } catch (error) {
            console.error('Error fetching photos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const image_url = await uploadImage(file, 'plot-gallery')

            const { error } = await supabase
                .from('plot_photos')
                .insert({
                    plot_id: plotId,
                    image_url,
                    photo_date: new Date().toISOString().split('T')[0]
                })

            if (error) throw error
            fetchPhotos()
        } catch (error) {
            console.error('Error uploading photo:', error)
            alert(t('common.error'))
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (photoId: string) => {
        if (!confirm(t('gallery.confirm_delete'))) return

        try {
            const { error } = await supabase
                .from('plot_photos')
                .delete()
                .eq('id', photoId)

            if (error) throw error
            setPhotos(photos.filter(p => p.id !== photoId))
            setSelectedPhoto(null)
        } catch (error) {
            console.error('Error deleting photo:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
            </div>
        )
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-lg" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {t('gallery.plot_gallery')}
                    </h2>
                </div>
                {isAdmin && (
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all">
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {t('gallery.add_photo')}
                        </div>
                    </label>
                )}
            </div>

            {/* Gallery Grid */}
            {photos.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-16 rounded-[2rem] text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">{t('gallery.no_photos')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedPhoto(photo)}
                            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all"
                        >
                            <img
                                src={photo.image_url}
                                alt={photo.caption || 'Plot photo'}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(photo.photo_date).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-4xl max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedPhoto.image_url}
                                alt={selectedPhoto.caption || 'Plot photo'}
                                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl"
                            />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <a
                                    href={selectedPhoto.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white transition-all"
                                >
                                    <ExternalLink className="h-5 w-5" />
                                </a>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(selectedPhoto.id)}
                                        className="p-3 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-xl text-white transition-all"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedPhoto(null)}
                                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {selectedPhoto.caption && (
                                <p className="absolute bottom-4 left-4 right-4 text-white text-center font-bold bg-black/50 backdrop-blur-sm py-2 px-4 rounded-xl">
                                    {selectedPhoto.caption}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
