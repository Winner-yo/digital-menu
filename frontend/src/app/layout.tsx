import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Ethiopian Menu — Digital Food Ordering',
    template: '%s | Ethiopian Menu',
  },
  description: 'Order delicious Ethiopian food online. Browse menus, place orders, and pay with Telebirr, CBE Birr, or Chapa.',
  keywords: ['Ethiopian food', 'digital menu', 'food ordering', 'Addis Ababa', 'Telebirr', 'QR menu'],
  authors: [{ name: 'Ethiopian Menu Platform' }],
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    locale: 'en_ET',
    title: 'Ethiopian Menu — Digital Food Ordering',
    description: 'Order delicious Ethiopian food online.',
    siteName: 'Ethiopian Menu',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ef7010',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
