/**
 * AI CHAT QIDIRUVI — har harfda so'rov KETMAYDI.
 *
 * ⚠️ NEGA: suhbatlar ro'yxati endpointi HAR BIR qatorga suhbatning BUTUN
 *    `messages` massivini qo'shib yuboradi (lib/chatList dagi o'lchovga qarang)
 *    va maydonni qisqartirib bo'lmaydi — jonli tekshiruv (23.09.2026):
 *    `?fields=id,status`, `?omit=messages`, `?expand=` — server HAMMASINI
 *    e'tiborsiz qoldiradi, javob bir xil (96 KB / 5 qator).
 *
 *    Shu sababli bitta qidiruv so'rovi QIMMAT (developer tokeni, page_size=30):
 *      ?search=a     → 4102 mos · 0.97 MB · 5.9 s
 *      ?search=az    → 3574 mos · 0.91 MB · 3.5 s
 *      ?search=aziza →   13 mos · 0.44 MB · 2.7 s
 *    «aziza» ni harflab yozish = 5 ta so'rov ≈ 3.6 MB va ~18 s server vaqti,
 *    ustiga eskisi kech kelib yangi natijani bosib ketardi.
 *
 * QOIDA: 700 ms jim turilgandan KEYIN, kamida 2 harfdan boshlab qidiriladi;
 *    qidiruv faol bo'lsa 30 soniyalik yangilanish TO'XTAYDI (aks holda o'sha
 *    qimmat so'rov fonda qayta-qayta ketardi).
 */

/** Yozish to'xtagach shuncha kutiladi (ilgari 350 ms edi — har harfda so'rov). */
export const CHAT_SEARCH_DEBOUNCE_MS = 700;
/** Bitta harf 4102 ta suhbatga mos keladi — foydasiz va ENG og'ir so'rov. */
export const CHAT_SEARCH_MIN_CHARS = 2;

/** Serverga YUBORILADIGAN qidiruv so'zi: bo'shliqlar kesiladi, 2 harfdan qisqasi — qidiruv emas. */
export function chatSearchTerm(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  return s.length >= CHAT_SEARCH_MIN_CHARS ? s : "";
}

/** Operator yozdi, lekin so'rov hali ketmadi (kutish yoki «kamida 2 harf»). */
export function chatSearchPending(raw: string | null | undefined, applied: string): boolean {
  return chatSearchTerm(raw) !== applied;
}

/**
 * Ro'yxatni 30 soniyada yangilash MUMKINMI.
 * ⚠️ Qidiruv faol (yoki yozilyapti) bo'lsa — YO'Q: 1 MB lik so'rov fonda
 *    takrorlanmaydi. Ochiq suhbatning o'z yangilanishi (10 s) to'xtamaydi,
 *    shuning uchun yangi xabar baribir ko'rinadi.
 */
export function shouldPollChatList(raw: string | null | undefined, applied: string): boolean {
  return chatSearchTerm(raw) === "" && applied === "";
}

/** Qidiruv maydoni ostidagi izoh (bo'sh satr — izoh kerak emas). */
export function chatSearchHint(raw: string | null | undefined, applied: string, busy: boolean): string {
  const s = (raw ?? "").trim();
  if (s.length > 0 && s.length < CHAT_SEARCH_MIN_CHARS) return `Kamida ${CHAT_SEARCH_MIN_CHARS} harf yozing`;
  if (busy && s) return "Qidirilmoqda…";
  if (chatSearchPending(raw, applied)) return "Yozib bo'lgandan so'ng qidiriladi…";
  return "";
}
