import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { findRobloxUser, type RobloxProfile } from "@/lib/roblox.functions";
import { TikTokStudyStep } from "@/components/tiktok-study-step";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MISSÃO ROBUX" },
      { name: "description", content: "Recompensa independente com entrega manual após conferência da prova. Não afiliada ao TikTok, TikTok Lite ou Roblox." },
      { property: "og:title", content: "Missão Robux — Recompensa Independente" },
      { property: "og:description", content: "Recompensa independente com entrega manual após conferência da prova. Não afiliada ao TikTok, TikTok Lite ou Roblox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [step, setStep] = useState(1);
  const [nick, setNick] = useState("");
  const [profile, setProfile] = useState<RobloxProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const find = useServerFn(findRobloxUser);

  const search = async () => {
    if (loading) return;
    if (!/^[A-Za-z0-9_]{3,20}$/.test(nick.trim())) {
      setMsg("Nick inválido (3–20 letras, números ou _).");
      return;
    }
    setLoading(true); setMsg(""); setProfile(null);
    try {
      const r = await find({ data: { username: nick } });
      if (r.profile) setProfile(r.profile);
      else setMsg(r.error ?? "Nenhum perfil encontrado com esse nick.");
    } catch { setMsg("Não foi possível consultar o Roblox. Tente novamente em instantes."); }
    finally { setLoading(false); }
  };

  const btn = "w-full rounded-xl bg-primary py-4 font-display text-lg text-primary-foreground glow transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-5 py-10">
      <p className="rounded-full border px-3 py-1 text-xs tracking-widest text-muted-foreground">RESGATE SUA RECOMPENSA</p>
      <h1 className="mt-4 text-center font-display text-5xl text-primary drop-shadow-[0_0_20px_currentColor]">GANHE ROBUX</h1>

      <div className="mt-8 flex items-center gap-3">
        {[1, 2].map((n) => (
          <div key={n} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-display ${step >= n ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{n}</div>
        ))}
      </div>
      <p className="mt-2 text-xs tracking-widest text-muted-foreground">NICK · TIKTOK LITE</p>

      <section className="mt-8 w-full rounded-2xl border bg-card p-6">
        {step === 1 && (
          <>
            <h2 className="mb-4 font-display text-lg">SEU NICK DO ROBLOX</h2>
            <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
              <input value={nick} onChange={(e) => { setNick(e.target.value); setProfile(null); setMsg(""); }} placeholder="Digite seu nick" className="w-full rounded-xl border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
              <Button type="submit" variant="outline" disabled={loading || nick.trim().length < 3} className="h-auto rounded-xl border-2 border-primary px-4 font-display text-primary disabled:opacity-40">{loading ? "..." : "BUSCAR"}</Button>
            </form>
            {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}
            {profile && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-primary p-3">
                {profile.avatar && <img src={profile.avatar} alt={profile.name} className="h-14 w-14 rounded-lg bg-muted" />}
                <div>
                  <p className="font-display">{profile.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{profile.name} · ID {profile.id}</p>
                </div>
              </div>
            )}
            <Button className={`${btn} h-auto`} disabled={!profile} onClick={() => { if (!profile) return; setNick(profile.name); setStep(2); }}>CONTINUAR</Button>
          </>
        )}
        {step === 2 && (
          <TikTokStudyStep onBack={() => setStep(1)} primaryButtonClass={btn} />
        )}
      </section>

      <footer className="mt-8 w-full border-t pt-5 text-center text-xs leading-relaxed text-muted-foreground">
        <h2 className="mb-3 font-display text-sm text-foreground">Aviso</h2>
        <p>Esta recompensa é independente e não é patrocinada pelo TikTok, TikTok Lite ou Roblox. A entrega depende da conferência da prova e é feita manualmente por nossa equipe.</p>
        <p className="mt-4">© 2026 Missão Robux. Não afiliado ao TikTok nem à Roblox.</p>
        <p className="mt-4">TikTok, TikTok Lite e Roblox são marcas de seus respectivos titulares.</p>
      </footer>
    </main>
  );
}
