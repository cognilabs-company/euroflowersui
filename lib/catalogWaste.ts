import { catalogRemaining } from "./rework";
import type { CatalogItem } from "./types";

/**
 * KATALOGNI CHIQITGA CHIQARISH — sof mantiq
 * (euro_catalog_waste_frontend.md).
 *
 * ⚠️ Bu SOTUV ham, QAYTARISH ham EMAS: chiqit qilingan gul/material
 * skladga QAYTMAYDI, katalog yozuvi esa o'chmaydi — faqat
 * `quantity_wasted` oshadi va `quantity_remaining` kamayadi.
 * Hisob-kitobda chiqit tannarx bo'yicha alohida hisoblanadi.
 */

/** Chiqit qilish mumkinmi — qoldiq bo'lishi shart (server ortiqcha songa 400 beradi). */
export const canWasteCatalog = (item: CatalogItem | null | undefined): boolean =>
  catalogRemaining(item) > 0;

export type WasteForm = { quantity: string | number; reason?: string };

export type WasteValidation = { ok: boolean; quantity: number; error: string };

/**
 * Tekshiruv: son butun, 1 dan kichik emas va QOLDIQDAN oshmaydi.
 * ⚠️ Chegara klientda ham ushlanadi — operator 400 ni ko'rmasin.
 */
export function validateWaste(form: WasteForm, remaining: number): WasteValidation {
  const n = Math.floor(Number(form.quantity));
  if (!Number.isFinite(n) || n < 1) return { ok: false, quantity: 0, error: "Sonni kiriting (kamida 1)." };
  if (remaining <= 0) return { ok: false, quantity: 0, error: "Qoldiq yo'q — chiqitga chiqarib bo'lmaydi." };
  if (n > remaining) return { ok: false, quantity: n, error: `Qoldiq faqat ${remaining} dona — ko'proq chiqitga chiqarib bo'lmaydi.` };
  return { ok: true, quantity: n, error: "" };
}

/** Tana — `reason` ixtiyoriy: bo'sh bo'lsa kalit umuman yuborilmaydi. */
export function wastePayload(form: WasteForm): { quantity: number; reason?: string } {
  const n = Math.max(1, Math.floor(Number(form.quantity) || 1));
  const r = (form.reason ?? "").trim();
  return r ? { quantity: n, reason: r } : { quantity: n };
}

/* ── ekran matnlari bir joyda ── */
export const WASTE_LABEL = "Chiqit qilish";
export const WASTE_NOTE =
  "Chiqitga chiqarilgan gul va material skladga QAYTMAYDI. Katalog yozuvi o'chmaydi — faqat qoldiq kamayadi.";
export const WASTE_REASON_PLACEHOLDER = "Masalan: Gul so'lidi";
