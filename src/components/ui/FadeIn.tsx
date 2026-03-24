"use client";

import { useEffect, useRef, useState } from "react";

interface FadeInProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly delay?: number;
  readonly direction?: "up" | "left" | "right" | "none";
}

export default function FadeIn({
  children,
  className = "",
  style,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translate = {
    up:    "translateY(28px)",
    left:  "translateX(-28px)",
    right: "translateX(28px)",
    none:  "none",
  }[direction];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity:    visible ? 1 : 0,
        transform:  visible ? "none" : translate,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
