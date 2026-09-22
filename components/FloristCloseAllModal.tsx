"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, Info, PackageCheck, TriangleAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import Modal, { ModalFooter, ModalHeader } from "./Modal";
import StockLine, { lineFromBatchDetail } from "./StockLine";
import { formatStemsAndBunches, stems as stemsFmt } from "@/lib/inventory";
import type { CloseAllIssuesResult, FloristStockBalance } from "@/lib/types";

/** taqsimot og'irligi — hajm tarifi yo'q bo'lsa backend BLOKLAMAYDI, florist haqi yoki teng bo'lib ketadi */
const WEIGHT_LABEL: Record<string, string> = {
  default_stems: "Hajm standarti bo'yicha",
  partial_default_stems: "Hajm standarti (qisman)",
  florist_fee: "Florist haqi bo'yicha",
  equal: "Teng taqsimlandi",
  apprentice_equal: "Shogird — teng",
};

/**
 * HAMMA CHIQARILGAN GULLARNI YOPISH — bitta floristning BARCHA partiyalari bitta POST'da
 * (close-all-issues). FloristCloseIssueModal'dan farqi: preview YO'Q va skladga qaytarish YO'Q —
 * butun qoldiq kataloglarga bo'linadi. Katalogga ulanmagan partiya ham bloklanmaydi (backend
 * floristning mavjud kataloglariga o'zi qo'shadi). Shuning uchun: tasdiq → POST → natija.
 * Backend ATOMAR: xato bo'lsa hech narsa o'zgarmaydi.
 */
