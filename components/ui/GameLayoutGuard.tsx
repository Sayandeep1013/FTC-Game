"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

// Detects the active game board route and strips the global header/footer.
// The GameBoard component owns its own full-viewport HUD on that route.
export function GameLayoutGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isGameBoard = /^\/room\/[^/]+\/game/.test(pathname);

  if (isGameBoard) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="pt-14 flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </>
  );
}
