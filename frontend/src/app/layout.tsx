import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CallProvider } from '@/context/CallContext';
import { ChatProvider } from '@/context/ChatContext';

export const metadata: Metadata = {
  title: 'Signal Clone - Private Messaging with Signal AI',
  description: 'Fast, secure, private messaging with integrated Signal AI intelligence and WebRTC calls.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark-navy">
      <body className="bg-[#080e18] text-slate-100 min-h-screen overflow-hidden antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CallProvider>
              <ChatProvider>
                {children}
              </ChatProvider>
            </CallProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
