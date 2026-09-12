import { describe, it, expect } from "vitest";
import { catalogFlowRules, normalizeComposition, catalogRateMissing, catalogSalaryPayload, rateSalaryForCatalog, buildVolumeRatesPayload, ARRANGEMENTS, ARRANGEMENT_UZ, VOLUMES } from "./inventory";
import type { FloristVolumeRate } from "./types";

// euroflowers_frontend_update.md §8 (custom inventory oqimi) va §9 (standard inventory oqimi).
// ⚠️ ASOSIY QOIDA: custom katalog gulni TO'G'RIDAN-TO'G'RI stock_batch qoldig'idan yechadi —
//    florist tanlangan bo'lsa HAM florist balansiga tegilmaydi.

describe("CF1 — §8 custom: florist tanlansa ham florist-balans oqimi ISHLAMAYDI", () => {
  it("custom + florist → floristIssueMode false (gul skladdan, soni bilan)", () => {
    const r = catalogFlowRules("custom", 5, 0);
    expect(r.floristIssueMode).toBe(false);
    expect(r.stemsRequired).toBe(true);
  });

  it("custom, florist yo'q → baribir soni majburiy", () => {
    expect(catalogFlowRules("custom", 0, 0).stemsRequired).toBe(true);
  });

  it("custom + florist → hajm so'raladi (oylik hajm tarifidan olinishi mumkin)", () => {
    expect(catalogFlowRules("custom", 5, 0).volumeRequired).toBe(true);
  });

  it("custom, floristsiz → hajm majburiy emas", () => {
    expect(catalogFlowRules("custom", 0, 0).volumeRequired).toBe(false);
  });
});

describe("CF2 — §9 standard: florist balansi oqimi SAQLANADI", () => {
  it("standard + florist → floristIssueMode true, soni yozilmaydi", () => {
    const r = catalogFlowRules("standard", 5, 0);
    expect(r.floristIssueMode).toBe(true);
    expect(r.stemsRequired).toBe(false);
  });

  it("standard: hajm HAR DOIM majburiy (florist bo'lmasa ham)", () => {
    expect(catalogFlowRules("standard", 0, 0).volumeRequired).toBe(true);
    expect(catalogFlowRules("standard", 5, 0).volumeRequired).toBe(true);
  });

  it("standardda oylik QO'LDA kiritilmaydi (hajm tarifidan), custom'da kiritiladi", () => {
    expect(catalogFlowRules("standard", 5, 0).salaryEditable).toBe(false);
    expect(catalogFlowRules("custom", 5, 0).salaryEditable).toBe(true);
  });
});

describe("CF3 — filial katalogi §8 dan keyin ham o'zgarmaydi", () => {
  it("filial (branch>0) → soni majburiy, florist oqimi yo'q", () => {
    const r = catalogFlowRules("standard", 0, 3);
    expect(r.stemsRequired).toBe(true);
    expect(r.floristIssueMode).toBe(false);
  });
});

describe("CF4 — §8: bir xil stock_batch bitta rowga jamlanadi", () => {
  it("ikki marta tanlangan partiya → bitta qator, sonlar qo'shiladi", () => {
    expect(
      normalizeComposition([
        { stock_batch: 18, quantity_stems: 10 },
        { stock_batch: 22, quantity_stems: 15 },
        { stock_batch: 18, quantity_stems: 5 },
      ]),
    ).toEqual([
      { stock_batch: 18, quantity_stems: 15 },
      { stock_batch: 22, quantity_stems: 15 },
    ]);
  });
});

describe("CF5 — §8: florist_salary_amount qo'lda berilsa AYNAN ketadi, bo'sh bo'lsa kalit tushadi", () => {
  it("qo'lda 70000 → payloadda aynan shu", () => {
    expect(catalogSalaryPayload("70000")).toEqual({ florist_salary_amount: "70000" });
  });

  it("bo'sh → kalit YO'Q (backend hajm tarifidan oladi)", () => {
    expect(catalogSalaryPayload("")).toEqual({});
  });

  it("custom'da tarif yo'qligi saqlashni BLOKLAMAYDI (haq qo'lda beriladi)", () => {
    expect(catalogRateMissing("custom", 5, "large", "bouquet", [])).toBe(false);
    expect(catalogRateMissing("standard", 5, "large", "bouquet", [])).toBe(true);
  });
});

