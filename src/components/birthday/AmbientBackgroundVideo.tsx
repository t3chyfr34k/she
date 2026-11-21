import type { BackgroundVideo as BackgroundVideoSettings } from "@/lib/site-content";
import { useEffect, useRef } from "react";

export function AmbientBackgroundVideo({ settings }: { settings: BackgroundVideoSettings }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || connection?.saveData) {
      video.pause();
      return;
    }

    let resumeTimer = 0;
    const resume = () => {
      if (!document.hidden) void video.play().catch(() => undefined);
    };
    const pause = () => video.pause();
    const onScroll = () => {
      pause();
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(resume, 220);
    };
    const onVisibility = () => (document.hidden ? pause() : resume());

    resume();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(resumeTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      pause();
    };
  }, [settings.id, settings.opacity]);

  if (!settings.id || settings.opacity <= 0) return null;

  return (
    <video
      ref={videoRef}
      className="ambient-background-video"
      src={`/api/public/background-video/${settings.id}`}
      aria-hidden="true"
      tabIndex={-1}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      style={{
        opacity: settings.opacity,
        mixBlendMode: settings.blendMode,
        filter: `blur(${settings.blur}px)`,
      }}
    />
  );
}
