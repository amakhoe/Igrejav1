import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Igreja do Nazareno',
  description: 'Sistema de gestão de crentes, finanças e visitas pastorais para a Igreja do Nazareno em Maputo.',
  openGraph: {
    title: 'Gestão Igreja do Nazareno',
    description: 'Sistema de gestão de crentes, finanças e visitas pastorais para a Igreja do Nazareno em Maputo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão Igreja do Nazareno',
    description: 'Sistema de gestão de crentes, finanças e visitas pastorais para a Igreja do Nazareno em Maputo.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
