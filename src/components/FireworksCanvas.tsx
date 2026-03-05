"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  radius: number;
  color: string;
}

interface Shell {
  particles: Particle[];
  done: boolean;
}

function createShell(canvas: HTMLCanvasElement): Shell {
  const x = canvas.width * 0.1 + Math.random() * canvas.width * 0.8;
  const y = canvas.height * 0.1 + Math.random() * canvas.height * 0.55;
  const baseHue = Math.floor(Math.random() * 360);
  const count = 80 + Math.floor(Math.random() * 50);

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5.5;
    const hue = (baseHue + Math.floor(Math.random() * 60) - 30 + 360) % 360;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: 0.012 + Math.random() * 0.01,
      radius: 1.5 + Math.random() * 2,
      color: `hsl(${hue}, 100%, 65%)`,
    });
  }

  return { particles, done: false };
}

export default function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafHandle: number;
    const shells: Shell[] = [];
    let lastLaunch = 0;
    let nextInterval = 500;
    const GRAVITY = 0.06;
    const MAX_CONCURRENT = 6;
    const LAUNCH_MIN = 400;
    const LAUNCH_MAX = 900;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(timestamp: number) {
      // Semi-transparent fill creates the glowing trail effect
      ctx!.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (const shell of shells) {
        for (const p of shell.particles) {
          if (p.alpha <= 0) continue;

          p.vy += GRAVITY;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.alpha -= p.decay;

          ctx!.globalAlpha = Math.max(0, p.alpha);
          ctx!.fillStyle = p.color;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx!.fill();
        }
        shell.done = shell.particles.every((p) => p.alpha <= 0);
      }

      ctx!.globalAlpha = 1;

      // Remove finished shells
      for (let i = shells.length - 1; i >= 0; i--) {
        if (shells[i].done) shells.splice(i, 1);
      }

      // Launch new shell
      if (timestamp - lastLaunch > nextInterval && shells.length < MAX_CONCURRENT) {
        shells.push(createShell(canvas!));
        lastLaunch = timestamp;
        nextInterval = LAUNCH_MIN + Math.random() * (LAUNCH_MAX - LAUNCH_MIN);
      }

      rafHandle = requestAnimationFrame(draw);
    }

    rafHandle = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafHandle);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
