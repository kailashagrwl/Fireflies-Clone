import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ThemeInitializer from '@/components/ThemeInitializer';

export const metadata: Metadata = {
  title: 'Firefiles — Meeting Intelligence',
  description:
    'Record, transcribe, and summarise your meetings with AI-powered insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="theme-light">
      <body className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans">
        <ThemeInitializer />
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex-1 content-shifted transition-all duration-200 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

