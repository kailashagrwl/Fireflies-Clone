import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
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
    <html lang="en">
      <body className="min-h-screen bg-[#0b0d12]">
        <ThemeInitializer />
        <Sidebar />
        {/* Main content pushed right of sidebar */}
        <div className="ml-60">
          {children}
        </div>
      </body>
    </html>
  );
}

