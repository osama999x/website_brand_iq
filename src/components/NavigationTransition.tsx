"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationTransitionInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const prevKeyRef = useRef<string | null>(null);
  const [burstId, setBurstId] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (prevKeyRef.current === null) {
      prevKeyRef.current = routeKey;
      return;
    }
    if (prevKeyRef.current === routeKey) return;
    prevKeyRef.current = routeKey;
    setBurstId((n) => n + 1);
  }, [routeKey]);

  if (burstId === 0) return null;

  return (
    <>
      <div
        key={`bar-${burstId}`}
        className="fixed top-0 left-0 right-0 z-[220] h-[2px] overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="h-full w-full bg-neutral-900 origin-left animate-route-progress" />
      </div>
      {!reducedMotion ? (
        <div
          key={`flash-${burstId}`}
          className="fixed inset-0 z-[210] pointer-events-none bg-white animate-route-flash"
          aria-hidden
        />
      ) : null}
    </>
  );
}

export default function NavigationTransition() {
  return (
    <Suspense fallback={null}>
      <NavigationTransitionInner />
    </Suspense>
  );
}
