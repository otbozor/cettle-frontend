import { Metadata } from 'next';

interface GenerateMetadataProps {
    title: string;
    description: string;
    image?: string;
    path: string;
    noIndex?: boolean;
}

export function constructMetadata({
    title,
    description,
    image = '/images/og-default.jpg',
    path,
    noIndex = false,
}: GenerateMetadataProps): Metadata {
    const fullUrl = `https://otbozor.uz${path}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: fullUrl,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: 'website',
            siteName: 'Chorvabozor',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
        alternates: {
            canonical: fullUrl,
        },
        robots: {
            index: !noIndex,
            follow: !noIndex,
        },
    };
}
