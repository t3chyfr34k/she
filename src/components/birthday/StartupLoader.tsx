import { useEffect, useMemo, useState } from "react";
import { photoUrl, type SiteContent } from "@/lib/site-content";
import cupcake from "@/assets/card-cupcake.jpg";
import balloons from "@/assets/card-balloons.jpg";
import cake from "@/assets/card-cake.jpg";
import gift from "@/assets/card-gift.jpg";
import paper from "@/assets/paper-texture.jpg";

type StartupLoaderProps = {
  content: SiteContent;
  heroReady: boolean;
};

type ResourceTask = { label: string; run: () => Promise<void> };

const withTimeout = (promise: Promise<unknown>, ms: number) => new Promise<void>((resolve) => {
  const timer = window.setTimeout(resolve, ms);
  promise.then(() => {
    window.clearTimeout(timer);
    resolve();
  }, () => {
    window.clearTimeout(timer);
    resolve();
  });
});

async function settleImage(src: string) {
  const image = new Image();
  await new Promise<void>((resolve) => {
    let settled = false;
    let timer = 0;
    const finish = (abort = false) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (abort) image.src = "";
      resolve();
    };
    timer = window.setTimeout(() => finish(true), 7000);
    image.onload = () => finish();
    image.onerror = () => finish();
    image.src = src;
    if (image.complete) finish();
  });
  if (image.complete && image.naturalWidth > 0 && typeof image.decode === "function") {
    await withTimeout(image.decode(), 1500);
  }
}

function settleVideo(src: string) {
  return new Promise<void>((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    let timer = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      resolve();
    };
    timer = window.setTimeout(finish, 5000);
    video.preload = "metadata";
    video.onloadedmetadata = finish;
    video.onerror = finish;
    video.src = src;
    video.load();
  });
}

