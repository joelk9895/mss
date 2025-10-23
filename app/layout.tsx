import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  title: "MSS - Legal Management System",
  description: "Modern legal practice management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} antialiased bg-zinc-50 dark:bg-black font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
