"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Physics constants
const FLEE_RADIUS = 180;
const NEAR_MISS_RADIUS = 100;
const FLEE_FORCE = 0.65;
const FRICTION = 0.88;
const DRIFT_FORCE = 0.1;
const BASE_MAX_SPEED = 12;
const BUTTON_W = 290;
const BUTTON_H = 60;
const MARGIN = 24;
const SPEED_INCREMENT = 0.45;
const MAX_SPEED_MULTIPLIER = 8;

export default function DodgingButton() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  // All physics state in refs — no re-renders for intermediate values
  const posRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const speedRef = useRef(1);
  const cursorRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const lastNearMissRef = useRef(0);

  // Initialize button position after mount (requires window)
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Place in the lower-right quadrant initially, away from the static button
    const x = w * 0.6 + Math.random() * (w * 0.3 - BUTTON_W / 2);
    const y = h * 0.65 + Math.random() * (h * 0.2);

    const safeX = Math.min(Math.max(x, MARGIN + BUTTON_W / 2), w - MARGIN - BUTTON_W / 2);
    const safeY = Math.min(Math.max(y, MARGIN + BUTTON_H / 2), h - MARGIN - BUTTON_H / 2);

    posRef.current = { x: safeX, y: safeY };
    setPos({ x: safeX, y: safeY });
    setInitialized(true);
  }, []);

  // Pointer tracking — write to ref only, no re-render
  const onPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      cursorRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // Touch start also triggers flee immediately
  const onTouchStart = useCallback((e: TouchEvent) => {
    cursorRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    // Bump speed on touch attempt
    speedRef.current = Math.min(speedRef.current + SPEED_INCREMENT, MAX_SPEED_MULTIPLIER);
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    const { x: bx, y: by } = posRef.current;
    const { vx: cvx, vy: cvy } = velocityRef.current;
    const { x: cx, y: cy } = cursorRef.current;
    const speed = speedRef.current;

    // Distance from cursor to button center
    const dx = bx - cx;
    const dy = by - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let fx = 0;
    let fy = 0;

    // Apply flee force when cursor is within range
    if (dist < FLEE_RADIUS && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      fx = nx * FLEE_FORCE * speed;
      fy = ny * FLEE_FORCE * speed;
    }

    // Increment speed on near-miss (throttled to avoid flooding)
    const now = Date.now();
    if (dist < NEAR_MISS_RADIUS && now - lastNearMissRef.current > 300) {
      speedRef.current = Math.min(speedRef.current + SPEED_INCREMENT, MAX_SPEED_MULTIPLIER);
      lastNearMissRef.current = now;
    }

    // Organic drift — always active so the button never stops completely
    fx += (Math.random() - 0.5) * DRIFT_FORCE * speed;
    fy += (Math.random() - 0.5) * DRIFT_FORCE * speed;

    // Integrate velocity with friction
    let vx = cvx * FRICTION + fx;
    let vy = cvy * FRICTION + fy;

    // Clamp to max speed
    const curSpd = Math.sqrt(vx * vx + vy * vy);
    const maxS = BASE_MAX_SPEED * speed;
    if (curSpd > maxS) {
      vx = (vx / curSpd) * maxS;
      vy = (vy / curSpd) * maxS;
    }

    // Advance position
    let newX = bx + vx;
    let newY = by + vy;

    // Bounce off viewport walls
    const w = window.innerWidth;
    const h = window.innerHeight;
    const halfW = BUTTON_W / 2;
    const halfH = BUTTON_H / 2;

    if (newX - halfW < MARGIN) {
      newX = MARGIN + halfW;
      vx = Math.abs(vx) * 0.7;
    } else if (newX + halfW > w - MARGIN) {
      newX = w - MARGIN - halfW;
      vx = -Math.abs(vx) * 0.7;
    }

    if (newY - halfH < MARGIN) {
      newY = MARGIN + halfH;
      vy = Math.abs(vy) * 0.7;
    } else if (newY + halfH > h - MARGIN) {
      newY = h - MARGIN - halfH;
      vy = -Math.abs(vy) * 0.7;
    }

    velocityRef.current = { vx, vy };
    posRef.current = { x: newX, y: newY };
    setPos({ x: newX, y: newY });

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Start animation loop and set up event listeners after initialization
  useEffect(() => {
    if (!initialized) return;

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, [initialized, animate, onPointerMove, onTouchStart]);

  return (
    <button
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%)",
        zIndex: 50,
        visibility: initialized ? "visible" : "hidden",
        cursor: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        transition: "background-color 0.15s ease",
      }}
      className="px-8 py-4 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-lg font-extrabold shadow-2xl border-2 border-rose-300/40"
      // onClick intentionally omitted — the button is meant to be uncatchable
      aria-label="Uncatchable button: Something yummy! Let's go out!"
    >
      Something yummy! Let&apos;s go out!
    </button>
  );
}
