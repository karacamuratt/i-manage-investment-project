import './globals.css';
import { ApolloWrapper } from '@/components/ApolloWrapper';
import { LanguageProvider } from './components/LanguageProvider'; 

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr">
            <body>
                <ApolloWrapper>
                    <LanguageProvider> 
                        {children}
                    </LanguageProvider>
                </ApolloWrapper>
            </body>
        </html>
    )
}
