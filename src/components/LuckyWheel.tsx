import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Copy, Check, Gift, Loader2, Volume2, VolumeX, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const STORAGE_KEY = "camisjose_wheel_played";

type Segment = { id: string; short: string; winner: boolean; note?: string };

// Visual order of the wheel (probabilities live server-side)
const SEGMENTS: Segment[] = [
  { id: "off10", short: "10 € DTO", winner: true, note: "Pedido mínimo 90 €" },
  { id: "retry", short: "SIGUE PROBANDO SUERTE", winner: false },
  { id: "off7", short: "7 € DTO", winner: true, note: "Pedido mínimo 70 €" },
  { id: "raffle", short: "SORTEO CAMISETA PREMIUM", winner: true },
  { id: "off5", short: "5 € DTO", winner: true, note: "Pedido mínimo 50 €" },
  { id: "off3", short: "3 € DTO", winner: true, note: "Pedido mínimo 50 €" },
];


const MIN_ORDER: Record<string, number> = { off10: 90, off7: 70, off5: 50, off3: 50 };

const SEG_ANGLE = 360 / SEGMENTS.length;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(index: number) {
  const start = index * SEG_ANGLE;
  const end = start + SEG_ANGLE;
  const a = polar(150, 150, 148, start);
  const b = polar(150, 150, 148, end);
  return `M150,150 L${a.x},${a.y} A148,148 0 0,1 ${b.x},${b.y} Z`;
}

function playSpinSound(muted: boolean) {
  if (muted) return () => {};
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    let stopped = false;
    let tick = 0;
    const interval = window.setInterval(() => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 780 - Math.min(tick * 6, 380);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
      tick += 1;
    }, 90);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.setTimeout(() => ctx.close().catch(() => {}), 200);
    };
  } catch {
    return () => {};
  }
}

function fireConfetti() {
  const colors = ["#E30613", "#ffffff", "#111111"];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors }), 350);
}

type SpinResult = {
  prize_id: string;
  prize_label: string;
  code: string | null;
  is_winner: boolean;
  alreadyPlayed?: boolean;
};

