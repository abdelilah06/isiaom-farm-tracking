import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const languages = [
    { code: 'ar', name: 'العربية', flag: '🇲🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
            <Languages className="h-4 w-4 text-gray-500 ml-1" />
            <div className="flex gap-1">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i18n.language === lang.code
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
