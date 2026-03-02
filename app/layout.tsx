import type { Metadata } from 'next';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: {
        default: "Otbozor - O'zbekiston Ot Savdo Platformasi",
        template: '%s | Otbozor',
    },
    description:
        "O'zbekistondagi eng katta ot savdo bozori. Ko'pkari, sport, sayr, ishchi va naslchilik otlarini tez va oson toping yoki soting.",
    keywords: [
        'ot sotish',
        'ot olish',
        "ot bozori o'zbekiston",
        "ko'pkari ot",
        'sport ot',
        'qorabayir',
        'axaltekin',
        'bozor',
    ],
    authors: [{ name: 'Otbozor' }],
    creator: 'Otbozor',
    openGraph: {
        type: 'website',
        locale: 'uz_UZ',
        url: '/',
        siteName: 'Otbozor',
        title: "Otbozor - O'zbekiston Ot Savdo Platformasi",
        description:
            "O'zbekistondagi eng katta ot savdo bozori. Ko'pkari, sport, sayr, ishchi va naslchilik otlarini tez va oson toping yoki soting.",
        images: [
            {
                url: '/horse.jpg',
                width: 1200,
                height: 630,
                alt: "Otbozor - O'zbekiston Ot Savdo Platformasi",
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Otbozor',
        description: "O'zbekistondagi eng katta ot savdo bozori",
        images: ['/horse.jpg'],
    },
    robots: {
        index: true,
        follow: true,
    },
    verification: {
        google: 'EyCp8v5ppynAceyxjj5Vsgog2xDm7iC2DfYG-1nPQok',
    },
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="uz">
            <head>
                <Script
                    id="clarity-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function(c,l,a,r,i,t,y){
                                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "vnhq5mxb29");
                        `,
                    }}
                />
            </head>
            <body className="min-h-screen">
                <NextTopLoader
                    color="#f59e0b"
                    height={3}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                />
                <ThemeProvider>
                    <AuthProvider>
                        <LayoutWrapper>{children}</LayoutWrapper>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
