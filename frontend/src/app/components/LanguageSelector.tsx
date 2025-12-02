import React from 'react';
import { useLanguage } from '../components/LanguageProvider';
import { LangType } from '@/src/app/config/i18n';

export const LanguageSelector: React.FC = () => {
    const { lang, setLang } = useLanguage();

    const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLang(e.target.value as LangType);
    };

    return (
        <select
            value={lang}
            onChange={handleLangChange}
            className="ml-4 p-1 border rounded-md bg-gray-800 text-white border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="tr">Türkçe (TR)</option>
                <option value="en">English (EN)</option>
        </select>
    );
};
