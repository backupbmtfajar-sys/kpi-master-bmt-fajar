# KPI MASTER BMT FAJAR

Sistem KPI Marketing berbasis:
- Google Spreadsheet = database
- Google Cloud / Google Sheets API = akses database
- Netlify Functions = backend API
- Netlify = hosting
- GitHub = repository

## DESAIN WAJIB
Dashboard menggunakan desain corporate banking seperti mockup yang disetujui:
- Sidebar navy
- Kartu KPI biru, hijau, orange, ungu
- Grafik bonus
- Komparasi sisi ke sisi
- Rekening Koran Marketing
- Target AO/FO
- Grafik tren KPI
- Responsive

**Jangan mengubah konsep visual ini tanpa persetujuan.**

## Login
Username/password berada di sheet `01_USERS`.
Password TIDAK disimpan di source code.
Untuk mengganti password, cukup ubah kolom `Password` di Google Spreadsheet.

## Struktur
public/
  login.html
  index.html
  style.css
  app.js
netlify/functions/
  login.mjs
  logout.mjs
  data.mjs
docs/
  DATABASE_TEMPLATE.xlsx
  SETUP_GOOGLE_CLOUD.md
  SETUP_GITHUB_NETLIFY.md
  DATABASE_STRUCTURE.md

## Environment Variables Netlify
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SPREADSHEET_ID
SESSION_SECRET

`SESSION_SECRET` bukan password pengguna; ini hanya kunci teknis untuk sesi login dan disimpan di Netlify Environment Variables.
Netlify redeploy


