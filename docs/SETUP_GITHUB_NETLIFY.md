# STEP 2 — GITHUB & NETLIFY

## GitHub
1. Buat repository baru:
   `kpi-master-bmt-fajar`
2. Upload seluruh isi project ini.
3. Pastikan file credential JSON Google Cloud TIDAK ikut terupload.

## Netlify
1. Add new project → Import from Git.
2. Pilih repository GitHub.
3. Build command boleh dikosongkan untuk project ini.
4. Publish directory:
   `public`
5. Functions directory:
   `netlify/functions`

## Environment Variables
Tambahkan di Netlify → Site configuration → Environment variables:

GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SPREADSHEET_ID
SESSION_SECRET

Untuk GOOGLE_PRIVATE_KEY, masukkan private key lengkap dari JSON.
Jika perlu, gunakan format dengan `\n`; kode backend sudah mengubahnya menjadi line break.

## Catatan
Username/password pengguna tidak diletakkan di Environment Variables. Keduanya dibaca dari sheet `01_USERS`.
