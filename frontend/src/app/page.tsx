'use client';

import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { GET_PORTFOLIOS, CREATE_PORTFOLIO, SELL_PORTFOLIO, GET_RATE } from '@/graphql/queries';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LogoutButton } from './components/LogoutButton';
import { useState, FormEvent, useMemo, useRef, useEffect } from 'react';
import SellModal from "./components/sellModal";
import { useLanguage, getSymbolLabelKey } from '../app/components/LanguageProvider';
import { LanguageSelector } from './components/LanguageSelector';
import { useRouter } from 'next/navigation';


interface PortfolioItem {
    id: string;
    symbol: string;
    amount: number;
    currentValueTRY: number;
    baseCurrency: string;
    purchaseRateTRY: number;
    isManualRate: boolean;
    createdAt: string;
}

const SUPPORTED_SYMBOLS = [
    'USD', 
    'EUR',
    'GRAM_ALTIN', 
    'CEYREK_ALTIN', 
    'TAM_ALTIN', 
    'ATA_ALTIN',
];

const groupPortfoliosBySymbol = (items: PortfolioItem[]) => {
    return items.reduce((acc, item) => {
        const key = item.symbol;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, PortfolioItem[]>);
};

const SUPPORTED_BASE_CURRENCIES = ['TRY', 'USD', 'EUR'];

export default function DashboardPage() {
    const router = useRouter();
    useAuthGuard();

    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const sellInputRef = useRef<HTMLInputElement>(null);
    const { t, lang } = useLanguage();

    useEffect(() => {
        if (isSellModalOpen) {
            const timer = setTimeout(() => {
                sellInputRef.current?.focus();
            }, 0); 
            
            return () => clearTimeout(timer);
        }
    }, [isSellModalOpen]);

    useEffect(() => {
        if (isSellModalOpen) {
            document.title = `${t('SELL_CONFIRMATION')}`;
        } else {
            document.title = t('PORTFOLIO_SUMMARY'); 
        }
    }, [t, isSellModalOpen]);


    const [newSymbol, setNewSymbol] = useState(SUPPORTED_SYMBOLS[0]);
    const [newAmount, setNewAmount] = useState<string>('');
    const [formError, setFormError] = useState('');

    const [isManualRateEnabled, setIsManualRateEnabled] = useState(false);
    const [manualRate, setManualRate] = useState<string>('');

    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [itemToSell, setItemToSell] = useState<PortfolioItem | null>(null);
    const [sellAmount, setSellAmount] = useState<string>('');
    const [sellError, setSellError] = useState('');

    const [selectedBaseCurrency, setSelectedBaseCurrency] = useState(SUPPORTED_BASE_CURRENCIES[0]); // Default: TRY
    const [fetchConversionRate, { data: conversionData, loading: rateLoading, error: rateError }] = useLazyQuery<{ getRate: number }>(GET_RATE);

    const targetSymbol = selectedBaseCurrency;
    const rateSymbolPair = `TRY/${targetSymbol}`;

    useEffect(() => {
        if (targetSymbol && targetSymbol !== 'TRY') {
            fetchConversionRate({ variables: { symbolPair: rateSymbolPair } });
        }
    }, [targetSymbol, rateSymbolPair, fetchConversionRate]);

    const { loading, error, data } = useQuery<{ getPortfolios: PortfolioItem[] }>(GET_PORTFOLIOS);

    const [createPortfolio, { loading: creating }] = useMutation(CREATE_PORTFOLIO, {
        refetchQueries: [{ query: GET_PORTFOLIOS }, 'GetPortfolios'],
    });

    const [sellPortfolio, { loading: selling }] = useMutation(SELL_PORTFOLIO, {
        refetchQueries: [{ query: GET_PORTFOLIOS }, 'GetPortfolios'],
    });

    const portfolios = data?.getPortfolios || [];
    const groupedPortfolios = useMemo(() => groupPortfoliosBySymbol(portfolios), [portfolios]);

    const isAnyItemSelected = selectedItemIds.length > 0;

    if (loading) return <div className="p-8">{t('LOADING')}</div>;

    if (error) {
        console.error('GraphQL Error:', error);
        router.push('/login');
        return <div className="p-8 text-red-500">{t('ERROR_LOGIN')}</div>;
    }

    const totalValue = portfolios.reduce((sum, item) => sum + item.currentValueTRY, 0);

    let conversionRate = 1.0;
    
    if (selectedBaseCurrency === 'TRY') {
        conversionRate = 1.0;
    } else {
        conversionRate = conversionData?.getRate || 0; 
    }
    
    const convertedTotalValue = totalValue * conversionRate;

    const handleCheckboxChange = (itemId: string) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleNumericInputChange = (currentValue: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const filteredValue = currentValue
            .replace(/,/g, '.')
            .replace(/[^\d.]/g, '');

        const parts = filteredValue.split('.');
        const finalValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filteredValue;

        setter(finalValue);
};

    const handleSellButtonClick = (item: PortfolioItem) => {
        setItemToSell(item);
        setSellAmount('');
        setSellError('');
        setIsSellModalOpen(true);
    };

    const handleSellAll = () => {
        if (itemToSell) {
            setSellAmount(itemToSell.amount.toString());
        }
    };

    const handleConfirmSell = async (e: FormEvent) => {
        e.preventDefault();
        setSellError('');

        if (!itemToSell) return;

        const amountToSell = parseFloat(sellAmount.toString());

        if (isNaN(amountToSell) || amountToSell <= 0) {
            setSellError(t('ERROR_AMOUNT'));
            return;
        }

        if (amountToSell > itemToSell.amount) {
            setSellError(
                t('ERROR_SELL_OVERFLOW', { amount: itemToSell.amount })
            );
            return;
        }

        try {
            await sellPortfolio({
                variables: {
                    id: itemToSell.id,
                    amount: amountToSell,
                },
            });

            setIsSellModalOpen(false);
            setItemToSell(null);
            setSellAmount('');
            setSelectedItemIds(prev => prev.filter(id => id !== itemToSell.id));
        } catch (err: any) {
            setSellError(`Sell error: ${err.message.replace('GraphQL error:', '').trim()}`);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError('');

        const parsedAmount = parseFloat(newAmount.toString());

        const parsedManualRate = isManualRateEnabled ? parseFloat(manualRate) : NaN;

        if (!newSymbol) {
            setFormError(t('ERROR_SYMBOL'));
            return;
        }

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setFormError(t('ERROR_AMOUNT'));
            return;
        }

        if (isManualRateEnabled && (isNaN(parsedManualRate) || parsedManualRate <= 0)) {
            setFormError(t('ERROR_MANUAL_RATE_INVALID'));
            return;
        }

        try {
            const rateToUse = isManualRateEnabled ? parsedManualRate : 1;

            await createPortfolio({
                variables: {
                    symbol: newSymbol.toUpperCase().trim(),
                    amount: parsedAmount,
                    purchaseRateTRY: rateToUse,
                    isManualRate: isManualRateEnabled
                },
            });

            setIsManualRateEnabled(false);
            setManualRate('');
            setNewSymbol(SUPPORTED_SYMBOLS[0]);
            setNewAmount('');
        } catch (err: any) {
            setIsManualRateEnabled(false);
            setManualRate('');
            console.error('Error while adding the asset:', err);
            setFormError(`Hata: ${err.message.replace('GraphQL error:', '').trim()}`);
        }
    };

    return (
        <div className="container mx-auto p-8 font-sans">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('PORTFOLIO_SUMMARY')}</h1>
                <LanguageSelector />
                <LogoutButton />
            </div>

            {/* TOTAL VALUE */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg rounded-xl p-6 mb-8">
                <div className="flex items-center space-x-2 mb-2">
                    <p className="font-bold text-sm opacity-80">{t('TOTAL_VALUE')}</p>
                    <select
                        value={selectedBaseCurrency}
                        onChange={(e) => setSelectedBaseCurrency(e.target.value)}
                        className="p-1 border rounded-md bg-gray-800 text-white border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                        {SUPPORTED_BASE_CURRENCIES.map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                        ))}
                    </select>
                </div>
                <p className="text-5xl font-extrabold mt-1">
                {rateLoading
                    ? t('CALCULATING')
                    : (() => {
                        const formatted = convertedTotalValue.toLocaleString(
                            lang === 'en' ? 'en-US' : 'tr-TR',
                            {
                                maximumFractionDigits: 2,
                                style: 'currency',
                                currency: selectedBaseCurrency,
                            }
                        );

                        if (selectedBaseCurrency === 'TRY') {
                            return formatted.replace('TRY', '₺');
                        }

                        return formatted;
                    })()
                }
                </p>
            </div>

            {/* ADD NEW ASSET */}
            <div className="bg-white shadow-xl rounded-xl p-6 mb-10 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('ADD_NEW_ASSET')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('SYMBOL')}
                            </label>

                            <select
                                value={newSymbol}
                                onChange={e => setNewSymbol(e.target.value)}
                                className="mt-1 block w-full rounded-md p-3 shadow-sm border border-gray-300 text-black"
                                disabled={creating}
                            >
                                {SUPPORTED_SYMBOLS.map(s => (
                                    <option key={s} value={s}>
                                        {t(getSymbolLabelKey(s))} 
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('AMOUNT')}
                            </label>

                            <input
                                type="number"
                                value={newAmount}
                                onChange={e =>
                                    setNewAmount(
                                        e.target.value
                                    )
                                }
                                className={`mt-1 block w-full rounded-md p-3 shadow-sm border ${
                                    formError && newAmount === ''
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                } text-black`}
                                placeholder="100.00"
                                step="any"
                                disabled={creating}
                            />
                        </div>

                        <div className="flex items-center space-x-4 pt-2">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        id="manual-rate-check"
                                        checked={isManualRateEnabled}
                                        onChange={(e) => setIsManualRateEnabled(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor="manual-rate-check" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        {t('MANUAL_RATE_LABEL')}
                                    </label>
                                </div>
                                
                                <input
                                    type="text"
                                    value={manualRate}
                                    onChange={(e) => handleNumericInputChange(e.target.value, setManualRate)}
                                    className={`mt-1 block w-full rounded-md p-3 shadow-sm border ${
                                        isManualRateEnabled ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                                    } text-black`}
                                    placeholder={t('MANUAL_RATE_PLACEHOLDER')}
                                    disabled={!isManualRateEnabled || creating}
                                    inputMode="decimal"
                                />
                            </div>
                            <div className="flex-1">
                            </div>
                        </div>
                    </div>

                    {formError && (
                        <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            {formError}
                        </p>
                    )}

                    <button
                        type="submit"
                        className={`w-full py-3 px-4 rounded-md text-sm font-medium text-white ${
                            creating
                                ? 'bg-indigo-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                        disabled={creating}
                    >
                        {creating ? t('ADDING') : t('ADD_ASSET')}
                    </button>
                </form>
            </div>

            {/* PORTFOLIO LIST */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">{t('YOUR_SAVINGS')}</h2>

            <div className="space-y-6">
                {portfolios.length === 0 ? (
                    <p className="text-gray-500 p-4 bg-gray-50 rounded-lg border border-dashed">
                        {t('NO_SAVINGS')}
                    </p>
                ) : (
                    Object.entries(groupedPortfolios).map(([symbol, items]) => (
                        <div
                            key={symbol}
                            className="bg-white shadow-xl rounded-xl p-4 border border-gray-100"
                        >
                            <h3 className="text-xl font-bold mb-3 text-indigo-700 border-b pb-2">
                                {t('ASSETS')} {t(getSymbolLabelKey(symbol))} ({ items.length == 1 ? t('ITEM_COUNT', { count: items.length }) : t('ITEMS_COUNT', { count: items.length }) })
                            </h3>

                            <div className="space-y-3">
                                {items.map(item => {
                                    const isSelected = selectedItemIds.includes(item.id);
                                    const isCheckboxDisabled =
                                        isAnyItemSelected && !isSelected;

                                    const formattedDate = new Date(
                                        item.createdAt
                                    ).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    });

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex justify-between items-center p-3 rounded-lg transition border ${
                                                isSelected
                                                    ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                                    : 'bg-white hover:bg-gray-50 border-gray-100'
                                            } ${isCheckboxDisabled ? 'opacity-60' : ''}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isCheckboxDisabled}
                                                    onChange={() =>
                                                        handleCheckboxChange(item.id)
                                                    }
                                                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded"
                                                />

                                                <div>
                                                    <p className="text-base font-semibold text-gray-800">
                                                        {t('AMOUNT_LABEL')}{' '}
                                                        {item.amount.toLocaleString(undefined, {
                                                            maximumFractionDigits: 4,
                                                        })}{' '}
                                                        {t(getSymbolLabelKey(symbol))}
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        {t('BUY_RATE', { symbol: t(getSymbolLabelKey(symbol)) })}{' '}
                                                        {item.purchaseRateTRY} {item.isManualRate ? t('USER_RATE') : ''}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {t('PURCHASE_DATE')} {formattedDate}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-lg font-extrabold text-green-600">
                                                        {item.currentValueTRY.toLocaleString('tr-TR', {
                                                            maximumFractionDigits: 2,
                                                            style: 'currency',
                                                            currency: 'TRY',
                                                        })}
                                                    </p>

                                                    {totalValue > 0 && (
                                                        <p className="text-xs text-gray-500">
                                                            {t('SHARE_LABEL')}{' '}
                                                            {(
                                                                (item.currentValueTRY /
                                                                    totalValue) *
                                                                100
                                                            ).toFixed(1)}
                                                            %
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        handleSellButtonClick(item)
                                                    }
                                                    disabled={!isSelected || item.amount <= 0}
                                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-400"
                                                >
                                                    {t('SELL')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* SELL MODAL */}
            <SellModal
                isOpen={isSellModalOpen}
                item={itemToSell}
                sellAmount={sellAmount}
                setSellAmount={setSellAmount}
                sellError={sellError}
                selling={selling}
                onSellAll={handleSellAll}
                onConfirm={handleConfirmSell}
                onClose={() => setIsSellModalOpen(false)}
                sellInputRef={sellInputRef}
            />
        </div>
    );
}
