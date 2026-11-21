import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpToLine, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearMissionClicks,
  groupMissionClicks,
  loadMissionData,
  paginateNickGroups,
  parseMissionUrl,
  saveMissionUrl,
  type MissionClick,
} from "@/lib/mission-admin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MISSÃO ROBUX" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [clicks, setClicks] = useState<MissionClick[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    try {
      const data = loadMissionData();
      setSavedUrl(data.url);
      setUrl(data.url);
      setClicks(data.clicks);
      setPage(1);
      setError("");
      setLoaded(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível carregar os dados locais.",
      );
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "mission-admin-data-v1") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const groups = useMemo(() => groupMissionClicks(clicks), [clicks]);
  const pagination = paginateNickGroups(groups, page);
  const previewUrl = parseMissionUrl(url);

  const saveLink = () => {
    try {
      const normalizedUrl = saveMissionUrl(url);
      setSavedUrl(normalizedUrl);
      setUrl(normalizedUrl);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o link.");
    }
  };

  const deleteClicks = () => {
    if (!window.confirm("Deseja excluir todos os cliques registrados neste navegador?")) return;
    try {
      clearMissionClicks();
      setClicks([]);
      setPage(1);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir os cliques.");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8">
        <p className="text-xs tracking-widest text-muted-foreground">PAINEL ADMINISTRATIVO</p>
        <h1 className="mt-2 font-display text-3xl text-primary sm:text-4xl">MISSÃO ROBUX</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
        <section className="h-fit rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg">Link da missão</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Atualize o destino do botão da missão.
          </p>

          <label htmlFor="mission-url" className="mb-2 block text-sm font-semibold">
            Link do TikTok
          </label>
          <input
            id="mission-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {savedUrl ? "Link atual carregado" : "Nenhum link salvo"}
          </p>

          <div className="mt-4 flex min-h-64 justify-center overflow-hidden rounded-xl border bg-background p-3">
            {previewUrl ? (
              <iframe
                key={previewUrl}
                src={previewUrl}
                title="Prévia do destino da missão"
                sandbox="allow-scripts allow-forms"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="aspect-[9/16] w-full max-w-[240px] rounded-lg border bg-card"
              />
            ) : (
              <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
                Digite um link HTTP ou HTTPS válido para visualizar o destino.
              </p>
            )}
          </div>
          {previewUrl && (
            <div className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
              <span>Se o site bloquear a prévia,</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline"
              >
                abra o destino <ExternalLink aria-hidden="true" size={12} />
              </a>
            </div>
          )}
          <Button onClick={saveLink} className="mt-5 h-auto w-full rounded-xl py-3 font-display">
            Atualizar link
          </Button>
        </section>

        <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg">Cliques registrados</h2>
              <p className="text-sm text-muted-foreground">
                Nicks e horários em que a missão foi iniciada.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refresh} className="rounded-xl">
                <RefreshCw aria-hidden="true" /> Atualizar
              </Button>
              <Button
                variant="outline"
                onClick={deleteClicks}
                className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 aria-hidden="true" /> Excluir tudo
              </Button>
            </div>
          </div>

          <p className="my-4 text-sm font-semibold text-primary">
            {pagination.items.length} nick(s) único(s) nesta página
          </p>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nick
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Data/hora mais recente
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((nick) => (
                  <tr key={nick.username.toLowerCase()} className="border-t">
                    <td className="px-4 py-3 font-semibold">
                      {nick.username}
                      {nick.count > 1 && <span className="ml-2 text-primary">{nick.count}x</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(nick.latestAt))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Registrado</td>
                  </tr>
                ))}
                {pagination.items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      {loaded ? "Nenhum pedido encontrado." : "Carregando registros..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              Página {pagination.currentPage}/{pagination.totalPages}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(1)}
                disabled={pagination.currentPage === 1}
                className="rounded-xl"
              >
                <ArrowUpToLine aria-hidden="true" /> Voltar ao início
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.currentPage === 1}
                className="rounded-xl"
              >
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="rounded-xl"
              >
                Próxima
              </Button>
            </div>
          </div>
        </section>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Neste projeto, os dados ficam salvos somente no navegador e não são sincronizados entre
        visitantes ou dispositivos.
      </p>
    </main>
  );
}
