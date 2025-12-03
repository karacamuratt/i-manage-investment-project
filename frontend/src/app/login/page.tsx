'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { LOGIN_REQUEST_MUTATION, VERIFY_OTP_MUTATION } from '@/graphql/auth.graphql';
import { LoginRequestResponse, VerifyOtpResponse } from '@/types/graphql-types'
import client from '@/lib/apollo-client';

import { useLanguage } from '../components/LanguageProvider'; 
import { LanguageSelector } from '../components/LanguageSelector';


export default function LoginPage() {
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        document.title = t('LOGIN_TITLE');
    }, [t]);
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginRequest] = useMutation<LoginRequestResponse>(LOGIN_REQUEST_MUTATION);
    const [verifyOtp] = useMutation<VerifyOtpResponse>(VERIFY_OTP_MUTATION);

    const getTranslatedError = (messageKey: string, detail?: string) => {
        if (messageKey === 'REQUEST_FAILED') return t('ERROR_REQ_FAILED');
        if (messageKey === 'SERVER_ERROR') return t('ERROR_SERVER');
        if (messageKey === 'OTP_INVALID') return t('ERROR_OTP_INVALID');
        if (messageKey === 'VERIFICATION_ERROR') return t('ERROR_VERIFICATION');
        if (messageKey === 'TOKEN_ERROR') return t('ERROR_TOKEN');
        return detail || t('ERROR_REQ_FAILED'); 
    };


    const handleLoginRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await loginRequest({ variables: { email } });
            
            if (response.data && response.data.loginRequest.success) {
                setIsOtpSent(true);
            } else {
                setError(getTranslatedError('REQUEST_FAILED', response.data?.loginRequest.message));
            }
        } catch (err) {
            setError(getTranslatedError('SERVER_ERROR'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await verifyOtp({ variables: { email, otp } });
            const accessToken = response.data ? response.data.verifyOtp.accessToken : '';
            
            if (accessToken) {
                localStorage.setItem('token', accessToken);
                await client.resetStore();
                router.push('/');
            } else {
                console.error("Access Token Error...");
                setError(getTranslatedError('TOKEN_ERROR'));
            }
        } catch (err: any) {
            console.error("OTP invalid ERROR...");
            setError(err.message.includes('401') ? t('ERROR_OTP_INVALID') : getTranslatedError('VERIFICATION_ERROR'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="absolute top-4 right-4 z-10">
                <LanguageSelector />
            </div>
            
            <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6 text-indigo-600">
                    {isOtpSent ? t('ENTER_OTP') : t('PASSWORDLESS_LOGIN')}
                </h1>
                
                {error && <p className="text-red-500 text-center mb-4 border border-red-300 p-2 rounded">{error}</p>}

                {!isOtpSent && (
                <form onSubmit={handleLoginRequest} className="space-y-4">
                    <input
                        type="email"
                        placeholder={t('EMAIL_ADDRESS')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"

                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400"
                    >
                        {loading ? t('SENDING') : t('REQUEST_ACCESS')}
                    </button>
                </form>
                )}

                {isOtpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                        {t('OTP_SENT_TO', { email: email })}
                    </p>
                    <input
                        type="text"
                        placeholder={t('OTP_CODE')}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 text-green-600 font-bold"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150 disabled:bg-green-400"
                    >
                        {loading ? t('VERIFYING') : t('LOG_IN')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOtpSent(false)}
                        className="w-full text-sm mt-2 text-indigo-500 hover:text-indigo-700"
                    >
                        {t('CHANGE_EMAIL')}
                    </button>
                </form>
                )}
            </div>
        </div>
    );
}
