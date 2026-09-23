import { describe, it, expect } from "vitest";
import {
  CHAT_SEARCH_DEBOUNCE_MS,
  CHAT_SEARCH_MIN_CHARS,
  chatSearchHint,
  chatSearchPending,
  chatSearchTerm,
  shouldPollChatList,
} from "./chatSearch";

describe("CS1 — qidiruv so'zi", () => {
  it("bitta harf serverga YUBORILMAYDI (4102 ta mos, 1 MB javob)", () => {
    expect(chatSearchTerm("a")).toBe("");
    expect(chatSearchTerm(" a ")).toBe("");
  });

  it("2 harfdan boshlab qidiriladi", () => {
    expect(chatSearchTerm("az")).toBe("az");
    expect(chatSearchTerm("  aziza  ")).toBe("aziza");
  });

  it("bo'sh/null → qidiruv yo'q", () => {
    expect(chatSearchTerm("")).toBe("");
    expect(chatSearchTerm("   ")).toBe("");
    expect(chatSearchTerm(null)).toBe("");
    expect(chatSearchTerm(undefined)).toBe("");
  });

  it("kutish 700 ms, eng kam uzunlik 2", () => {
    expect(CHAT_SEARCH_DEBOUNCE_MS).toBe(700);
    expect(CHAT_SEARCH_MIN_CHARS).toBe(2);
  });
});

describe("CS2 — kutilayotgan holat", () => {
  it("yozildi, lekin hali qo'llanmadi → pending", () => {
    expect(chatSearchPending("aziza", "")).toBe(true);
    expect(chatSearchPending("aziza", "aziza")).toBe(false);
  });

  it("bitta harf — qo'llangan qidiruv bo'sh bo'lsa pending EMAS (so'rov ketmaydi)", () => {
    expect(chatSearchPending("a", "")).toBe(false);
  });

  it("qidiruvdan bitta harfga qaytish → ro'yxat filtrsiz holatga qaytadi", () => {
    expect(chatSearchPending("a", "aziza")).toBe(true);
    expect(chatSearchTerm("a")).toBe("");
  });
});

describe("CS3 — 30 soniyalik yangilanish", () => {
  it("qidiruvsiz — yangilanadi", () => {
    expect(shouldPollChatList("", "")).toBe(true);
    expect(shouldPollChatList("a", "")).toBe(true); // 1 harf = qidiruv emas
  });

  it("qidiruv faol yoki yozilyapti — TO'XTAYDI", () => {
    expect(shouldPollChatList("aziza", "aziza")).toBe(false);
    expect(shouldPollChatList("aziza", "")).toBe(false);
    expect(shouldPollChatList("", "aziza")).toBe(false);
  });
});

describe("CS4 — izoh satri", () => {
  it("bitta harf → kamida 2 harf", () => {
    expect(chatSearchHint("a", "", false)).toBe("Kamida 2 harf yozing");
  });

  it("so'rov ketayotganda — qidirilmoqda", () => {
    expect(chatSearchHint("aziza", "aziza", true)).toBe("Qidirilmoqda…");
  });

  it("yozilyapti, so'rov hali ketmadi", () => {
    expect(chatSearchHint("aziza", "", false)).toBe("Yozib bo'lgandan so'ng qidiriladi…");
  });

  it("tinch holat — izoh yo'q", () => {
    expect(chatSearchHint("", "", false)).toBe("");
    expect(chatSearchHint("aziza", "aziza", false)).toBe("");
  });
});
