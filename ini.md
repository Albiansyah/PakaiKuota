# Keputusan Final: Pricing, Rate Limit, Naming, Loyalty

**Referensi:** Audit findings B1-B4 dari agent (temuan bug valid, sebagian rekomendasi di-revisi di bawah)

---

## B1 — Harga: Fix dari Akar (Kuota Paket Harus Rupiah, Bukan Token)

**Root cause:** `pricing/page.tsx:14-16` nyimpan kuota paket sebagai raw token (`50000/150000/400000`), padahal spec di PRD Fase 2 section 4 kuota paket seharusnya **Rupiah**. Ini bug implementasi, bukan cuma soal label.

**Tindakan:**
1. Ubah struktur data paket di `pricing/page.tsx` — kuota disimpan & dihitung dalam Rupiah, bukan token count.
2. `calcTotalPrice` (line 26) tetap formula yang sama (`kuota + hari × tarif_harian`), tapi input kuota-nya sekarang beneran Rupiah, jadi hasilnya konsisten sama label "Rp" di display.
3. **Hapus semua hardcode kurs USD→IDR** (termasuk `admin/models/page.tsx:181`). Ganti jadi 1 sumber kebenaran:
   ```sql
   create table if not exists public.settings (
     key text primary key,
     value text not null,
     updated_at timestamptz not null default now()
   );
   insert into public.settings (key, value) values ('usd_idr_rate', '15000') on conflict do nothing;
   ```
   Semua tempat yang butuh kurs, query dari tabel ini (atau cache di memory dengan TTL pendek), JANGAN hardcode angka di banyak file.
4. Harga upstream per model: pakai `models.upstream_price_per_token` yang sudah ada di schema sebagai satu-satunya sumber, sinkron berkala via cron (sesuai PRD utama section 13 — Model Catalog Sync).
5. Display publik: **Rp per 1K token** (bukan raw token, bukan layer harga tambahan). Format: `Rp {harga}/1K token`.
6. Margin minimum per tier: **belum diputuskan** — perlu ditentukan sebelum harga final di-lock. Untuk sekarang, pakai buffer sementara 35% dari `upstream_price_per_token` supaya development bisa jalan, tapi flag di kode dengan komentar `// TODO: margin final belum di-approve` biar gampang dicari nanti.

---

## B2 — Rate Limit: Supabase RPC (Bukan Redis/Lua, Bukan Skip Total)

**Root cause:** `deduct.ts` dan `spend.ts` manggil file `.lua` yang gak pernah ada di `src/lib/redis/` — kalau path ini ke-hit, runtime crash (`ENOENT`).

**Tindakan:**
1. **Jangan restore Lua scripts, jangan skip total.** Ganti pendekatan: implementasi atomic deduction via **Supabase RPC (Postgres function)**, native UPDATE per-row sudah atomic secara default, cukup buat scale sekarang.
2. Buat migration function baru:
   ```sql
   create or replace function public.deduct_quota(
     p_user_id uuid,
     p_amount bigint,
     p_hourly_limit bigint default null,
     p_daily_limit bigint default null
   ) returns boolean
   language plpgsql
   as $$
   declare
     v_spent_hourly bigint;
     v_spent_daily bigint;
   begin
     if p_hourly_limit is not null then
       select coalesce(sum(cost_rupiah), 0) into v_spent_hourly
       from public.usage_logs
       where user_id = p_user_id and created_at > now() - interval '1 hour';
       if v_spent_hourly + p_amount > p_hourly_limit then
         return false;
       end if;
     end if;

     if p_daily_limit is not null then
       select coalesce(sum(cost_rupiah), 0) into v_spent_daily
       from public.usage_logs
       where user_id = p_user_id and created_at > now() - interval '1 day';
       if v_spent_daily + p_amount > p_daily_limit then
         return false;
       end if;
     end if;

     update public.users
     set balance_rupiah = balance_rupiah - p_amount
     where id = p_user_id and balance_rupiah >= p_amount;

     return found;
   end;
   $$;
   ```
3. Panggil function ini dari `src/app/api/proxy/route.ts` (ganti pemanggilan `.lua` yang lama), pakai `spending_limit_hourly`/`spending_limit_daily` yang **sudah ada** di kolom `users` sebagai parameter.
4. Hapus/uncomment logic di `proxy/route.ts:31-33` sesuai kebutuhan baru ini (bukan restore yang lama, tapi sambungin ke RPC baru).
5. Hapus dependency ke file `.lua` yang gak pernah ada — bersihkan import yang nunjuk ke situ di `deduct.ts` dan `spend.ts`.

---

## B3 — Naming: Dictionary Terpusat, Bukan Migrasi Enum

**Model tier** (Entry/Premium/murah/mahal beda-beda di 4 file):
1. **Jangan ubah enum `model_tier` di database** (`murah`/`menengah`/`mahal` tetap, migrasi enum berisiko dan gak perlu).
2. Buat 1 file mapping terpusat, misal `src/lib/model-tier-labels.ts`:
   ```typescript
   export const MODEL_TIER_LABELS: Record<string, string> = {
     murah: "Standard",
     menengah: "Premium",
     mahal: "Ultra",
   }
   ```
3. Ganti SEMUA tempat yang nampilin label tier (termasuk `admin/margin/page.tsx:130` dan file lain) supaya import dari sini, jangan hardcode string sendiri-sendiri lagi.

**Nama paket** (Starter/Standard/Pro):
1. Ganti jadi: **"Pemula"** (7 hari) / **"Harian"** (14 hari) / **"Pro"** (30 hari) — deskriptif, aman buat awal, gampang dipahami user awam.
2. Update di `pricing/page.tsx` dan file translasi (`id.json`/`en.json` sesuai fix i18n sebelumnya) — pastikan lewat `t()`, jangan hardcode lagi (ini nyambung ke fix bahasa yang udah kita bahas).

---

## B4 — Loyalty: Skip (Sudah Tepat, Tidak Ada Tindakan)

Tidak ada perubahan. Prepaid + reseller model sudah cukup jadi retention mechanic untuk tahap ini. Revisit nanti kalau ada data retention yang nunjukin butuh insentif tambahan.

---

## Checklist Verifikasi

- [ ] Paket pricing tampilkan nilai Rupiah konsisten (bukan campuran token+Rp)
- [ ] Kurs USD→IDR cuma ada di 1 sumber (`settings` table), gak ada hardcode tersisa
- [ ] `/api/proxy` tidak lagi manggil file `.lua` yang gak ada — pakai RPC `deduct_quota`
- [ ] Rate limit hourly/daily beneran nge-block kalau limit terlampaui (test manual: kirim request beruntun sampai lewat limit, pastikan ke-reject bukan crash)
- [ ] Label tier model konsisten di semua halaman (admin & user-facing), sumbernya dari 1 file mapping
- [ ] Nama paket "Pemula"/"Harian"/"Pro" konsisten di semua halaman + kedua bahasa