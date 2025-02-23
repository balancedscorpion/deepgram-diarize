import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meeting Intelligence",
  description: "Real-time transcription with analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto p-6">
              <h1 className="text-3xl font-light">Meeting Intelligence</h1>
              <p className="text-gray-500">
                Real-time transcription with analysis
              </p>
            </div>
          </header>

          <main className="max-w-7xl mx-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
