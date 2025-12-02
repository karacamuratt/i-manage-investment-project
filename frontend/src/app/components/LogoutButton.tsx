'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '../components/LanguageProvider'; 

export function LogoutButton() {
    const router = useRouter();
    const { t } = useLanguage();
    
    const handleLogout = async () => {
        localStorage.removeItem('token'); 
        router.push('/login');
    };

    return (
        <button 
            onClick={handleLogout}
            style={{ 
                padding: '10px 20px', 
                backgroundColor: 'blue', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer' 
            }}
        >
            {t('LOGOUT')}
        </button>
    );
}
