import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'AuraAutomotiveOS — Intelligent Vehicle Diagnostics Platform',
  description: 'AuraAutomotiveOS empowers automotive technicians and service managers with AI-powered diagnostics, VIN scanning, and compliance-grade document management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">
        {children}
        <Toaster 
          position="bottom-right" 
          theme="dark" 
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  );
}
