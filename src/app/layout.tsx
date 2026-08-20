import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GESLOC — Ministère de la Justice",
  description: "GESLOC — Gestion des dossiers CPM & DAGE, Ministère de la Justice du Sénégal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
