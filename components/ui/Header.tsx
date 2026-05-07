import { ProfileButton } from "./ProfileButton";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 border-b-2 border-black bg-white">
      <Link
        href="/"
        className="font-display text-2xl tracking-widest hover:opacity-70 transition-opacity"
      >
        FTC
      </Link>
      <ProfileButton />
    </header>
  );
}
