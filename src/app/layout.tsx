import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cabinet Samet de Comptabilité — L'expertise comptable au service de votre croissance",
  description:
    "Portail client sécurisé du Cabinet Samet de Comptabilité : déposez vos factures, contrats de leasing et relevés bancaires et suivez leur traitement en temps réel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
