import type { Metadata, Viewport } from 'next';
import { Archivo_Black, Outfit } from 'next/font/google';
import './globals.css';

/** Bold display — brand mark only (gate / panel titles). */
const display = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

/** Clean geometric sans — balmingtiger-style floating chrome. */
const body = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const siteUrl = 'https://www.vcrrecords.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'VCR Record Shop',
  description:
    'Step inside the VCR Recordings store. A full 360° illustrated record shop. Look around, explore, and discover.',
  keywords: [
    'VCR Recordings',
    'jungle',
    'drum and bass',
    'record store',
    'vinyl',
    'immersive',
    'underground',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VCR Record Shop',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'VCR Record Shop',
    description: 'An interactive 360° record store. Look around, explore, discover.',
    type: 'website',
    url: siteUrl,
    siteName: 'VCR Record Shop',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'VCR Record Shop — illustrated record store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VCR Record Shop',
    description: 'An interactive 360° record store. Look around, explore, discover.',
    images: ['/og.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1f18',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