export function StartupLoader({ content, heroReady }: StartupLoaderProps) {
  const [open, setOpen] = useState(true);
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [settled, setSettled] = useState(0);
  const [sceneSettled, setSceneSettled] = useState(false);
  const [total, setTotal] = useState(1);
  const [stage, setStage] = useState("Preparing your birthday surprise…");
  const [fullScreenSupported, setFullScreenSupported] = useState(false);
  const [fullScreenMessage, setFullScreenMessage] = useState("");
  const sources = useMemo(() => {
    const sectionPhotos = [
      [content.ribbon.photo, gift] as const,
      [content.statement.photo, cupcake] as const,
      ...content.memories.photos.map((photo, index) => [photo, [cupcake, balloons, cake][index] ?? cupcake] as const),
    ];
    const uploadedWallPhotos = content.wall.photos.flatMap((photo) => photo.id ? [photoUrl(photo.id)] : []);
    return [...new Set([paper, ...sectionPhotos.map(([photo, fallback]) => photo.id ? photoUrl(photo.id) : fallback), ...uploadedWallPhotos])];
  }, [content]);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || window.matchMedia("(display-mode: fullscreen)").matches
      || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setFullScreenSupported(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
    if (standalone) setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    let settledCount = 0;
    const root = document.documentElement;
    const updateViewport = () => {
      const visual = window.visualViewport;
      const width = Math.round(visual?.width || window.innerWidth);
      const height = Math.round(visual?.height || window.innerHeight);
      root.style.setProperty("--app-height", `${height}px`);
      root.dataset["layoutSize"] = width < 640 ? "compact" : width < 1024 ? "medium" : "wide";
      root.dataset["layoutOrientation"] = width >= height ? "landscape" : "portrait";
    };
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    window.addEventListener("orientationchange", updateViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });
    const tasks: ResourceTask[] = [
      { label: "display", run: () => new Promise<void>((resolve) => requestAnimationFrame(() => { updateViewport(); resolve(); })) },
      { label: "fonts", run: () => withTimeout(document.fonts?.ready ?? Promise.resolve(), 3500) },
      ...sources.map((src): ResourceTask => ({ label: "photo", run: () => settleImage(src) })),
      ...(content.backgroundVideo.id ? [{ label: "video", run: () => settleVideo(`/api/public/background-video/${content.backgroundVideo.id}`) }] : []),
    ];
    setTotal(tasks.length + 1); // Include the hero scene as a separately signalled task.
    setSettled(0);
    setSceneSettled(false);
    setStage("Gathering the photos and birthday details…");

    const runTasks = async () => {
      await Promise.all(tasks.map(async (task) => {
        try { await task.run(); } catch { /* A failed resource is settled so the page can still open. */ }
        if (cancelled) return;
        settledCount += 1;
        setSettled(settledCount);
        if (task.label === "display") setStage("Fitting everything to your screen…");
        else if (task.label === "fonts") setStage("Setting the page in its own style…");
        else if (task.label === "video") setStage("Getting the background ready…");
        else if (task.label === "photo") setStage("Unpacking the memories…");
      }));
    };
    void runTasks();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
    };
  }, [content.backgroundVideo.id, sources, started]);

  useEffect(() => {
    if (!started) return;
    if (heroReady) {
      setSceneSettled(true);
      return;
    }
    const fallback = window.setTimeout(() => setSceneSettled(true), 4000);
    return () => window.clearTimeout(fallback);
  }, [heroReady, started]);

  const completeCount = settled + (sceneSettled ? 1 : 0);

  useEffect(() => {
    if (!started || completeCount < total || total <= 1) return;
    setStage("Everything’s ready.");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hideTimer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => setOpen(false), reducedMotion ? 0 : 420);
    }, reducedMotion ? 0 : 280);
    return () => window.clearTimeout(hideTimer);
  }, [completeCount, total, started]);

  async function startLoading(tryFullScreen: boolean) {
    setFullScreenMessage("");
    if (tryFullScreen && fullScreenSupported) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        setFullScreenMessage("Your browser did not allow fullscreen. You can continue in this window.");
        return;
      }
    }
    setStarted(true);
  }

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector("main");
    const oldHtmlOverflow = html.style.overflow;
    const oldBodyOverflow = body.style.overflow;
    const wasInert = main?.inert ?? false;
    const oldAriaHidden = main?.getAttribute("aria-hidden") ?? null;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (main) {
      main.inert = true;
      main.setAttribute("aria-hidden", "true");
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setOpen(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      html.style.overflow = oldHtmlOverflow;
      body.style.overflow = oldBodyOverflow;
      if (main) {
        main.inert = wasInert;
        if (oldAriaHidden === null) main.removeAttribute("aria-hidden");
        else main.setAttribute("aria-hidden", oldAriaHidden);
      }
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        window.dispatchEvent(new Event("birthday:reset-scroll"));
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [open]);

  if (!open) return null;
  const percent = total > 0 ? Math.min(100, Math.round((completeCount / total) * 100)) : 0;

  return (
    <div className={`startup-loader${leaving ? " startup-loader--leaving" : ""}`} role="region" aria-labelledby="startup-loader-title">
      <div className="startup-loader__grain" aria-hidden="true" />
      <div className="startup-loader__content">
        <span className="startup-loader__eyebrow">A little birthday magic</span>
        {!started ? <>
          <h1 id="startup-loader-title" className="startup-loader__prompt-title">A little more room for the surprise?</h1>
          <p className="startup-loader__prompt-copy">Would you like to open this birthday page in full screen before it loads?</p>
          {fullScreenSupported ? <button type="button" className="startup-loader__fullscreen" onClick={() => void startLoading(true)}>Enter full screen</button> : <p className="startup-loader__fullscreen-note">This browser can’t switch to full screen from a webpage. On iPhone, add the site to your Home Screen and open it there for a standalone view.</p>}
          {fullScreenMessage && <p className="startup-loader__fullscreen-note" role="alert">{fullScreenMessage}</p>}
          <button type="button" className="startup-loader__continue" onClick={() => void startLoading(false)}>Continue without full screen</button>
        </> : <>
        <h1 id="startup-loader-title" className="sr-only">Preparing your birthday page</h1>
        <div className="startup-loader__heart" role="img" aria-label="Heart filling as the page gets ready">
          <svg className="startup-loader__heart-shape" viewBox="0 0 120 112" aria-hidden="true">
            <defs>
              <linearGradient id="heart-shell" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff9f0" />
                <stop offset="1" stopColor="#eadbc9" />
              </linearGradient>
              <linearGradient id="heart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d9838f" />
                <stop offset="1" stopColor="#8d344e" />
              </linearGradient>
              <clipPath id="heart-clip"><path d="M60 104 13 58C-14 27 10 2 33 8c13 3 22 13 27 24C65 21 75 11 88 8c23-6 47 19 20 50Z" /></clipPath>
            </defs>
            <path className="startup-loader__heart-shadow" d="M60 108 13 62C-14 31 10 6 33 12c13 3 22 13 27 24C65 25 75 15 88 12c23-6 47 19 20 50Z" />
            <path d="M60 104 13 58C-14 27 10 2 33 8c13 3 22 13 27 24C65 21 75 11 88 8c23-6 47 19 20 50Z" fill="url(#heart-shell)" />
            <g clipPath="url(#heart-clip)">
              <rect className="startup-loader__heart-liquid" x="0" y="112" width="120" height="112" fill="url(#heart-fill)" style={{ transform: `translateY(-${percent}%)` }} />
              <path className="startup-loader__heart-shine" d="M20 29c3-12 13-17 22-14" />
            </g>
            <path className="startup-loader__heart-outline" d="M60 104 13 58C-14 27 10 2 33 8c13 3 22 13 27 24C65 21 75 11 88 8c23-6 47 19 20 50Z" />
          </svg>
          <span className="startup-loader__heart-spark startup-loader__heart-spark--one" aria-hidden="true">✦</span>
          <span className="startup-loader__heart-spark startup-loader__heart-spark--two" aria-hidden="true">✧</span>
        </div>
        <p className="startup-loader__stage" role="status" aria-live="polite">{stage}</p>
        <div className="startup-loader__meter" role="progressbar" aria-label="Page readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span className="startup-loader__meter-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="startup-loader__percent">{percent}%</div>
        </>}
      </div>
    </div>
  );
}
