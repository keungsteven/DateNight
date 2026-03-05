import FireworksCanvas from "@/components/FireworksCanvas";

export default function CelebrationPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Fireworks fills the full screen */}
      <FireworksCanvas />

      {/* Message layered on top */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-6">
        <p
          className="text-5xl md:text-7xl font-black text-white text-center leading-tight animate-bounce-slow"
          style={{
            textShadow:
              "0 0 20px rgba(255,220,0,0.9), 0 0 40px rgba(255,150,0,0.5), 0 4px 8px rgba(0,0,0,0.8)",
          }}
        >
          Wow! What a great choice :)
        </p>
        <p
          className="mt-8 text-3xl md:text-5xl font-extrabold text-yellow-300 text-center leading-snug animate-fade-in"
          style={{
            animationDelay: "0.4s",
            textShadow:
              "0 0 15px rgba(255,200,0,0.7), 0 0 30px rgba(255,150,0,0.4), 0 3px 6px rgba(0,0,0,0.8)",
          }}
        >
          you are the perfect wife!
        </p>
      </div>
    </div>
  );
}
