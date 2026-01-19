import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RefundMe",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ overflowX: 'hidden' }}>
      <body 
        className={`${inter.className} antialiased`} 
        suppressHydrationWarning
        style={{ 
          margin: 0, 
          padding: 0, 
          overflowX: 'hidden',
          minHeight: '100vh'
        }}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
