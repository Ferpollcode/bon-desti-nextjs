import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bon Desti Access",
  description: "Sistema de accesos, seguridad y administracion para Bon Desti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="/legacy/assets/vendor/tabler-icons/tabler-icons.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('gd_theme')==='dark')document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
