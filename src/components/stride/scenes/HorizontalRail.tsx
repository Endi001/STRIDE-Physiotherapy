import { Link } from "@tanstack/react-router";
import { useLayoutEffect, useRef } from "react";
import { stridemedia, clinic } from "@/lib/stride-media";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Scene 4 — Horizontal acceleration sequence.
// Vertical scroll converts to horizontal progression via ScrollTrigger pin+scrub.
export function HorizontalRail() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia?.("(max-width: 767px)").matches;
    if (prefersReduced || isMobile) return;

    let cleanup: (() => void) | undefined;

    const wrap = wrapRef.current!;
    const track = trackRef.current!;
    const getDistance = () => track.scrollWidth - window.innerWidth;
    const getHold = () => window.innerHeight * 0.3; // shorter vertical settle before horizontal pan begins

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 64px",
        end: () => `+=${getDistance() + getHold()}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    // Hold first frame briefly while the user scrolls into the pin,
    // then perform the horizontal pan.
    tl.to(track, { x: 0, duration: () => getHold(), ease: "none" })
      .to(track, { x: () => -getDistance(), duration: () => getDistance(), ease: "none" });

    // Videos: play only current-most-visible one
    const vids = videosRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { root: null, threshold: 0.4 },
    );
    vids.forEach((v) => v && io.observe(v));

    cleanup = () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      io.disconnect();
    };

    return () => { cleanup?.(); };
  }, []);

  return (
    <section aria-label="What we treat" className="stride-section-dark relative">
      {/* Mobile fallback — vertical stack */}
      <div className="md:hidden relative">
        <video
          className="w-full h-[60svh] object-cover"
          src={stridemedia.rail[0]}
          poster={stridemedia.establish.poster}
          muted
          loop
          playsInline
          preload="metadata"
          autoPlay
          aria-hidden
        />
        <div className="absolute inset-0 bg-[color:var(--ink)]/40 pointer-events-none" />
        <div className="relative -mt-[60svh] h-[60svh] flex flex-col items-center justify-center gap-3">
          {clinic.conditions.map((c) => (
            <div key={c} className="font-display text-4xl">{c}</div>
          ))}
        </div>
        <div className="py-20 px-6 text-center border-t border-[color:var(--text-on-dark)]/15">
          <div className="eyebrow text-[color:var(--muted-on-dark)] mb-4 tracking-wider">And a lot more</div>
          <Link
            to="/treatments"
            className="inline-block font-display text-[clamp(1.5rem,6vw,2.5rem)] uppercase leading-[1] hover:text-[color:var(--ember)] transition-colors"
          >
            → See every condition we treat
          </Link>
        </div>
      </div>

      {/* Desktop horizontal rail */}
      <div ref={wrapRef} className="hidden md:block relative h-[calc(100svh-4rem)] overflow-hidden bg-[color:var(--ink)]">
        <div
          ref={trackRef}
          className="absolute top-0 left-0 flex will-change-transform h-full"
          style={{ width: `${(clinic.conditions.length + 1) * 100}vw` }}
        >
          {clinic.conditions.map((word, i) => (
            <div key={word} className="relative w-screen h-full shrink-0">
              <video
                ref={(el) => { videosRef.current[i] = el; }}
                className="absolute inset-0 w-full h-full object-cover"
                src={stridemedia.rail[i % stridemedia.rail.length]}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
              />
              <div className="absolute inset-0 bg-[color:var(--ink)]/45" />
              <div className="relative h-full flex items-center justify-center px-10">
                <div className="font-display uppercase text-[color:var(--text-on-dark)] leading-[0.85]"
                  style={{ fontSize: "clamp(6rem, 22vw, 24rem)" }}>
                  {word}
                </div>
              </div>
              <div className="absolute top-8 left-10 eyebrow text-[color:var(--muted-on-dark)]">
                0{i + 1} / 0{clinic.conditions.length}
              </div>
            </div>
          ))}
          {/* End card */}
          <div className="relative w-screen h-full shrink-0 flex items-center justify-center bg-[color:var(--ink)]">
            <div className="text-center">
              <div className="eyebrow text-[color:var(--muted-on-dark)] mb-4">And a lot more</div>
              <Link
                to="/treatments"
                className="inline-block font-display text-[clamp(2.5rem,6vw,5rem)] uppercase hover:text-[color:var(--ember)] transition-colors"
              >
                → See every condition we treat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
