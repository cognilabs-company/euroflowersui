# EuroFlowers Frontend Update — Florist Chiqimlarini Bitta Bosishda Yopish

## Yangi endpoint

`POST /api/florist-stock-balances/close-all-issues/`

Bu endpoint bitta floristga chiqarilgan barcha gul qoldiqlarini bir requestda yopadi.

## Request

```json
{
  "florist": 4,
  "absorb_remainder": true
}
```

`florist` — majburiy, florist id.

`absorb_remainder` — optional, default `true`. Qoldiq sonlar teng bo‘linmasa, backend qoldiqni mos kataloglardan biriga avtomatik qo‘shib yuboradi.

## Response

```json
{
  "florist": "Abror",
  "closed_batches": 9,
  "shared_stems": 1751,
  "absorbed_remainder": 0,
  "rounded_extra_stems": 0,
  "unplaced_stems": 0,
  "batches": [
    {
      "florist": "Abror",
      "batch_number": "doron 07.09",
      "weight_source": "florist_fee",
      "distribution_mode": "append_to_catalog",
      "shared_stems": 965,
      "unplaced_stems": 0,
      "items": []
    }
  ]
}
```

## Muhim frontend logika

- Florist detail yoki florist stock balance sahifasiga `Hamma chiqarilgan gullarni yopish` tugmasi qo‘shiladi.
- Tugma bosilganda confirmation modal chiqsin.
- Tasdiqlansa endpointga `florist` id yuboriladi.
- Successdan keyin florist balance, issue history va catalog list refetch qilinsin.
- Error bo‘lsa `detail` matni ko‘rsatilsin.

## Eski endpoint ham ishlaydi

`POST /api/florist-stock-balances/close-issue/`

```json
{
  "florist": 4,
  "close_all": true,
  "absorb_remainder": true
}
```

Lekin frontend uchun yangi endpoint ishlatish tavsiya qilinadi.

## Backenddagi yangi xulq

Agar chiqarilgan batch aynan katalogga ulanmagan bo‘lsa ham yopish bloklanmaydi. Backend shu floristning mavjud kataloglariga avtomatik composition qo‘shib, qoldiqni yopadi.

## Backend javoblari (2026-09-22)

- `batches[].items` — close-issue items bilan bir xil + `added_per_item` (shu yopishda har donaga qo'shilgan gul).
- `weight_source`: `default_stems`, `partial_default_stems`, `florist_fee`, `equal`, `apprentice_equal`.
- `distribution_mode`: `open_rows` yoki `append_to_catalog`. `append_to_catalog` — partiya oldin katalogga ulanmagan, backend mavjud kataloglarga composition qo'shdi.
- `absorbed_remainder` — bo'linmay qolgan real qoldiq. `rounded_extra_stems` — katalog dona soniga moslash uchun ortiqcha yozilgan texnik farq. `shared_stems` — real yopilgan gul soni.
- `unplaced_stems > 0` bo'lsa, u florist balansida qoladi. `absorb_remainder=true` (default) bo'lsa odatda 0.
- Floristda umuman katalog bo'lmasa — 400.
- Mavjud kataloglar: `available`, `reserved`, `sold`; `quantity_total > 0`; shu floristniki. `custom` va `box` ham kiradi.
- Hajm tarifi yo'q bo'lsa endi bloklamaydi: avval `florist_fee`, bo'lmasa teng taqsimlaydi.
- Shogird uchun ishlaydi — `apprentice_equal`.
- Atomar: bitta partiyada xato bo'lsa hammasi rollback bo'ladi.
- Xatolar: serializer xatolari field formatda, service xatolari `{"detail": "..."}` string.
- Takror yuborilsa va yopiladigan qoldiq qolmagan bo'lsa — 400. 9 ta partiya odatda bir necha soniyada yopiladi.
- Ruxsat close-issue bilan bir xil: inventory boshqarish huquqi.
- florist-stock-issues tarixiga yangi kind yozilmaydi. AuditLog yoziladi; composition va balans o'zgaradi.
- `close-all-issues-preview` hozir yo'q — kerak bo'lsa backend qo'shib beradi.
