"use client";

import { useRouter } from "next/navigation";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import DodgingButton from "@/components/DodgingButton";

export default function Home() {
  const router = useRouter();

  return (
    <BackgroundWrapper>
      {/* Main title */}
      <h1
        className="text-4xl md:text-6xl font-black text-white text-center leading-tight mb-14 max-w-3xl"
        style={{
          textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)",
          letterSpacing: "-0.01em",
        }}
      >
        Cinda, what would you like
        <br />
        for dinner tonight?
      </h1>

      {/* The always-clickable good choice button */}
      <button
        onClick={() => router.push("/celebration")}
        className="px-8 py-4 rounded-full bg-emerald-500 text-white text-lg font-extrabold shadow-2xl border-2 border-emerald-300/40 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-200 select-none"
        style={{ zIndex: 20 }}
      >
        Let&apos;s eat at home, leftovers sound good!
      </button>

      {/* Hint text so user knows the red button is special */}
      <p
        className="mt-6 text-white/60 text-sm font-medium"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
      >
        (or try to catch the other button...)
      </p>

      {/* The evasive dodging button — floats freely around the screen */}
      <DodgingButton />
    </BackgroundWrapper>
  );
}
