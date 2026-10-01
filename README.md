# WhatsApp-Integrated Calendar Web App
Aplikasi kalender interaktif berbasis web yang terintegrasi langsung dengan WhatsApp. Pengguna dapat menjadwalkan tugas, jadwal, atau acara hanya dengan mengirimkan pesan teks berbahasa alami (*natural language*) melalui WhatsApp, yang kemudian diproses oleh AI dan ditampilkan secara otomatis pada antarmuka kalender web.

---

## Fitur Utama
- **NLP Task Parsing:** Mengubah pesan teks santai (contoh: *"Ingatkan kumpul tugas MPM besok jam 8 malam"*) menjadi data jadwal terstruktur menggunakan **Google Gemini API**.
- **WhatsApp Webhook:** Menerima dan merespon pesan pengingat secara otomatis melalui WhatsApp Gateway.
- **Dynamic Web Calendar:** Tampilan dasbor kalender interaktif yang menyajikan daftar tugas real-time dari database.
- **Cloud Database:** Penyimpanan terpusat yang aman memanfaatkan **Supabase** dengan *Row Level Security* (RLS).

---

## Tech Stack & Infrastruktur
| Komponen | Teknologi / Layanan |
| --- | --- |
| **Framework** | Next.js (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **AI / Parsing Engine** | Google Gemini API (`gemini-1.5-flash`) |
| **WhatsApp Gateway** | Fonnte / Baileys API |
| **Deployment** | Vercel (Serverless Functions) |

---

## Anggota Kelompok & Pembagian Peran
- Muhammad Adhwa Putra Adhitama: Mengintegrasi Gemini API, handler Webhook WhatsApp, dan arsitektur database Supabase.
- Irawan Jaya Negara:
- Ghaza Amru:

---

## Skema Database (Supabase)
```sql
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_phone text not null,
  title text not null,
  due_date date not null,
  due_time time default '23:59:00',
  category text default 'Tugas',
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
