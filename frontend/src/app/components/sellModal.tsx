'use client';

import { FormEvent } from "react";
import { useLanguage, getSymbolLabelKey } from './LanguageProvider'; 

interface SellModalProps {
    isOpen: boolean;
    item: any;
    sellAmount: string;
    setSellAmount: (amount: string) => void;
    sellError: string | null;
    selling: boolean;
    onSellAll: () => void;
    onConfirm: (e: FormEvent) => void;
    onClose: () => void;
    sellInputRef?: React.RefObject<HTMLInputElement>;
}


export default function SellModal({
    isOpen,
    item,
    sellAmount,
    setSellAmount,
    sellError,
    selling,
    onSellAll,
    onConfirm,
    onClose,
    sellInputRef,
}: SellModalProps) { 
    if (!isOpen || !item) return null;

    const { t } = useLanguage();
    const handleNumericInputChange = (currentValue: string) => {
        const filteredValue = currentValue
            .replace(/,/g, '.')
            .replace(/[^\d.]/g, '');

        const parts = filteredValue.split('.');
        const finalValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filteredValue;

        setSellAmount(finalValue);
    };

    const maxAmount = item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 });


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4 text-red-600">{t('SELL_CONFIRMATION')}</h3>

                <p className="mb-4 text-gray-700">
                    <strong>{t(getSymbolLabelKey(item.symbol))}</strong> {t('SELL_DESCRIPTION_P1')}
                    <br />
                    {t('SELL_MAXIMUM_LABEL')}:{" "}
                    <strong>
                        {maxAmount}{" "}
                        {t(getSymbolLabelKey(item.symbol))}
                    </strong>
                </p>

                <form onSubmit={onConfirm} className="space-y-4">
                    <div className="flex items-end space-x-2">
                        <div className="flex-1">
                            <label
                                htmlFor="sell-amount"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('SELL_AMOUNT_LABEL', { symbol: t(getSymbolLabelKey(item.symbol)) })}
                            </label>

                            <input
                                id="sell-amount"
                                type="text"
                                ref={sellInputRef}
                                value={sellAmount}
                                onChange={(e) => handleNumericInputChange(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:ring-red-500 focus:border-red-500 text-black"
                                placeholder={`Maks. ${maxAmount}`}
                                disabled={selling}
                                inputMode="decimal"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={onSellAll}
                            disabled={selling || item.amount <= 0}
                            className="px-3 py-3 rounded-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 h-fit"
                        >
                            {t('SELL_ALL')}
                        </button>
                    </div>

                    {sellError && (
                        <p className="text-sm font-medium text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                            {sellError}
                        </p>
                    )}

                    <div className="flex justify-end space-x-3 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={selling}
                        >
                            {t('CANCEL')}
                        </button>

                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                                selling
                                    ? "bg-red-300 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                            disabled={selling}
                        >
                            {selling ? `${t('CONFIRM_SALE')}...` : t('CONFIRM_SALE')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
