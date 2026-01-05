import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Wind, Droplets, CloudSnow, CloudLightning, Loader2, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

interface WeatherData {
    current: {
        temperature: number
        humidity: number
        windSpeed: number
        weatherCode: number
        isDay: boolean
    }
    daily: {
        date: string
        tempMax: number
        tempMin: number
        weatherCode: number
        precipitationProbability: number
    }[]
    alerts: string[]
}

// ISIAOM location (Meknes, Morocco approximate)
const LATITUDE = 33.8935
const LONGITUDE = -5.5364

const weatherIcons: Record<number, any> = {
    0: Sun,           // Clear sky
    1: Sun,           // Mainly clear
    2: Cloud,         // Partly cloudy
    3: Cloud,         // Overcast
    45: Cloud,        // Fog
    48: Cloud,        // Depositing rime fog
    51: CloudRain,    // Light drizzle
    53: CloudRain,    // Moderate drizzle
    55: CloudRain,    // Dense drizzle
    61: CloudRain,    // Slight rain
    63: CloudRain,    // Moderate rain
    65: CloudRain,    // Heavy rain
    71: CloudSnow,    // Slight snow
    73: CloudSnow,    // Moderate snow
    75: CloudSnow,    // Heavy snow
    80: CloudRain,    // Slight rain showers
    81: CloudRain,    // Moderate rain showers
    82: CloudRain,    // Violent rain showers
    95: CloudLightning, // Thunderstorm
    96: CloudLightning, // Thunderstorm with hail
    99: CloudLightning, // Thunderstorm with heavy hail
}

export default function WeatherWidget() {
    const { t } = useTranslation()
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchWeather()
    }, [])

    const fetchWeather = async () => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`
            )

            if (!response.ok) throw new Error('Weather fetch failed')

            const data = await response.json()

            // Generate alerts based on conditions
            const alerts: string[] = []
            const currentTemp = data.current.temperature_2m
            const tomorrowPrecip = data.daily.precipitation_probability_max[1]

            if (currentTemp <= 2) alerts.push(t('weather.alerts.frost'))
            if (currentTemp >= 35) alerts.push(t('weather.alerts.heat'))
            if (tomorrowPrecip > 70) alerts.push(t('weather.alerts.rain'))

            setWeather({
                current: {
                    temperature: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: data.current.wind_speed_10m,
                    weatherCode: data.current.weather_code,
                    isDay: data.current.is_day === 1
                },
                daily: data.daily.time.map((date: string, i: number) => ({
                    date,
                    tempMax: data.daily.temperature_2m_max[i],
                    tempMin: data.daily.temperature_2m_min[i],
                    weatherCode: data.daily.weather_code[i],
                    precipitationProbability: data.daily.precipitation_probability_max[i]
                })),
                alerts
            })
        } catch (err) {
            console.error('Weather error:', err)
            setError('Failed to load weather')
        } finally {
            setLoading(false)
        }
    }

    const getWeatherIcon = (code: number, size = 'h-8 w-8') => {
        const Icon = weatherIcons[code] || Cloud
        return <Icon className={size} />
    }

    const getDayName = (dateStr: string, index: number) => {
        if (index === 0) return t('weather.today')
        if (index === 1) return t('weather.tomorrow')
        return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' })
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-[2rem] p-8 text-white flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !weather) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-[2rem] p-8 text-center">
                <Cloud className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">{t('weather.unavailable')}</p>
            </div>
        )
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 px-2">
                <div className="w-2 h-10 bg-gradient-to-b from-sky-500 to-blue-500 rounded-full shadow-lg" />
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {t('weather.title')}
                </h2>
            </div>

            {/* Alerts */}
            {weather.alerts.length > 0 && (
                <div className="space-y-2">
                    {weather.alerts.map((alert, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
                        >
                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{alert}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Current Weather */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[2rem] p-8 text-white ${weather.current.isDay
                    ? 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-indigo-800 via-purple-900 to-slate-900'
                    } shadow-2xl`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">
                            ISIAOM, Meknès
                        </p>
                        <div className="flex items-end gap-2">
                            <span className="text-6xl font-black">{Math.round(weather.current.temperature)}</span>
                            <span className="text-3xl font-bold mb-2">°C</span>
                        </div>
                    </div>
                    <div className="text-white/90">
                        {getWeatherIcon(weather.current.weatherCode, 'h-20 w-20')}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
                    <div className="flex items-center gap-3">
                        <Droplets className="h-5 w-5 text-white/70" />
                        <div>
                            <p className="text-[10px] text-white/50 font-bold uppercase">{t('weather.humidity')}</p>
                            <p className="text-lg font-black">{weather.current.humidity}%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Wind className="h-5 w-5 text-white/70" />
                        <div>
                            <p className="text-[10px] text-white/50 font-bold uppercase">{t('weather.wind')}</p>
                            <p className="text-lg font-black">{Math.round(weather.current.windSpeed)} km/h</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CloudRain className="h-5 w-5 text-white/70" />
                        <div>
                            <p className="text-[10px] text-white/50 font-bold uppercase">{t('weather.rain_chance')}</p>
                            <p className="text-lg font-black">{weather.daily[0]?.precipitationProbability || 0}%</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 7-Day Forecast */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 px-2">
                    {t('weather.forecast_7day')}
                </h3>
                <div className="grid grid-cols-7 gap-2">
                    {weather.daily.slice(0, 7).map((day, i) => (
                        <motion.div
                            key={day.date}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`text-center p-3 rounded-2xl ${i === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                } transition-colors`}
                        >
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                                {getDayName(day.date, i)}
                            </p>
                            <div className="text-blue-500 dark:text-blue-400 flex justify-center mb-2">
                                {getWeatherIcon(day.weatherCode, 'h-6 w-6')}
                            </div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{Math.round(day.tempMax)}°</p>
                            <p className="text-xs font-bold text-gray-400">{Math.round(day.tempMin)}°</p>
                            {day.precipitationProbability > 30 && (
                                <p className="text-[10px] font-bold text-blue-500 mt-1">
                                    💧{day.precipitationProbability}%
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Irrigation Recommendation */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl">
                        <Droplets className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="font-black text-cyan-800 dark:text-cyan-300 uppercase text-sm mb-1">
                            {t('weather.irrigation_advice')}
                        </h4>
                        <p className="text-sm text-cyan-700 dark:text-cyan-400 font-medium">
                            {weather.daily[0]?.precipitationProbability > 50
                                ? t('weather.advice_rain')
                                : weather.current.temperature > 30
                                    ? t('weather.advice_hot')
                                    : t('weather.advice_normal')
                            }
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
