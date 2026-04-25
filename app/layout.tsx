import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/AppNav";
import MagicCursor from "@/components/MagicCursor";

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "焦虑解码器",
  description: "把脑子里的担心倒出来，看清剩多少。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MagicCursor />
        <AppNav />
        {children}
      </body>
    </html>
  );
}
