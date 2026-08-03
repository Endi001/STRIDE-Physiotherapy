import { useLayoutEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { stridemedia, clinic } from "@/lib/stride-media";
import { useBooking } from "../booking-context";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const w1Ref = useRef<HTMLSpanElement>(null);
  const w2Ref = useRef<HTMLSpanElement>(null);
  const w3Ref = useRef<HTMLSpanElement>(null);
  const w4Ref = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const { openModal } = useBooking();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia?.("(max-width: 767px)").matches;
    if (prefersReduced || isMobile) return;

    const section = sectionRef.current!;
    const mask = maskRef.current!;
    const wraps = [w2Ref.current!, w3Ref.current!, w4Ref.current!];

    // Drive-phase entrance
    gsap.set([w2Ref.current, w3Ref.current, w4Ref.current], { clipPath: "inset(0 100% 0 0)" });
    gsap.set(w1Ref.current, { scale: 1 });

    // Flight-phase: scroll-linked mask widen + headline assembly
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=100%",
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Mask widens (Flight-phase, scrubbed 1:1)
    tl.fromTo(mask, { clipPath: "inset(18% 22% 18% 22%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0);
    // Scroll cue fades out early
    tl.to(cueRef.current, { opacity: 0, duration: 0.1 }, 0);
    // Word 2, 3, 4 mask-reveal sequentially
    wraps.forEach((el, i) => {
      tl.to(el, { clipPath: "inset(0 0% 0 0)", ease: "none", duration: 0.28 }, 0.15 + i * 0.22);
    });
    // Recovery-phase headline settle: subtle nudge into position at end
    tl.to(headlineRef.current, { y: -8, ease: "none", duration: 0.2 }, 0.85);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden stride-section-dark"
      aria-label="Hero"
    >
      {/* Poster paints instantly to avoid layout shift */}
      <div
        ref={maskRef}
        className="absolute inset-0"
        style={{ clipPath: "inset(18% 22% 18% 22%)" }}
      >
        <img
          src={stridemedia.hero.poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={stridemedia.hero.src}
          poster={stridemedia.hero.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[color:var(--ink)]/25" />
      </div>

      {/* Eyebrow bottom-left — Drive-phase in on load */}
      <div className="absolute bottom-6 left-5 md:left-8 z-10 eyebrow text-[color:var(--text-on-dark)]/85 animate-[stride-fade-in_0.8s_var(--ease-drive)_0.8s_both]">
        Physiotherapy — Ashfield Quay
      </div>

      {/* Scroll cue */}
      <div
        ref={cueRef}
        className="absolute bottom-6 right-6 z-10 eyebrow text-[color:var(--text-on-dark)]/80 stride-scroll-cue hidden md:flex items-center gap-2"
      >
        Scroll
        <span className="inline-block w-[1px] h-6 bg-current" />
      </div>

      {/* Headline over crop */}
      <div
        ref={headlineRef}
        className="absolute inset-0 flex items-center justify-center px-4 z-10"
      >
        <h1
          className="font-display uppercase text-[color:var(--text-on-dark)] text-center leading-[0.86] tracking-[-0.01em]"
          style={{
            fontSize: "clamp(3.5rem, 12vw, 12rem)",
            textShadow: "0 4px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span ref={w1Ref} className="inline-block">Momentum</span>{" "}
          <span ref={w2Ref} className="inline-block" style={{ clipPath: "inset(0 100% 0 0)" }}>
            is
          </span>{" "}
          <span ref={w3Ref} className="inline-block" style={{ clipPath: "inset(0 100% 0 0)" }}>
            built,
          </span>{" "}
          <span ref={w4Ref} className="inline-block" style={{ clipPath: "inset(0 100% 0 0)" }}>
            not born.
          </span>
        </h1>
      </div>

      {/* End-state: subhead + CTAs (visible from start on mobile; on desktop they overlay by scene end) */}
      <div className="absolute left-5 right-5 md:left-8 md:right-8 bottom-16 md:bottom-24 z-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pointer-events-auto">
        <p className="max-w-md text-[color:var(--text-on-dark)]/90 text-sm md:text-base leading-relaxed">
          {clinic.heroSub}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openModal}
            className="bg-[color:var(--ember)] px-5 py-3 text-[color:var(--ember-foreground)] font-medium cursor-pointer"
            style={{ borderRadius: 3 }}
          >
            Book an assessment
          </button>
          <Link
            to="/"
            hash="method"
            className="px-5 py-3 border border-[color:var(--hairline-dark-strong)] text-[color:var(--text-on-dark)] hover:border-[color:var(--ember)] hover:text-[color:var(--ember)] transition cursor-pointer"
            style={{ borderRadius: 3 }}
          >
            See how we work
          </Link>
        </div>
      </div>

      <style>{`@keyframes stride-fade-in { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform: translateY(0) } }`}</style>
    </section>
  );
}
