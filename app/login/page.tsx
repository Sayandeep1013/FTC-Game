import { signInWithGoogle } from "@/lib/auth/actions";
import { BackButton } from "@/components/ui/BackButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Corner decorations */}
      <div className="fixed top-0 left-0 w-16 h-16 border-r-2 border-b-2 border-black" />
      <div className="fixed top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-black" />
      <div className="fixed bottom-0 left-0 w-16 h-16 border-r-2 border-t-2 border-black" />
      <div className="fixed bottom-0 right-0 w-16 h-16 border-l-2 border-t-2 border-black" />

      <div
        className="panel-brutal p-8 w-full max-w-sm"
      >
        {/* Header bar */}
        <div className="-mx-8 -mt-8 px-6 py-4 bg-black border-b-2 border-black mb-8">
          <h1 className="font-display text-white text-3xl tracking-widest">SIGN IN</h1>
          <p className="text-grey-mid text-xs uppercase tracking-wider mt-0.5">
            to FTC — Fantasy Trump Cards
          </p>
        </div>

        <p className="text-sm text-grey-dark mb-6 leading-relaxed">
          Sign in to unlock a custom profile picture and track your win history.
          Guests can still play without an account.
        </p>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="btn-brutal btn-primary w-full flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <div className="mt-4 pt-4 border-t-2 border-grey-light text-center">
          <BackButton fallback="/" />
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" fill="#fff" fillOpacity=".7"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z" fill="#fff" fillOpacity=".5"/>
    </svg>
  );
}
