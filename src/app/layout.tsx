import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { arcadeFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gallinazo Hunt',
  description: 'Un arcade peruano de gallinazos: apunta, dispara y consigue el récord.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b0b14',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={arcadeFont.variable}>
      <body>{children}</body>
    </html>
  );
}