// euroflowers_box_catalog_auto_distribution_frontend.md (12.09.2026) — ODDIY KATALOGDA QUTI
// BUKET/SAVAT KABI. 10.09.2026 dagi alohida quti oqimi (hajmsiz, haq qo'lda, gul soni majburiy,
// isBoxCatalog/floristBoxMode) backend tomonidan BEKOR QILINDI: hajm majburiy, haq va gul soni
// floristning QUTI hajm tarifidan, chiqim yopilganda avtomatik taqsimot.
const boxRate = (o: Partial<FloristVolumeRate> = {}): FloristVolumeRate => ({
  id: 1, florist: 12, arrangement_type: "box", volume: "medium", default_stems: 15, florist_fee: "50000", is_active: true, ...o,
});

describe("CF6 — quti (box): oddiy katalogda buket/savat bilan BIR XIL (12.09.2026)", () => {
  it("qoidalar turga bog'liq emas — standart + florist: soni yo'q oqimi, hajm majburiy, haq tarifdan", () => {
    const r = catalogFlowRules("standard", 12, 0);
    expect(r.floristIssueMode).toBe(true);
    expect(r.volumeRequired).toBe(true);
    expect(r.stemsRequired).toBe(false);
    expect(r.salaryEditable).toBe(false);
  });

  it("standart, floristsiz → hajm majburiy, soni majburiy emas (warehouse rejimi)", () => {
    const r = catalogFlowRules("standard", 0, 0);
    expect(r.floristIssueMode).toBe(false);
    expect(r.volumeRequired).toBe(true);
    expect(r.stemsRequired).toBe(false);
  });

  it("standart quti + florist + hajm, QUTI tarifi YO'Q → saqlash bloklanadi (backend volume 400)", () => {
    expect(catalogRateMissing("standard", 12, "medium", "box", [])).toBe(true);
    // buket tarifi bor, lekin quti tarifi yo'q — baribir bloklanadi (tarif kaliti = turi + hajm)
    expect(catalogRateMissing("standard", 12, "medium", "box", [boxRate({ arrangement_type: "bouquet" })])).toBe(true);
    // boshqa hajmdagi quti tarifi ham yetmaydi
    expect(catalogRateMissing("standard", 12, "medium", "box", [boxRate({ volume: "large" })])).toBe(true);
  });

  it("standart quti + florist + hajm, QUTI tarifi BOR → bloklanmaydi, haq shu tarifdan", () => {
    const rates = [boxRate()];
    expect(catalogRateMissing("standard", 12, "medium", "box", rates)).toBe(false);
    expect(rateSalaryForCatalog(rates, 12, "medium", "box")?.florist_fee).toBe("50000");
  });

  it("quti tarifi boshqa floristniki bo'lsa — topilmaydi (per-florist)", () => {
    expect(rateSalaryForCatalog([boxRate({ florist: 7 })], 12, "medium", "box")).toBeUndefined();
  });

  it("nofaol quti tarifi hisobga olinmaydi", () => {
    expect(catalogRateMissing("standard", 12, "medium", "box", [boxRate({ is_active: false })])).toBe(true);
  });

  it("maxsus (custom) katalogda quti tarifi shart emas — haq qo'lda", () => {
    expect(catalogRateMissing("custom", 12, "medium", "box", [])).toBe(false);
  });

  it("tarif matritsasi: buket, savat VA quti qatorlari — 3×3 = 9 katak", () => {
    expect([...ARRANGEMENTS]).toEqual(["bouquet", "basket", "box"]);
    expect(ARRANGEMENT_UZ.box).toBe("Quti");
    expect(ARRANGEMENTS.length * VOLUMES.length).toBe(9);
  });

  it("buildVolumeRatesPayload quti katagini `arrangement_type: box` bilan yuboradi", () => {
    const out = buildVolumeRatesPayload([
      { arrangement_type: "box", volume: "small", fee: "40000", stems: "10" },
      { arrangement_type: "box", volume: "medium", fee: "", stems: "" },
      { arrangement_type: "bouquet", volume: "small", fee: "30000", stems: "" },
    ]);
    expect(out).toEqual([
      { arrangement_type: "box", volume: "small", florist_fee: "40000", default_stems: 10 },
      { arrangement_type: "bouquet", volume: "small", florist_fee: "30000" },
    ]);
  });
});
