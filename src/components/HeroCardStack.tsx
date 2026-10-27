import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

interface HeroImage {
    id: number
    src: string
}

const HERO_IMAGES: HeroImage[] = [
    { id: 1, src: "/hero/olives.jpg" },
    { id: 2, src: "/hero/greenhouse.jpg" },
    { id: 3, src: "/hero/campus.jpg" },
    { id: 4, src: "/hero/pathway.jpg" },
    { id: 5, src: "/hero/orchard.jpg" }
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
            className="w-full max-w-4xl mx-auto flex flex-col items-center select-none"
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
                        alt="ISIAOM Meknès" 
                        className="w-full h-full object-cover" 
                    />
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
                        alt="ISIAOM Meknès" 
                        className="w-full h-full object-cover" 
                    />
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
                            alt="ISIAOM Meknès" 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />

                        {/* Location Tag ONLY */}
                        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
                            <span className="px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 border border-white/20 shadow-lg">
                                <MapPin className="h-3.5 w-3.5 text-green-400" />
                                Meknès, Maroc
                            </span>
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

            {/* Pagination Dots */}
            <div className="mt-5 sm:mt-7 flex items-center justify-center gap-2">
                {HERO_IMAGES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Photo ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            i === currentIndex 
                                ? 'w-8 bg-green-600 dark:bg-green-500 shadow-md shadow-green-500/30' 
                                : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                        }`}
                    />
                ))}
            </div>
        </div>
    )
}
