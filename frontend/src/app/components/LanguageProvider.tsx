'use client';

import React, { useState, useCallback, useContext } from 'react';
import { translations, LangType, I18nContextType, LanguageContext } from '@/src/app/config/i18n';
import { assets } from '../config/i18n';

export const getSymbolLabelKey = (symbol: string): keyof typeof assets.tr => {
    return `${symbol.toUpperCase()}_LABEL` as keyof typeof assets.tr;
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);

    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }

    return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<LangType>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('lang') as LangType) || 'tr';
        }
        return 'tr';
    });

    const setLang = useCallback((newLang: LangType) => {
        setLangState(newLang);

        if (typeof window !== 'undefined') {
            localStorage.setItem('lang', newLang);
        }
    }, []);

    const t = useCallback((key: keyof typeof translations.tr, vars?: Record<string, string | number>) => {
        let text = translations[lang][key] || translations['tr'][key] || key;

        if (vars) {
            for (const [varKey, varValue] of Object.entries(vars)) {
                text = text.replace(new RegExp(`{${varKey}}`, 'g'), String(varValue));
            }
        }
        return text;
    }, [lang]);

    const value: I18nContextType = {
        lang,
        setLang,
        t,
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
