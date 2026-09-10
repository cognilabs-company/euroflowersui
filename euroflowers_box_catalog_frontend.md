# EuroFlowers Frontend Update: Oddiy katalogda Quti

Sana: 2026-09-10

Backend deploy qilindi. Oddiy katalog qo‘shishda `buket` va `savat` yoniga `quti` turi ham ishlaydi.

## Asosiy o‘zgarish

`POST /api/catalog/` va `PATCH /api/catalog/{id}/` uchun `arrangement_type` qiymatlari:

- `bouquet` — buket
- `basket` — savat
- `box` — quti

## Quti qoidasi

Oddiy katalogda `arrangement_type=box` tanlansa:

- `catalog_kind` default `standard` bo‘lib qoladi.
- `volume` majburiy emas.
- Florist tanlangan bo‘lsa `florist_salary_amount` majburiy.
- `florist_salary_amount` har safar qo‘lda kiritiladi.
- Har bir gul tarkibi uchun `composition[].quantity_stems` majburiy.
- Quti uchun florist haqi buket/savatdagi `S/M/L` tarifdan olinmaydi.
- Shogirt tanlansa florist salary yozilmaydi, shogirtlarda kunlik ish haqi alohida yuradi.

## Buket va savat o‘zgarmadi

`bouquet` va `basket` uchun oldingi qoida saqlanadi:

- `volume` tanlanadi.
- Floristga beriladigan pul floristning hajm tarifidan olinadi.
- Frontend yuborgan `florist_salary_amount` backend tomonidan hisobga olinmaydi.

## Quti qo‘shish payload namunasi

```json
{
  "name_uz": "Quti katalog",
  "arrangement_type": "box",
  "catalog_kind": "standard",
  "florist": 12,
  "price": "500000",
  "quantity_total": 1,
  "florist_salary_amount": "125000",
  "composition": [
    {
      "stock_batch": 34,
      "quantity_stems": 10
    }
  ],
  "materials": []
}
```

## Frontend validatsiya

`arrangement_type=box` bo‘lsa:

- Hajm selectini majburiy qilmang.
- Florist haqi inputini ko‘rsating va majburiy qiling.
- Gul tarkibida har bir qator uchun gul sonini majburiy qiling.

Backend xatolari:

```json
{
  "florist_salary_amount": ["Quti uchun floristga beriladigan pulni kiriting"]
}
```

```json
{
  "composition": ["Quti katalogida har bir gul sonini kiriting"]
}
```

## Tekshirildi

Serverda targeted testlar o‘tdi:

- standart buketda qo‘lda salary e’tiborga olinmaydi
- standart buketda hajm tarifi talab qilinadi
- custom katalogda qo‘lda salary ishlaydi
- standart qutida qo‘lda salary ishlaydi
- standart qutida salary bo‘lmasa xato qaytadi
- standart qutida gul soni bo‘lmasa xato qaytadi
