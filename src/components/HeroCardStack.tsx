import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, MapPin } from 'lucide-react'

interface HeroImage {
    id: number
    title: string
    subtitle: string
    badge: string
    src: string
}

const HERO_IMAGES: HeroImage[] = [
    {
        id: 1,
        title: "Oléiculture de Précision",
        subtitle: "Production oléicole & vergers expérimentaux de Meknès",
        badge: "Oléiculture ISIAOM",
        src: "/hero/olives.jpg"
    },
    {
        id: 2,
        title: "Serres Bioclimatiques",
        subtitle: "Recherche appliquée et cultures sous abri de pointe",
        badge: "Haute Technologie",
        src: "/hero/greenhouse.jpg"
    },
    {
        id: 3,
        title: "Campus & Espaces Agricoles",
        subtitle: "Infrastructures d'expérimentation et ferme modèle",
        badge: "Ferme Modèle",
        src: "/hero/campus.jpg"
    },
    {
        id: 4,
        title: "Oliveraies & Réseau d'Irrigation",
        subtitle: "Système de goutte-à-goutte et suivi agronomique",
        badge: "Irrigation Localisée",
        src: "/hero/pathway.jpg"
    },
    {
        id: 5,
        title: "Vergers Expérimentaux",
        subtitle: "Suivi des cycles végétatifs et de la santé des cultures",
        badge: "Expérimentation",
        src: "/hero/orchard.jpg"
    }
]

export default function HeroCardStack() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const nextCard = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, [])

    const prevCard = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)
    }, [])

    // Auto-advance every 4.5 seconds unless hovered
    useEffect(() => {
        if (isHovered) return
        const timer = setInterval(() => {
            nextCard()
        }, 4500)
        return () => clearInterval(timer)
    }, [isHovered, nextCard])

    // Get the top 3 cards in order
    const count = HERO_IMAGES.length
    const getCardAt = (offset: number) => {
        const index = (currentIndex + offset) % count
        return HERO_IMAGES[index]
    }

    const frontCard = getCardAt(0)
    const rightCard = getCardAt(1)
    const leftCard = getCardAt(2)

    return (
        <div 
            className="w-full max-w-4xl mx-auto mt-12 sm:mt-16 flex flex-col items-center select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 3D Floating Overlapping Cards Stage */}
            <div className="relative w-full h-[320px] sm:h-[420px] md:h-[460px] flex items-center justify-center perspective-[1200px]">
                
                {/* 3rd Card (Left Background) */}
                <motion.div
                    key={`bg-left-${leftCard.id}`}
                    initial={{ opacity: 0, scale: 0.8, x: -70, rotateZ: -10 }}
                    animate={{ 
                        opacity: 0.65, 
                        scale: 0.84, 
                        x: -55, 
                        y: 15,
                        rotateZ: -6,
                        zIndex: 10 
                    }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                    onClick={() => setCurrentIndex((currentIndex + 2) % count)}
                    className="absolute w-[82%] sm:w-[540px] md:w-[620px] h-[260px] sm:h-[350px] md:h-[390px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 border-white/80 dark:border-gray-800/80 shadow-xl shadow-green-950/15 cursor-pointer filter brightness-90 hover:brightness-100 transition-all"
                >
                    <img 
                        src={leftCard.src} 
                        alt={leftCard.title} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </motion.div>

                {/* 2nd Card (Right Background) */}
                <motion.div
                    key={`bg-right-${rightCard.id}`}
                    initial={{ opacity: 0, scale: 0.88, x: 70, rotateZ: 10 }}
                    animate={{ 
                        opacity: 0.82, 
                        scale: 0.92, 
                        x: 50, 
                        y: 10,
                        rotateZ: 5,
                        zIndex: 20 
                    }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                    onClick={() => setCurrentIndex((currentIndex + 1) % count)}
                    className="absolute w-[85%] sm:w-[560px] md:w-[640px] h-[275px] sm:h-[365px] md:h-[405px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl shadow-green-950/20 cursor-pointer filter brightness-95 hover:brightness-100 transition-all"
                >
                    <img 
                        src={rightCard.src} 
                        alt={rightCard.title} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </motion.div>

                {/* 1st Card (Foreground Active Card) */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={`front-${frontCard.id}`}
                        initial={{ opacity: 0, scale: 0.9, y: 30, rotateZ: -2 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            x: 0, 
                            y: 0,
                            rotateZ: 0,
                            zIndex: 30 
                        }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, rotateZ: 3 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="absolute w-[90%] sm:w-[580px] md:w-[660px] h-[290px] sm:h-[380px] md:h-[420px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl shadow-green-950/30 group"
                    >
                        <img 
                            src={frontCard.src} 
                            alt={frontCard.title} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />

                        {/* Top Badge */}
                        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2">
                            <span className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-black tracking-wide uppercase flex items-center gap-1.5 shadow-lg">
                                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                                {frontCard.badge}
                            </span>
                        </div>

                        {/* Location Tag */}
                        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
                            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1 border border-white/20">
                                <MapPin className="h-3 w-3 text-green-400" />
                                Meknès, Maroc
                            </span>
                        </div>

                        {/* Bottom Gradient and Caption */}
                        <div className="absolute inset-x-0 bottom-0 pt-20 pb-5 sm:pb-7 px-5 sm:px-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end">
                            <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                                {frontCard.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-200 font-medium mt-1 drop-shadow-sm max-w-xl">
                                {frontCard.subtitle}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Left/Right Floating Quick Controls */}
                <button
                    onClick={prevCard}
                    aria-label="Image précédente"
                    className="absolute left-1 sm:left-4 z-40 p-2.5 sm:p-3 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-800 dark:text-white shadow-xl border border-gray-100 dark:border-gray-800 hover:scale-110 active:scale-95 transition-all"
                >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <button
                    onClick={nextCard}
                    aria-label="Image suivante"
                    className="absolute right-1 sm:right-4 z-40 p-2.5 sm:p-3 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-800 dark:text-white shadow-xl border border-gray-100 dark:border-gray-800 hover:scale-110 active:scale-95 transition-all"
                >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            </div>

            {/* Pagination Dots & Farm Live Pill */}
            <div className="mt-5 sm:mt-7 flex items-center justify-between w-full max-w-xs sm:max-w-sm px-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {HERO_IMAGES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            aria-label={`Aller à la photo ${i + 1}`}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                i === currentIndex 
                                    ? 'w-8 bg-green-600 dark:bg-green-500 shadow-md shadow-green-500/30' 
                                    : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span>{currentIndex + 1} / {HERO_IMAGES.length}</span>
                </div>
            </div>
        </div>
    )
}
