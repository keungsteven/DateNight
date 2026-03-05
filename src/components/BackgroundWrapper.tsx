"use client";

import { useState } from "react";
import Image from "next/image";

export default function BackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background layer */}
      {!imageError ? (
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback gradient if no background.jpg is uploaded yet
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1a0533 0%, #3b0764 30%, #7c2d8e 60%, #c2185b 100%)",
          }}
        />
      )}

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content above both layers */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
