# EuroFlowers Frontend Update: Quti katalogda avtomatik taqsimot

Sana: 2026-09-12

Backend deploy qilindi. Oddiy katalogda `quti` endi `buket` va `savat` kabi ishlaydi.

## Nima o'zgardi

Oldin `arrangement_type=box` bo'lsa gul sonini frontend qo'lda yuborishi kerak edi.

Endi quti ham floristga chiqarilgan guldan avtomatik taqsimlanadi:

- florist tanlanadi
- turi `box` tanlanadi
- hajm `volume` tanlanadi
- gul batch tanlanadi
- `quantity_stems` yuborilmasa ham bo'ladi
- backend composition qatorini `quantity_stems=0` qilib saqlaydi
- florist chiqimi yopilganda backend hajm tarifi bo'yicha gul sonini avtomatik yozadi

## Muhim

`box` uchun ham florist hajm tarifi kerak.

Florist tariflarida endi `arrangement_type` qiymatlari:

- `bouquet`
- `basket`
- `box`

Frontend florist yaratish/edit qilish sahifasida quti uchun ham S/M/L yoki mavjud hajm tariflarini kiritish imkonini ko'rsatishi kerak.

## Oddiy katalog qo'shish payload

Quti uchun `volume` majburiy.

```json
{
  "name_uz": "Quti katalog",
  "arrangement_type": "box",
  "catalog_kind": "standard",
  "volume": "M",
  "florist": 12,
  "price": "500000",
  "quantity_total": 1,
  "composition": [
    {
      "stock_batch": 34
    }
  ]
}
```

`quantity_stems` yuborish shart emas.

## Qanday ishlaydi

Katalog qo'shilganda:

- `florist_salary_amount` backendda quti hajm tarifidan olinadi
- frontend yuborgan `florist_salary_amount` standart qutida hisobga olinmaydi
- composition `quantity_stems=0` bo'lib turadi

Florist chiqimi yopilganda:

- backend `FloristVolumeRate.default_stems` asosida quti kataloglarga gul sonini taqsimlaydi
- qoldiq qolsa mavjud absorb logic ishlaydi

## Xato holatlar

Quti tanlanib, `volume` yuborilmasa:

```json
{
  "volume": ["Florist katalogida hajmni tanlash kerak — gul shu bo'yicha taqsimlanadi"]
}
```

Quti uchun floristda shu hajm tarifi bo'lmasa:

```json
{
  "volume": ["<florist> uchun bu hajm tarifi belgilanmagan. Avval floristga hajm narxini kiriting."]
}
```

## Frontenddan kerak

- Oddiy katalogda `box` tanlanganda `volume` majburiy bo'lsin.
- `box` tanlanganda gul soni inputini majburiy qilmang.
- Florist tariflari UI'da `box` uchun ham tarif kiritish imkonini qo'shing.
- Standart `box` katalogda florist haqi inputini majburiy qilmang, backend tarifdan oladi.

## Tekshirildi

Serverda targeted testlar o'tdi:

- standart buket eski tarif logikasida qoldi
- custom katalog qo'lda florist haqi oladi
- standart quti hajm tarifidan florist haqi oladi
- standart quti tarif bo'lmasa xato qaytaradi
- standart quti florist chiqimi yopilganda avtomatik gul soni bilan to'ldiriladi