export default function FloristCloseAllModal({ florist, floristName, balances, onClose, onDone }: {
  florist: number;
  floristName: string;
  /** shu floristning balanslari — tasdiqda nima yopilishini ko'rsatish uchun (0 qoldiqlar tashlanadi) */
  balances: FloristStockBalance[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { showToast } = useStore();
  const held = useMemo(() => balances.filter((b) => b.remaining_stems > 0), [balances]);
  const total = held.reduce((s, b) => s + b.remaining_stems, 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<CloseAllIssuesResult | null>(null);

  const doClose = async () => {
    if (busy || result) return;
    setBusy(true); setErr(null);
    try {
      const res = await api.closeAllIssues({ florist, absorb_remainder: true }); // ⚠️ POST — tasdiqdan keyin
      setResult(res);
      showToast(`✓ ${res.closed_batches} ta partiya yopildi — ${stemsFmt(res.shared_stems)} taqsimlandi`);
      onDone(); // balanslar + tarix + katalog + hisobot keshi
    } catch (e) {
      // ApiError.message — server `detail` matni (massiv bo'lsa qatorma-qator)
      setErr(e instanceof ApiError ? e.message : "Yopib bo'lmadi");
      // vaqt tugasa/aloqa uzilsa server baribir yopgan bo'lishi mumkin — ro'yxat haqiqatni ko'rsatsin
      if (e instanceof ApiError && e.status === 0) onDone();
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} width={520}>
      <ModalHeader icon={<PackageCheck size={19} strokeWidth={1.8} />} title="Hamma chiqarilgan gullarni yopish" sub={floristName} onClose={onClose} />

      {result ? (
        <ResultView result={result} onClose={onClose} />
      ) : (
        <>
          {/* NIMA YOPILADI — floristdagi hamma partiya */}
          <div className="mt-1 flex items-center justify-between rounded-[12px] px-3 py-2 text-[12.5px] font-bold" style={{ background: "var(--surface-2)" }}>
            <span style={{ color: "var(--text-2)" }}>{held.length} ta partiya</span>
            <span className="tabular-nums" style={{ color: "var(--primary)" }}>{stemsFmt(total)}</span>
          </div>
          <div className="thin-scroll mt-2 flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
            {held.map((b) => (
              <div key={b.id} className="rounded-[11px] border px-2.5 py-2" style={{ borderColor: "var(--border)" }}>
                <StockLine size="sm" data={lineFromBatchDetail(b.batch_detail)} right={<span className="text-[12px] font-bold tabular-nums" style={{ color: "var(--text-2)" }}>{formatStemsAndBunches(b.remaining_stems, b.batch_detail?.stems_per_bunch)}</span>} />
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-[12px] px-3 py-2.5 text-[12.5px] font-semibold leading-snug" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
            Hammasi shu floristning <b>kataloglariga bo&apos;linadi</b> — sotuvdagi, bron qilingan va sotilgan (maxsus va quti ham). Katalogga ulanmagan partiya ham yopiladi — mavjud kataloglarga avtomatik qo&apos;shiladi. Teng bo&apos;linmagan qoldiq kataloglardan biriga qo&apos;shiladi.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px] font-semibold" style={{ color: "var(--warning-ink, #8a6d1f)" }}>
            <TriangleAlert size={12} strokeWidth={2.2} className="mt-px shrink-0" />
            <span>Sotilgan kataloglarning tannarxi ham o&apos;zgaradi — hisob-kitobdagi foyda siljiydi.</span>
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
            <Info size={12} strokeWidth={2.2} className="mt-px shrink-0" style={{ color: "var(--primary)" }} />
            <span>Bu amal skladga hech narsa qaytarmaydi — ortgan gul bo&apos;lsa, avval «Qaytarish» qiling.</span>
          </p>

          {err && <p className="mt-3 whitespace-pre-line rounded-[11px] px-3 py-2 text-[12.5px] font-semibold" style={{ background: "var(--danger-soft, rgba(160,74,74,.12))", color: "var(--danger-ink)" }}>{err}</p>}

          <ModalFooter>
            <button onClick={onClose} className="btn-ghost">Bekor</button>
            <button onClick={doClose} disabled={busy || held.length === 0} className="btn-primary disabled:opacity-60">{busy ? "Yopilmoqda…" : "Hammasini yopish"}</button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}

function ResultView({ result, onClose }: { result: CloseAllIssuesResult; onClose: () => void }) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 rounded-[12px] px-3 py-2.5 text-[13px] font-bold text-mintink" style={{ background: "var(--mint, rgba(61,138,95,.12))" }}>
        <CheckCircle2 size={16} strokeWidth={2.2} className="shrink-0" /> {result.closed_batches} ta partiya yopildi — {stemsFmt(result.shared_stems)} taqsimlandi
      </div>
      {(result.absorbed_remainder > 0 || result.rounded_extra_stems > 0) && (
        <p className="mb-2 text-[11.5px] font-semibold" style={{ color: "var(--muted)" }}>
          {result.absorbed_remainder > 0 && <>Qoldiq katalogga qo&apos;shildi: {stemsFmt(result.absorbed_remainder)}. </>}
          {result.rounded_extra_stems > 0 && <>Katalog dona soniga moslash uchun +{stemsFmt(result.rounded_extra_stems)} yozildi (texnik farq, real gul emas).</>}
        </p>
      )}
      {/* JOYLANMAGAN — yashirmaymiz */}
      {result.unplaced_stems > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-[11px] px-3 py-2 text-[12.5px] font-bold" style={{ background: "color-mix(in srgb, #b3873a 16%, transparent)", color: "var(--warning-ink, #8a6d1f)" }}>
          <TriangleAlert size={15} strokeWidth={2.2} className="shrink-0" /> {stemsFmt(result.unplaced_stems)} joylanmadi — floristning balansida qoldi.
        </div>
      )}
      {result.batches.length > 0 && (
        <div className="thin-scroll flex max-h-[300px] flex-col gap-1.5 overflow-y-auto">
          {result.batches.map((b, i) => (
            <div key={`${b.batch_number}-${i}`} className="rounded-[11px] border px-2.5 py-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="truncate font-bold">{b.batch_number}</span>
                <span className="shrink-0 font-bold tabular-nums" style={{ color: "var(--primary)" }}>{stemsFmt(b.shared_stems)}</span>
              </div>
              {(b.weight_source || b.distribution_mode === "append_to_catalog") && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {b.weight_source && <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>{WEIGHT_LABEL[b.weight_source] ?? b.weight_source}</span>}
                  {/* partiya katalogga ulanmagan edi — backend mavjud kataloglarga composition qo'shdi */}
                  {b.distribution_mode === "append_to_catalog" && <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Katalogga avtomatik qo&apos;shildi</span>}
                </div>
              )}
              {b.unplaced_stems > 0 && <div className="mt-1 text-[11.5px] font-semibold" style={{ color: "var(--warning-ink, #8a6d1f)" }}>{stemsFmt(b.unplaced_stems)} floristda qoldi</div>}
              {(b.items ?? []).map((it) => (
                <div key={it.catalog_item} className="mt-0.5 flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="truncate" style={{ color: "var(--text-2)" }}>{it.catalog_name}{it.quantity_total > 1 ? ` ×${it.quantity_total}` : ""}</span>
                  {/* added_per_item — SHU yopishda har donaga qo'shilgani (append'da stems_per_item eski tarkibni ham o'z ichiga oladi) */}
                  <span className="shrink-0 tabular-nums" style={{ color: "var(--muted)" }}>+{it.added_per_item ?? it.stems_per_item}/dona</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <ModalFooter>
        <button onClick={onClose} className="btn-primary">Yopish</button>
      </ModalFooter>
    </div>
  );
}
