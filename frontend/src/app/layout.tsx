import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HelpButton from "../components/HelpButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aurex - Smart Exam Paper Generation",
  description: "Smart. Secure. Exam Paper Generation.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <HelpButton />
      </body>
    </html>
  );
}
