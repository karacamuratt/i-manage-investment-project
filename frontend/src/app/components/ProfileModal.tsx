'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ACTIVE_ALERTS, DELETE_ALERTS } from '@/graphql/queries';
import { getSymbolLabelKey } from './LanguageProvider';

interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

interface PriceAlert {
    symbol: string;
    targetPrice: number;
}

interface Alert {
    id: string;
    symbol: string;
    targetPrice: number;
    isTriggered: boolean;
}

interface GetActiveAlertsResponse {
    getActiveAlerts: Alert[];
}

interface ProfileModalProps {
    isOpen: boolean;
    profile: UserProfile;
    onUpdate: any;
    onClose: () => void;
    t: (key: string, vars?: any) => string;
    updating: boolean;
    error: string | null;
    setError: (msg: string | null) => void;
}

export default function ProfileModal({
    isOpen, profile, onUpdate, onClose, t, updating, error, setError
}: ProfileModalProps) {
    const [firstName, setFirstName] = useState(profile.firstName || '');
    const [lastName, setLastName] = useState(profile.lastName || '');
    const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

    const { data, loading: alertsLoading, refetch } = useQuery<GetActiveAlertsResponse>(
        GET_ACTIVE_ALERTS,
        {
            skip: !isOpen,
        }
    );

    useEffect(() => {
        if (isOpen) {
            refetch();
        }
    }, [isOpen, refetch]);

    const alerts = data?.getActiveAlerts ?? [];

    const [deleteAlerts, { loading: deleting }] = useMutation(DELETE_ALERTS, {
        refetchQueries: [GET_ACTIVE_ALERTS],
    });

    const toggleSelect = (id: string) => {
        setSelectedAlerts((prev) =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleDeleteSingle = async (id: string) => {
        await deleteAlerts({ variables: { ids: [id] } });
        setSelectedAlerts(prev => prev.filter(x => x !== id));
    };

    const handleDeleteSelected = async () => {
        if (selectedAlerts.length === 0) return;

        await deleteAlerts({ variables: { ids: selectedAlerts } });
        setSelectedAlerts([]);
    };

    useEffect(() => {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setError(null);
    }, [profile, setError]);

    if (!isOpen) return null;

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!firstName || !lastName) {
            setError(t('ERROR_PROFILE_REQUIRED'));
            return;
        }

        try {
            await onUpdate({
                variables: {
                    firstName: firstName.trim(),
                    lastName: lastName.trim()
                }
            });
            onClose();
        } catch (err: any) {
            setError(`${t('ERROR_UPDATE_FAILED')}: ${err.message.replace('GraphQL error:', '').trim()}`);
        }
    };

    const accountCreateDate = new Date(profile.createdAt).toLocaleDateString(t('LOCALE_CODE') || 'tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700">
                    {t('PROFILE_TITLE')}
                </h3>

                <form onSubmit={handleSave} className="space-y-4">
                    {error && <p className="text-sm text-red-500 border border-red-200 p-2 rounded">{error}</p>}

                    {/* NAME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('PROFILE_FIRST_NAME')}</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-black"
                            disabled={updating}
                            placeholder={t('PROFILE_FIRST_NAME_PLACEHOLDER')}
                        />
                    </div>

                    {/* SURNAME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('PROFILE_LAST_NAME')}</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md text-black"
                            disabled={updating}
                            placeholder={t('PROFILE_LAST_NAME_PLACEHOLDER')}
                        />
                    </div>

                    {/* Email (Disabled) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            className="mt-1 w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed text-black"
                            disabled
                        />
                    </div>

                    {/* Created Date (Disabled) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('PROFILE_CREATED_AT')}</label>
                        <input
                            type="text"
                            value={accountCreateDate}
                            className="mt-1 w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed text-black"
                            disabled
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">
                            {t('ACTIVE_PRICE_ALERTS')}
                        </h4>

                        {alertsLoading ? (
                            <p className="text-sm text-gray-500">{t('LOADING')}...</p>
                        ) : alerts.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                {t('NO_ACTIVE_ALERTS')}
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-center justify-between border rounded-md p-2"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedAlerts.includes(alert.id)}
                                                onChange={() => toggleSelect(alert.id)}
                                            />
                                            <div className="text-sm text-gray-800">
                                                <span className="font-semibold">{t(getSymbolLabelKey(alert.symbol))}</span>
                                                {' '}→ {alert.targetPrice}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSingle(alert.id)}
                                            className="text-red-600 text-sm hover:underline"
                                            disabled={deleting}
                                        >
                                            {t('REMOVE')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}


                        {/* BULK DELETE */}
                        {selectedAlerts.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                className="mt-3 text-sm text-red-700 hover:underline"
                                disabled={deleting}
                            >
                                {t('REMOVE_SELECTED')} ({selectedAlerts.length})
                            </button>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={updating}
                        >
                            {t('CANCEL')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                            disabled={updating}
                        >
                            {updating ? `${t('SAVING')}...` : t('SAVE')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
