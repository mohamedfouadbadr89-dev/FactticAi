import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Facttic.AI | Enterprise Deterministic Engine',
  description: 'Production-ready platform with deterministic billing, observability, and hardened security perimeter.',
  openGraph: {
    title: 'Facttic.AI | V1 Production Release',
    description: 'Enterprise deterministic engine with hybrid BYOK architecture and multi-agent isolation.',
    url: 'https://facttic.ai',
    siteName: 'Facttic.AI',
    images: [
      {
        url: 'https://facttic.ai/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Facttic.AI Production Baseline',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facttic.AI | V1 Production Release',
    description: 'Enterprise deterministic engine.',
    images: ['https://facttic.ai/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