const LuckyWheel = () => {
  const [email, setEmail] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    setPlayed(Boolean(localStorage.getItem(STORAGE_KEY) || document.cookie.includes(`${STORAGE_KEY}=1`)));
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !seenRef.current) {
          seenRef.current = true;
          trackEvent("wheel_shown", { location: "home" });
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const markPlayed = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    document.cookie = `${STORAGE_KEY}=1; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    setPlayed(true);
  }, []);

  const handleSpin = async () => {
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      toast.error("Introduce un correo electrónico válido");
      return;
    }
    if (spinning) return;

    setSpinning(true);
    trackEvent("wheel_spin", { email_domain: clean.split("@")[1] ?? "" });
    const stopSound = playSpinSound(muted);

    const { data, error } = await supabase.functions.invoke<SpinResult>("spin-wheel", {
      body: { email: clean },
    });

    if (error || !data) {
      stopSound();
      setSpinning(false);
      toast.error("No se pudo girar la ruleta. Inténtalo de nuevo.");
      return;
    }

    const index = Math.max(0, SEGMENTS.findIndex((s) => s.id === data.prize_id));
    const target = 360 * 6 - (index * SEG_ANGLE + SEG_ANGLE / 2);
    setRotation((prev) => prev + (target - (prev % 360)) + 360);

    window.setTimeout(() => {
      stopSound();
      setSpinning(false);
      setResult(data);
      setShowResult(true);
      markPlayed();
      if (data.is_winner) fireConfetti();
      trackEvent("wheel_prize", {
        prize_id: data.prize_id,
        prize_label: data.prize_label,
        is_winner: data.is_winner,
      });
    }, 5200);
  };

  const handleCopy = async () => {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    toast.success("Código copiado");
    trackEvent("wheel_code_copied", { prize_id: result.prize_id, code: result.code });
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyNow = () => {
    trackEvent("wheel_purchase_intent", { prize_id: result?.prize_id, code: result?.code ?? null });
    setShowResult(false);
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  const wheel = useMemo(
    () =>
      SEGMENTS.map((seg, i) => {
        const isRed = i % 2 === 0;
        const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
        const label = polar(150, 150, 92, mid);
        const words = seg.short.split(" ");
        const multiline = words.length > 1;
        return (
          <g key={seg.id}>
            <path d={segmentPath(i)} fill={isRed ? "#E30613" : "#0d0d0d"} stroke="#ffffff" strokeWidth="1.5" />
            <text
              x={label.x}
              y={label.y}
              fill="#ffffff"
              fontSize={multiline ? 9 : 13}
              fontWeight="800"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${mid} ${label.x} ${label.y})`}
              style={{ letterSpacing: "0.5px" }}
            >
              {multiline
                ? words.map((w, wi) => (
                    <tspan key={w + wi} x={label.x} dy={wi === 0 ? -((words.length - 1) * 5) : 11}>
                      {w}
                    </tspan>
                  ))
                : seg.short}
            </text>
          </g>
        );
      }),

    [],
  );

  return (
    <section
      id="ruleta"
      ref={sectionRef}
      className="py-14 md:py-20 bg-gradient-to-b from-background via-secondary/20 to-background"
      aria-labelledby="ruleta-title"
    >
      <div className="container px-4">
        <div className="text-center mb-8">
          <span className="inline-block bg-[#E30613] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3">
            SOLO UN GIRO POR CLIENTE
          </span>
          <h2 id="ruleta-title" className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            RULETA DE LA <span className="text-[#E30613]">SUERTE</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Gira y consigue descuentos de hasta 10 € o una participación en el sorteo mensual de una camiseta premium.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          {/* Wheel */}
          <div className="relative mx-auto w-full max-w-[340px] aspect-square">
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-[#E30613] drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 rounded-full bg-[#E30613]/20 blur-2xl" aria-hidden="true" />
            <svg
              viewBox="0 0 300 300"
              className="relative w-full h-full rounded-full ring-4 ring-white/90 shadow-2xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 5s cubic-bezier(0.15, 0.9, 0.15, 1)" : "none",
              }}
              role="img"
              aria-label="Ruleta de premios Camisjose"
            >
              {wheel}
              <circle cx="150" cy="150" r="30" fill="#ffffff" stroke="#E30613" strokeWidth="4" />
              <text x="150" y="155" textAnchor="middle" fontSize="13" fontWeight="800" fill="#E30613">
                CJ
              </text>
            </svg>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
            {played && !showResult ? (
              <div className="text-center space-y-3">
                <Gift className="w-10 h-10 text-[#E30613] mx-auto" />
                <h3 className="font-heading text-2xl font-bold text-foreground">Ya has girado la ruleta</h3>
                <p className="text-muted-foreground text-sm">
                  Cada cliente dispone de un único giro. Revisa tu correo: allí tienes tu código.
                </p>
                {result?.code && (
                  <Button variant="outline" onClick={() => setShowResult(true)} className="mt-2">
                    Ver mi premio
                  </Button>
                )}
              </div>
            ) : (
              <>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Tu premio te espera</h3>
                <p className="text-muted-foreground text-sm mb-5">
                  Introduce tu correo y recibe el código al instante. Un solo giro por persona.
                </p>
                <label htmlFor="wheel-email" className="sr-only">
                  Correo electrónico
                </label>
                <Input
                  id="wheel-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={255}
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={spinning}
                  className="h-12 text-base"
                />
                <Button
                  onClick={handleSpin}
                  disabled={spinning}
                  size="lg"
                  className="w-full mt-4 h-14 text-lg font-heading tracking-widest bg-[#E30613] hover:bg-[#c00510] text-white shadow-[0_10px_30px_-10px_rgba(227,6,19,0.8)] hover:scale-[1.02] transition-transform"
                >
                  {spinning ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Gift className="w-5 h-5 mr-2" />}
                  {spinning ? "GIRANDO..." : "GIRAR AHORA"}
                </Button>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-[11px] text-muted-foreground max-w-[75%]">
                    Al participar aceptas recibir comunicaciones comerciales de Camisjose. Baja cuando quieras.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
                  >
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md text-center border-2 border-[#E30613]/40">
          <div className="pt-4 pb-2 space-y-4">
            <div className="text-5xl">{result?.is_winner ? "🎉" : "🎯"}</div>
            <DialogTitle className="font-heading text-3xl font-bold text-foreground">
              {result?.is_winner ? "¡ENHORABUENA!" : "¡CASI LO TIENES!"}
            </DialogTitle>
            <p className="text-lg text-foreground">
              {result?.is_winner ? (
                <>
                  Has ganado <span className="font-bold text-[#E30613]">{result?.prize_label}</span>
                </>
              ) : (
                result?.prize_label
              )}
            </p>

            {result?.code && (
              <>
                <div className="rounded-xl border-2 border-dashed border-[#E30613] bg-[#E30613]/5 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Tu código</p>
                  <p className="font-heading text-2xl font-bold tracking-[0.2em] text-[#E30613]">{result.code}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Te hemos enviado el código a tu correo. Válido 30 días
                  {MIN_ORDER[result.prize_id] ? ` · Pedido mínimo ${MIN_ORDER[result.prize_id]} €` : ""}.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleCopy} className="h-12">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copiado" : "Copiar código"}
                  </Button>
                  <Button onClick={handleBuyNow} className="h-12 bg-[#E30613] hover:bg-[#c00510] text-white">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Comprar ahora
                  </Button>
                </div>
              </>
            )}

            {!result?.code && (
              <Button onClick={handleBuyNow} className="w-full h-12 bg-[#E30613] hover:bg-[#c00510] text-white">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Ver catálogo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default LuckyWheel;
