import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavigationButton from '@/components/NavigationButton'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HIPPO",
  description: "Air Quality Control for Meetings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">HIPPO 🦛</h1> 
              <div className="flex items-center gap-4">
                <div className="text-gray-600">Air Quality Control for Meetings</div>
                <div className="text-gray-300">•</div>
                <NavigationButton />
              </div>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
