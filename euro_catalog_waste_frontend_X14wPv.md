# EuroFlowers Frontend: Katalogni Chiqitga Chiqarish

Backendda katalog mahsulotini chiqit qilish endpointi mavjud va serverda testdan o'tdi.

## Endpoint

`POST /api/catalog/{catalog_id}/waste/`

## Body

```json
{
  "quantity": 1,
  "reason": "Gul so'lidi"
}
```

## Nima qiladi

- Tanlangan katalog mahsulotidan `quantity` dona chiqitga chiqariladi.
- Gullar yoki materiallar skladga qaytmaydi.
- Katalog o'chmaydi.
- `quantity_wasted` oshadi.
- `quantity_remaining` kamayadi.
- `history` ichida `action = wasted` yozuvi paydo bo'ladi.
- Accounting/hisob-kitobda chiqit tannarx bo'yicha alohida hisoblanadi.

## Muhim

Bu endpoint sotuv emas, qaytarish ham emas. Chiqit qilingan gul hech qayerga qaytmaydi.

Agar chiqit soni mavjud qoldiqdan ko'p yuborilsa backend `400` qaytaradi.

## Frontend UI Taklif

Katalog detail yoki list action menu ichida:

- `Chiqit qilish`
- Modal ochiladi
- Soni kiritiladi
- Sabab yoziladi
- Confirm bosilganda endpoint chaqiriladi

Success bo'lsa katalog itemni qayta fetch qilish kerak.

## Response

Backend `CatalogItem` detail qaytaradi. Frontend quyidagilarni yangilashi kerak:

- `quantity_wasted`
- `quantity_remaining`
- `status`
- `history`
- totals/list counts agar list sahifada bo'lsa
