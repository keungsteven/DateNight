"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Desktop physics constants
const DESKTOP = {
  FLEE_RADIUS: 180,
  NEAR_MISS_RADIUS: 100,
  FLEE_FORCE: 0.65,
  FRICTION: 0.88,
  DRIFT_FORCE: 0.1,
  WANDER_FORCE: 0,
  BASE_MAX_SPEED: 12,
  SPEED_INCREMENT: 0.45,
  START_SPEED: 1,
  WANDER_INTERVAL: 0,
  WANDER_CLOSE_RADIUS: 0,
};

// Mobile physics constants — more aggressive in every dimension
const MOBILE = {
  FLEE_RADIUS: 260,           // Fingers are wide — start fleeing from further away
  NEAR_MISS_RADIUS: 160,      // Larger near-miss zone
  FLEE_FORCE: 1.4,            // Much sharper flee burst on touch
  FRICTION: 0.91,             // Slightly less friction so momentum carries
  DRIFT_FORCE: 0,             // Replaced entirely by wander targeting
  WANDER_FORCE: 0.42,         // Steering force toward wander target
  BASE_MAX_SPEED: 20,         // Faster ceiling
  SPEED_INCREMENT: 1.0,       // Escalates faster per touch
  START_SPEED: 1.8,           // Starts already moving fast
  WANDER_INTERVAL: 2200,      // Pick a new target every 2.2s
  WANDER_CLOSE_RADIUS: 90,    // Pick a new target when this close to current one
};

const BUTTON_W = 290;
const BUTTON_H = 60;
const MARGIN = 24;
const MAX_SPEED_MULTIPLIER = 10;

function randomWanderTarget(w: number, h: number) {
  return {
    x: MARGIN + BUTTON_W / 2 + Math.random() * (w - MARGIN * 2 - BUTTON_W),
    y: MARGIN + BUTTON_H / 2 + Math.random() * (h - MARGIN * 2 - BUTTON_H),
  };
}

export default function DodgingButton() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  const posRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const speedRef = useRef(1);
  const cursorRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const lastNearMissRef = useRef(0);
  const isMobileRef = useRef(false);
  const wanderTargetRef = useRef({ x: 0, y: 0 });
  const lastWanderChangeRef = useRef(0);

  useEffect(() => {
    const isMobile =
      "ontouchstart" in window || navigator.maxTouchPoints > 1;
    isMobileRef.current = isMobile;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const x = w * 0.6 + Math.random() * (w * 0.3 - BUTTON_W / 2);
    const y = h * 0.65 + Math.random() * (h * 0.2);
    const safeX = Math.min(Math.max(x, MARGIN + BUTTON_W / 2), w - MARGIN - BUTTON_W / 2);
    const safeY = Math.min(Math.max(y, MARGIN + BUTTON_H / 2), h - MARGIN - BUTTON_H / 2);

    posRef.current = { x: safeX, y: safeY };
    wanderTargetRef.current = randomWanderTarget(w, h);
    speedRef.current = isMobile ? MOBILE.START_SPEED : DESKTOP.START_SPEED;

    setPos({ x: safeX, y: safeY });
    setInitialized(true);
  }, []);

  const onPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      cursorRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    cursorRef.current = { x: tx, y: ty };

    const C = MOBILE;
    // Larger speed bump on touch than near-miss alone
    speedRef.current = Math.min(speedRef.current + C.SPEED_INCREMENT * 1.5, MAX_SPEED_MULTIPLIER);

    // Immediately kick velocity away from touch point
    const { x: bx, y: by } = posRef.current;
    const dx = bx - tx;
    const dy = by - ty;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const burstScale = C.FLEE_FORCE * speedRef.current * 3;
    velocityRef.current = {
      vx: velocityRef.current.vx + (dx / dist) * burstScale,
      vy: velocityRef.current.vy + (dy / dist) * burstScale,
    };
  }, []);

  const animate = useCallback(() => {
    const C = isMobileRef.current ? MOBILE : DESKTOP;
    const { x: bx, y: by } = posRef.current;
    const { vx: cvx, vy: cvy } = velocityRef.current;
    const { x: cx, y: cy } = cursorRef.current;
    const speed = speedRef.current;
    const now = Date.now();

    const dx = bx - cx;
    const dy = by - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let fx = 0;
    let fy = 0;

    // Flee from cursor/touch
    if (dist < C.FLEE_RADIUS && dist > 0) {
      fx = (dx / dist) * C.FLEE_FORCE * speed;
      fy = (dy / dist) * C.FLEE_FORCE * speed;
    }

    // Speed escalation on near-miss (throttled)
    if (dist < C.NEAR_MISS_RADIUS && now - lastNearMissRef.current > 250) {
      speedRef.current = Math.min(speedRef.current + C.SPEED_INCREMENT, MAX_SPEED_MULTIPLIER);
      lastNearMissRef.current = now;
    }

    // Mobile wander: steer toward a roaming target for constant movement
    if (C.WANDER_FORCE > 0) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const { x: wx, y: wy } = wanderTargetRef.current;
      const wdx = wx - bx;
      const wdy = wy - by;
      const wdist = Math.sqrt(wdx * wdx + wdy * wdy);

      // Pick a new target if close enough or interval elapsed
      if (
        wdist < C.WANDER_CLOSE_RADIUS ||
        now - lastWanderChangeRef.current > C.WANDER_INTERVAL
      ) {
        wanderTargetRef.current = randomWanderTarget(w, h);
        lastWanderChangeRef.current = now;
      } else {
        fx += (wdx / wdist) * C.WANDER_FORCE * speed;
        fy += (wdy / wdist) * C.WANDER_FORCE * speed;
      }
    }

    // Desktop drift (organic random nudge when not wandering)
    if (C.DRIFT_FORCE > 0) {
      fx += (Math.random() - 0.5) * C.DRIFT_FORCE * speed;
      fy += (Math.random() - 0.5) * C.DRIFT_FORCE * speed;
    }

    // Integrate velocity
    let vx = cvx * C.FRICTION + fx;
    let vy = cvy * C.FRICTION + fy;

    // Clamp to max speed
    const curSpd = Math.sqrt(vx * vx + vy * vy);
    const maxS = C.BASE_MAX_SPEED * speed;
    if (curSpd > maxS) {
      vx = (vx / curSpd) * maxS;
      vy = (vy / curSpd) * maxS;
    }

    let newX = bx + vx;
    let newY = by + vy;

    // Bounce off walls
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
      aria-label="Uncatchable button: Something yummy! Let's go out!"
    >
      Something yummy! Let&apos;s go out!
    </button>
  );
}
