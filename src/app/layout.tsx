import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hot Potato Game",
  description: "A Solana-based hot potato game where only one loses!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          background: 'radial-gradient(ellipse at top, rgba(255, 107, 53, 0.15) 0%, rgba(15, 15, 15, 1) 50%), linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 140, 66, 0.03) 25%, rgba(15, 15, 15, 1) 50%)',
          minHeight: '100vh',
        }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
