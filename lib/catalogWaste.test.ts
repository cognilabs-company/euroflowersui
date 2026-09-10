import { describe, expect, it } from "vitest";
import { canWasteCatalog, validateWaste, wastePayload, WASTE_LABEL, WASTE_REASON_PLACEHOLDER } from "./catalogWaste";
import type { CatalogItem } from "./types";

const item = (over: Partial<CatalogItem> = {}): CatalogItem =>
  ({ quantity_total: 5, quantity_sold: 0, quantity_wasted: 0, quantity_reworked: 0, ...over } as CatalogItem);

describe("canWasteCatalog", () => {
  it("qoldiq bor — mumkin", () => expect(canWasteCatalog(item())).toBe(true));
  it("hammasi sotilgan — mumkin emas", () => {
    expect(canWasteCatalog(item({ quantity_sold: 5 }))).toBe(false);
  });
  it("qoldiq serverdan kelsa o'sha ustun", () => {
    expect(canWasteCatalog(item({ quantity_remaining: 0, quantity_total: 5 }))).toBe(false);
    expect(canWasteCatalog(item({ quantity_remaining: 2, quantity_sold: 99 }))).toBe(true);
  });
  it("yozuv yo'q — false", () => {
    expect(canWasteCatalog(null)).toBe(false);
    expect(canWasteCatalog(undefined)).toBe(false);
  });
});

describe("validateWaste", () => {
  it("to'g'ri son o'tadi", () => {
    expect(validateWaste({ quantity: "2" }, 5)).toEqual({ ok: true, quantity: 2, error: "" });
  });
  it("bo'sh yoki noldan kichik — xato", () => {
    expect(validateWaste({ quantity: "" }, 5).error).toContain("kamida 1");
    expect(validateWaste({ quantity: 0 }, 5).ok).toBe(false);
    expect(validateWaste({ quantity: -3 }, 5).ok).toBe(false);
    expect(validateWaste({ quantity: "abc" }, 5).ok).toBe(false);
  });
  it("⚠️ QOLDIQDAN ortiq — klientda to'siladi (server 400 bermasin)", () => {
    const v = validateWaste({ quantity: 6 }, 5);
    expect(v.ok).toBe(false);
    expect(v.error).toContain("faqat 5 dona");
  });
  it("qoldiq nol bo'lsa umuman mumkin emas", () => {
    expect(validateWaste({ quantity: 1 }, 0).error).toContain("Qoldiq yo'q");
  });
  it("kasr son pastga yaxlitlanadi", () => {
    expect(validateWaste({ quantity: 2.9 }, 5).quantity).toBe(2);
  });
});

describe("wastePayload", () => {
  it("spec namunasi", () => {
    expect(wastePayload({ quantity: 1, reason: "Gul so'lidi" })).toEqual({ quantity: 1, reason: "Gul so'lidi" });
  });
  it("sabab ixtiyoriy — bo'sh bo'lsa kalit yo'q", () => {
    expect(wastePayload({ quantity: 3, reason: "   " })).toEqual({ quantity: 3 });
    expect(wastePayload({ quantity: 3 })).toEqual({ quantity: 3 });
  });
  it("sabab atrofidagi bo'shliq kesiladi", () => {
    expect(wastePayload({ quantity: 1, reason: "  So'ldi  " }).reason).toBe("So'ldi");
  });
  it("buzuq son — kamida 1", () => {
    expect(wastePayload({ quantity: 0 }).quantity).toBe(1);
    expect(wastePayload({ quantity: "x" }).quantity).toBe(1);
  });
});

describe("matnlar", () => {
  it("tugma va placeholder", () => {
    expect(WASTE_LABEL).toBe("Chiqit qilish");
    expect(WASTE_REASON_PLACEHOLDER).toContain("so'lidi");
  });
});
