import { MetadataRoute } from 'next';


export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/profil/', '/api/'],
        },
        sitemap: 'https://otbozor.uz/sitemap.xml',
    };
}
