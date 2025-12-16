'use client';

import { FormEvent, useState } from "react";
import { Bell, AlertTriangle, CheckCircle, X, User, LogOut, Globe, TrendingUp } from 'lucide-react';
import { useLanguage, getSymbolLabelKey } from './LanguageProvider';

const SUPPORTED_SYMBOLS = [
    'USD',
    'EUR',
    'GRAM_ALTIN',
    'CEYREK_ALTIN',
    'TAM_ALTIN',
    'ATA_ALTIN',
];

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateAlert: (symbol: string, targetPrice: number) => Promise<void>;
    creating: boolean;
    t: (key: string, args?: any) => string;
}

export default function NotificationModal({
    isOpen, onClose, onCreateAlert, creating, t
}: NotificationModalProps) {
    const [symbol, setSymbol] = useState(SUPPORTED_SYMBOLS[0]);
    const [targetPrice, setTargetPrice] = useState('');
    const [localError, setLocalError] = useState('');

    if (!isOpen) return null;

    const handleNumericInputChange = (currentValue: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const filteredValue = currentValue
            .replace(/,/g, '.')
            .replace(/[^\d.]/g, '');

        const parts = filteredValue.split('.');
        const finalValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filteredValue;

        setter(finalValue);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');

        const price = parseFloat(targetPrice);

        if (isNaN(price) || price <= 0) {
            setLocalError(t('ERROR_TARGET_PRICE'));
            return;
        }

        onCreateAlert(symbol, price);
        setTargetPrice('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-indigo-700 flex items-center">
                        <Bell className="w-5 h-5 mr-2" /> {t('SETUP_PRICE_ALERT')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label htmlFor="alert-symbol" className="block text-sm font-medium text-gray-700 mb-1">{t('ALERT_SYMBOL')}</label>
                        <select
                            id="alert-symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                            disabled={creating}
                        >
                            {SUPPORTED_SYMBOLS.map(s => (
                                <option key={s} value={s}>{t(getSymbolLabelKey(s))}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="target-price" className="block text-sm font-medium text-gray-700 mb-1">{t('TARGET_PRICE')}</label>
                        <input
                            id="target-price"
                            type="text"
                            inputMode="decimal"
                            value={targetPrice}
                            onChange={(e) => handleNumericInputChange(e.target.value, setTargetPrice)}
                            placeholder={t('TARGET_PRICE_PLACEHOLDER')}
                            className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                            disabled={creating}
                        />
                    </div>

                    {localError && (
                        <div className="flex items-center p-3 text-sm text-red-600 bg-red-100 rounded-lg border border-red-300">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            {localError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={creating || !targetPrice}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md flex items-center justify-center disabled:bg-indigo-300"
                    >
                        {creating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            t('SAVE_ALERT')
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
