import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    title={lang.name}
                    className={`w-10 h-10 rounded-lg text-xl transition-all flex items-center justify-center ${i18n.language === lang.code
                        ? 'bg-green-600 shadow-lg scale-110'
                        : 'hover:bg-white/20 hover:scale-105'
                        }`}
                >
                    {lang.flag}
                </button>
            ))}
        </div>
    );
}
