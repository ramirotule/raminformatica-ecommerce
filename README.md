# RAM Informatica Ecommerce

Tienda online de RAM Informatica (Santa Rosa, La Pampa) — Next.js + Supabase.

## Stack

- Next.js 16 (App Router) + Tailwind CSS v4
- Supabase (Auth, Postgres, Storage)
- Zustand (estado cliente; carrito sincronizado con usuario)

## Setup

```bash
cd web   # si clonás el monorepo desde la raíz del proyecto local
npm install
cp .env.example .env.local
# Completá las variables de Supabase
npm run dev
```

La app corre en `http://localhost:3000` (u otro puerto si está ocupado).

## Variables de entorno

Ver `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (opcional, solo servidor)
- `DATABASE_URL` / `DIRECT_URL` (opcional)

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build

## Admin

Rutas bajo `/admin`. Requiere usuario de Supabase Auth con `app_metadata.ram_role = "admin"`.
