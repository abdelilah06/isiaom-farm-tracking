import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
    isHighGlare: boolean
    toggleHighGlare: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Get theme from localStorage or default to light
        const saved = localStorage.getItem('theme') as Theme
        return saved || 'light'
    })

    const [isHighGlare, setIsHighGlare] = useState<boolean>(() => {
        return localStorage.getItem('high-glare') === 'true'
    })

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }

        // Save to localStorage
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        const root = document.documentElement
        if (isHighGlare) {
            root.classList.add('high-glare-mode')
        } else {
            root.classList.remove('high-glare-mode')
        }
        localStorage.setItem('high-glare', isHighGlare ? 'true' : 'false')
    }, [isHighGlare])

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light')
    }

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    const toggleHighGlare = () => {
        setIsHighGlare(prev => !prev)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isHighGlare, toggleHighGlare }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
