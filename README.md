# Makefy Admin Panel

Platformaning alohida admin sayti (React 19 + Vite + Tailwind 4). Asosiy saytdan (MakefyFrontend) mustaqil,
o'z domenida ishlaydi (masalan `admin.makefy.uz`). Backend — `MakefyBackend/api/panel/*`.

## Bo'limlar

| Bo'lim | Nima qiladi |
|---|---|
| Boshqaruv paneli | Statistika, grafiklar, reytinglar, ogohlantirishlar, so'nggi hodisalar |
| Foydalanuvchilar | Qidirish, balans +/− (jurnal bilan), bloklash, tarif berish, xabar, botlari, referallari, to'lovlari |
| Botlar | Barcha botlar, muddat uzaytirish, tarif, to'xtatish/yoqish, shablonni yangilash, webhookni tiklash |
| So'rovlar va buyurtmalar | Maxsus bot so'rovlariga javob, bot biriktirish, egasiga yuborish, katalog, egalik o'tkazish |
| Chat | Foydalanuvchilar bilan yozishma (WebApp chati bilan bir xil) |
| Xabar yuborish | Hammaga xabar (navbat orqali), avval o'zingizga sinab ko'rish |
| To'lovlar va kartalar | Kartalar, to'lov so'rovlari, aniqlanmagan tranzaksiyalarni qo'lda bog'lash, balans jurnali |
| Platforma / bot tariflari | Narxlar, imtiyozlar, limitlar (saqlangach botlarning limits.json yangilanadi) |
| Promokodlar, pul ishlash kanallari, bot turlari | To'liq boshqaruv |
| Shablonlar | Yagona manbadan barcha botlarga yangilanishni tarqatish |
| AI sozlamalari | Provayderlar, kalitlar, model, narxlash |
| Bot sozlamalari | Telegram botdagi «⚙ Sozlamalar» bilan bir xil fayllar: holat, adminlar, majburiy obuna, qoidalar, bonus |
| Xavfsizlik | Barcha admin amallari jurnali, tizim holati, server xatolari, limitlarni tiklash |

## Kirish

Login/parol yo'q. Admin platforma botiga `/panelweb` yozadi → bot `ADMIN_PANEL_URL/enter?token=…` havolasini beradi
(2 daqiqa, bir martalik) → sayt tokenni `auth/admin_token` orqali sessiyaga almashtiradi.

## O'rnatish (Vercel)

1. Ushbu papkani alohida Vercel loyihasi sifatida joylang (Framework: Vite).
2. Vercel → Environment Variables:
   - `BACKEND_ORIGIN` = PHP backend manzili (masalan `https://6a4cc7f182c08.xvest2.ru`)
   - `VITE_BACKEND_URL` = shu manzil (chatdagi rasmlar uchun)
   - `PROXY_SHARED_SECRET` = backend `.env` dagi bilan bir xil (ixtiyoriy)
3. Domen ulang (masalan `admin.makefy.uz`).
4. **Backend `.env`**: `ADMIN_PANEL_URL=https://admin.makefy.uz` — shundan keyin `/panelweb` yangi panelni ochadi.

Brauzer faqat `/api/index?__path=…` ga murojaat qiladi (Vercel funksiyasi `api/index.js` → backend), shuning uchun
sessiya cookie'si birinchi tomon bo'lib qoladi va CORS sozlash shart emas.

## Lokal ishga tushirish

```bash
npm install
npm run dev        # /api → VITE_API_PROXY_TARGET (PHP backend)
npm run dev:mock   # backendsiz, namunaviy ma'lumotlar bilan (dizaynni ko'rish uchun)
npm run build
```
