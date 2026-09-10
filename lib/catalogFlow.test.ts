import { describe, it, expect } from "vitest";
import { catalogFlowRules, normalizeComposition, catalogRateMissing, catalogSalaryPayload, isBoxCatalog } from "./inventory";

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

// euroflowers_box_catalog_frontend.md (10.09.2026) — ODDIY KATALOGDA QUTI.
// Jonli kontrakt (OpenAPI 10.09.2026): ArrangementType enum = ["bouquet","basket","box"],
// `florist_salary_amount` yoziladi, `composition[].quantity_stems` integer.
describe("CF6 — quti (box): hajm majburiy emas, haq qo'lda, gul soni majburiy", () => {
  it("standart + quti → hajm MAJBURIY EMAS (buket/savatda majburiy)", () => {
    expect(catalogFlowRules("standard", 0, 0, "box").volumeRequired).toBe(false);
    expect(catalogFlowRules("standard", 12, 0, "box").volumeRequired).toBe(false);
    expect(catalogFlowRules("standard", 12, 0, "bouquet").volumeRequired).toBe(true);
    expect(catalogFlowRules("standard", 12, 0, "basket").volumeRequired).toBe(true);
  });

  it("standart + quti + florist → florist-balans oqimi YO'Q (gul skladdan, soni bilan)", () => {
    const r = catalogFlowRules("standard", 12, 0, "box");
    expect(r.floristIssueMode).toBe(false);
    expect(r.stemsRequired).toBe(true);
  });

  it("floristsiz qutida ham har bir gul soni majburiy", () => {
    expect(catalogFlowRules("standard", 0, 0, "box").stemsRequired).toBe(true);
  });

  it("quti: florist tanlansa haq QO'LDA va MAJBURIY", () => {
    const r = catalogFlowRules("standard", 12, 0, "box");
    expect(r.salaryEditable).toBe(true);
    expect(r.salaryRequired).toBe(true);
  });

  it("quti, florist tanlanmagan → haq majburiy emas (oylik yozilmaydi)", () => {
    expect(catalogFlowRules("standard", 0, 0, "box").salaryRequired).toBe(false);
  });

  it("buket/savat: haq hech qachon majburiy emas (tarifdan olinadi)", () => {
    expect(catalogFlowRules("standard", 12, 0, "bouquet").salaryRequired).toBe(false);
    expect(catalogFlowRules("custom", 12, 0, "basket").salaryRequired).toBe(false);
  });

  it("qutida hajm tarifi YO'Qligi saqlashni bloklamaydi", () => {
    expect(catalogRateMissing("standard", 12, "large", "box", [])).toBe(false);
    expect(catalogRateMissing("standard", 12, "large", "bouquet", [])).toBe(true);
  });

  it("isBoxCatalog — faqat 'box'", () => {
    expect(isBoxCatalog("box")).toBe(true);
    expect(isBoxCatalog("bouquet")).toBe(false);
    expect(isBoxCatalog("")).toBe(false);
    expect(isBoxCatalog(null)).toBe(false);
    expect(isBoxCatalog(undefined)).toBe(false);
  });

  it("turi berilmasa (eski chaqiruv) — avvalgi qoidalar saqlanadi", () => {
    expect(catalogFlowRules("standard", 12, 0).floristIssueMode).toBe(true);
    expect(catalogFlowRules("standard", 12, 0).volumeRequired).toBe(true);
    expect(catalogFlowRules("standard", 12, 0).salaryRequired).toBe(false);
  });

  it("maxsus (custom) + quti → hajm so'ralmaydi, qolgani custom kabi", () => {
    const r = catalogFlowRules("custom", 12, 0, "box");
    expect(r.volumeRequired).toBe(false);
    expect(r.stemsRequired).toBe(true);
    expect(r.salaryEditable).toBe(true);
  });
});
