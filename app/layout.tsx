import type { Metadata } from "next";
import { Space_Grotesk, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { TopoBackground } from "@/components/home/TopoBackground";
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
  description: "Real-time multiplayer fantasy trump card game. Pick a deck. Call your stats. Win the pile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}>
      <body>
        <LoadingWrapper>
          {/* Topographic contour lines — fixed behind every page */}
          <TopoBackground fixed />
          <Header />
          <div className="pt-14 flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </LoadingWrapper>
      </body>
    </html>
  );
}
