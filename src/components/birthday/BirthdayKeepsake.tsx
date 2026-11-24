import { useState } from "react";
import { Download, Heart, Music2, Pause, Play, Sparkles } from "lucide-react";
import { photoUrl, type Photo, type SiteContent } from "@/lib/site-content";

function firstAvailablePhoto(content: SiteContent): Photo | undefined {
  return [content.keepsake.photo, ...content.memories.photos, ...content.wall.photos, content.statement.photo, content.ribbon.photo].find((photo) => photo.id);
}

function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string) {
  ctx.font = font;
  const words = text.split(/\s+/);
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      ctx.fillText(line, x, y + lineIndex++ * lineHeight);
      line = word;
    } else line = candidate;
  }
  if (line) ctx.fillText(line, x, y + lineIndex * lineHeight);
  return lineIndex + 1;
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, size = 22) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "#866a2d"; ctx.lineWidth = 2.2;
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -size * 0.55, size * 0.25, size * 0.48, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

export function BirthdayKeepsake({ content, name }: { content: SiteContent; name: string }) {
  const [status, setStatus] = useState("");
  const [playing, setPlaying] = useState(false);
  const photo = firstAvailablePhoto(content);
  const cardName = name.trim().slice(0, 40) || content.name;

  const downloadCard = async () => {
    setStatus("Preparing your card…");
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1120; canvas.height = 1400;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#fbfaf3"; ctx.fillRect(0, 0, 1120, 1400);
      ctx.strokeStyle = "#987a37"; ctx.lineWidth = 1.5; ctx.strokeRect(13, 13, 1094, 1374);
      ctx.lineWidth = 3; ctx.strokeRect(23, 23, 1074, 1354);
      ctx.lineWidth = 1; ctx.strokeRect(31, 31, 1058, 1358);

      ctx.fillStyle = "#283c29"; ctx.textBaseline = "alphabetic"; ctx.font = "bold 15px Georgia"; ctx.textAlign = "left"; ctx.fillText(" ", 74, 84);
      ctx.textAlign = "right"; ctx.fillText("✦  WITH LOVE", 1046, 84);
      drawFlower(ctx, 1007, 161, 18);
      const frame = { x: 290, y: 125, w: 540, h: 442 };
      if (photo?.id) {
        const image = new Image(); image.src = photoUrl(photo.id);
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not load the card portrait")); });
        const scale = Math.max(frame.w / image.naturalWidth, frame.h / image.naturalHeight);
        const sw = frame.w / scale; const sh = frame.h / scale;
        ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, frame.x, frame.y, frame.w, frame.h);
      } else {
        ctx.fillStyle = "#e9eadf"; ctx.fillRect(frame.x, frame.y, frame.w, frame.h); ctx.fillStyle = "#52654a"; ctx.font = "60px Georgia"; ctx.textAlign = "center"; ctx.fillText("♡", 560, 360);
      }
      ctx.strokeStyle = "#a5873d"; ctx.lineWidth = 3; ctx.strokeRect(frame.x - 11, frame.y - 11, frame.w + 22, frame.h + 22);
      ctx.lineWidth = 1; ctx.strokeRect(frame.x - 18, frame.y - 18, frame.w + 36, frame.h + 36);
      ctx.textAlign = "center"; ctx.fillStyle = "#75602f"; ctx.font = "bold 15px Georgia"; ctx.fillText("A DAY AS LOVELY AS YOU", 560, 641);
      ctx.fillStyle = "#263d28"; ctx.font = "bold 60px Georgia"; ctx.fillText("Happy Birthday,", 560, 720);
      let nameFont = 58; ctx.font = `italic ${nameFont}px Georgia`;
      while (ctx.measureText(cardName).width > 740 && nameFont > 34) { nameFont -= 2; ctx.font = `italic ${nameFont}px Georgia`; }
      ctx.fillStyle = "#77784a"; ctx.fillText(cardName, 560, 778);
      ctx.fillStyle = "#354c36";
      const wishLines = drawWrapped(ctx, content.keepsake.wish, 560, 830, 880, 35, "26px Arial");
      const separatorY = Math.min(930, 840 + wishLines * 35 + 22);
      ctx.strokeStyle = "#987a37"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(442, separatorY); ctx.lineTo(520, separatorY); ctx.moveTo(600, separatorY); ctx.lineTo(678, separatorY); ctx.stroke(); drawFlower(ctx, 560, separatorY, 12);
      ctx.fillStyle = "#314832";
      let poemY = separatorY + 54;
      for (const paragraph of content.keepsake.poem.split(/\r?\n\s*\r?\n/)) {
        const lines = drawWrapped(ctx, paragraph, 560, poemY, 880, 27, "italic bold 18px Georgia");
        poemY += lines * 27 + 8;
      }
      ctx.fillStyle = "#29402c"; ctx.font = "italic 42px cursive"; ctx.fillText(content.keepsake.signature.slice(0, 35), 560, 1260);
      drawFlower(ctx, 105, 1292, 27);
      ctx.strokeStyle = "#987a37"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(140, 1304); ctx.lineTo(1047, 1304); ctx.stroke();
      ctx.fillStyle = "#75602f"; ctx.font = "bold 12px Georgia"; ctx.textAlign = "left"; ctx.fillText("O N E   O F   A   K I N D", 74, 1340); ctx.textAlign = "right"; ctx.fillText("M A D E   T O   B E   K E P T", 1047, 1340);

      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create the image")), "image/png"));
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url;
      link.download = `${cardName.replace(/[^\p{L}\p{N}-]+/gu, "-") || "birthday"}-birthday-card.png`;
      document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Your birthday card has been downloaded as a PNG image.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "The card could not be downloaded. Please try again."); }
  };

  if (!content.keepsake.enabled) return null;
  const audioUrl = content.birthdayAudio.id ? `/api/public/birthday-audio/${content.birthdayAudio.id}` : null;
  return <section aria-labelledby="keepsake-title" className="relative z-10 overflow-hidden bg-mint px-4 py-14 text-forest sm:px-8 sm:py-20">
    <div className="mx-auto max-w-4xl text-center">
      <p className="font-hand text-3xl text-jade">One last little surprise</p>
      <h2 id="keepsake-title" className="mt-2 font-display text-4xl sm:text-6xl">A card to keep <Heart className="inline h-8 w-8 fill-jade text-jade" aria-hidden="true" /></h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-forest/75">A little piece of today, made for you to keep.</p>
      <article className="birthday-card paper mx-auto mt-8 max-w-2xl border-[5px] border-double border-[#987a37] bg-[#fbfaf3] px-6 py-7 text-[#283c29] shadow-xl sm:px-10 sm:py-9">
        <header className="flex justify-between gap-2 text-[9px] font-bold tracking-[.16em] sm:text-xs"><span> </span><span>✦ &nbsp; WITH LOVE</span></header>
        {photo?.id ? <img src={photoUrl(photo.id)} alt={photo.alt || `Portrait of ${cardName}`} className="mx-auto mt-6 aspect-[1.22] w-[62%] border-[5px] border-double border-[#a5873d] object-cover" draggable={false} /> : <div className="mx-auto mt-6 flex aspect-[1.22] w-[62%] items-center justify-center border-[5px] border-double border-[#a5873d] bg-[#e9eadf] text-5xl">♡</div>}
        <p className="mt-7 text-[10px] font-bold tracking-[.2em] text-[#75602f]">A DAY AS LOVELY AS YOU</p>
        <p className="mt-2 font-display text-3xl font-bold sm:text-5xl">Happy Birthday,</p>
        <p className="font-display text-3xl italic text-[#77784a] sm:text-5xl">{cardName}</p>
        <p className="mt-3 text-sm sm:text-lg">{content.keepsake.wish}</p>
        <div className="my-5 flex items-center justify-center gap-4 text-[#987a37]"><span className="h-px w-12 bg-current"/><span>❀</span><span className="h-px w-12 bg-current"/></div>
        <p className="whitespace-pre-line font-display text-sm font-semibold italic leading-relaxed sm:text-lg">{content.keepsake.poem}</p>
        <p className="mt-8 font-hand text-3xl italic">{content.keepsake.signature}♡</p>
        <footer className="mt-3 flex justify-between border-t border-[#987a37] pt-3 text-[8px] font-bold tracking-[.16em] text-[#75602f] sm:text-[10px]"><span>ONE OF A KIND</span><span>MADE TO BE KEPT</span></footer>
      </article>
      {audioUrl && <div className="mx-auto mt-7 flex max-w-sm items-center justify-between gap-4 rounded-full border border-forest/15 bg-cream px-5 py-3 shadow-sm">
        <span className="flex items-center gap-2 text-sm font-semibold"><Music2 className="h-4 w-4 text-jade"/> Birthday soundtrack</span>
        <audio src={audioUrl} loop preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        <button type="button" aria-label={playing ? "Pause birthday soundtrack" : "Play birthday soundtrack"} onClick={(event) => { const audio = event.currentTarget.parentElement?.querySelector("audio"); if (!audio) return; if (audio.paused) void audio.play().catch(() => setStatus("Tap play again to start the soundtrack.")); else audio.pause(); }} className="rounded-full bg-forest p-2 text-cream hover:bg-jade">{playing ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}</button>
      </div>}
      <button type="button" onClick={downloadCard} className="mt-8 inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-lg font-bold text-forest shadow-lift transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jade sm:text-xl"><Download className="h-5 w-5" aria-hidden="true"/>Download your birthday Card<Sparkles className="h-5 w-5" aria-hidden="true"/></button>
      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm text-forest/70">{status}</p>
      <p className="mt-1 text-xs text-forest/55">Saved as a PNG image. You can keep it in your photos forever.</p>
    </div>
  </section>;
}
