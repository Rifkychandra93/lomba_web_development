import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import AOS from "@/src/components/aos-init";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeRoute Temukan Jalur Teraman Untuk Perjalanan Anda",
  description:
    "SafeRoute membantu Anda menemukan jalur teraman berdasarkan data kriminalitas, penerangan jalan, dan laporan warga secara real-time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AOS />
        {children}
      </body>
    </html>
  );
}