import type { Metadata } from "next";
import { Space_Grotesk, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import { GameLayoutGuard } from "@/components/ui/GameLayoutGuard";
import { LoadingWrapper } from "@/components/ui/LoadingScreen";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FTC — Fantasy Trump Cards",
  description: "Real-time multiplayer fantasy trump card game. Pick a universe, choose a deck, call your stats, and win the pile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}>
      <body>
        <LoadingWrapper>
          <GameLayoutGuard>{children}</GameLayoutGuard>
        </LoadingWrapper>
      </body>
    </html>
  );
}
