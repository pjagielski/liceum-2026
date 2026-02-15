import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata = {
  title: "Progi punktowe 2025 - Warszawa",
  description:
    "Interaktywna tabela progów punktowych liceów i techników na podstawie danych z PDF miasta st. Warszawy.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
