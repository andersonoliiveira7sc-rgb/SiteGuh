import { useState } from "react";
import { ChevronRight, Download, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadMissionData, recordMissionClick } from "@/lib/mission-admin";

export function TikTokStudyStep({
  onBack,
  primaryButtonClass,
  username,
}: {
  onBack: () => void;
  primaryButtonClass: string;
  username: string;
}) {
  const [message, setMessage] = useState("");

  const openLink = () => {
    setMessage("");
    let url = "";
    try {
      url = loadMissionData().url;
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Não foi possível carregar o link da missão.",
      );
      return;
    }

    if (!url) {
      setMessage("O link da missão ainda não foi adicionado.");
      return;
    }

    try {
      recordMissionClick(username);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível registrar o clique.");
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <h2 className="font-display text-lg">TIKTOK LITE</h2>
      <p className="mb-4 text-xs text-muted-foreground">ETAPA 2 DE 2</p>
      <ol className="mb-4 space-y-3">
        <li className="flex min-h-20 items-center gap-3 rounded-xl border-2 border-primary p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <Download aria-hidden="true" size={23} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm">PASSO 1</p>
            <p className="text-xs text-muted-foreground">Baixe o TikTok lite (Se não tiver)</p>
          </div>
        </li>
        <li className="flex min-h-20 items-center gap-3 rounded-xl border-2 border-primary p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <UserPlus aria-hidden="true" size={23} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm">PASSO 2</p>
            <p className="text-xs text-muted-foreground">
              Clique no botão abaixo e aperte em entrar
            </p>
          </div>
        </li>
      </ol>
      <Button
        onClick={openLink}
        className={`${primaryButtonClass} h-auto whitespace-normal px-4 text-center`}
      >
        <span>IR PARA O TIKTOK LITE</span>
        <ChevronRight aria-hidden="true" />
      </Button>
      {message && (
        <p role="status" className="mt-3 text-sm text-accent">
          {message}
        </p>
      )}
      <Button
        onClick={onBack}
        variant="outline"
        className="mt-3 h-auto rounded-xl border-2 border-primary bg-transparent px-4 py-3 font-display text-primary hover:bg-primary hover:text-primary-foreground"
      >
        VOLTAR
      </Button>
    </div>
  );
}
