# STEP 1 — GOOGLE CLOUD

1. Buka Google Cloud Console.
2. Buat project baru, misalnya:
   `KPI Master BMT Fajar`
3. Masuk ke APIs & Services → Library.
4. Aktifkan **Google Sheets API**.
5. Masuk ke IAM & Admin → Service Accounts.
6. Buat Service Account, misalnya:
   `kpi-master-bmt-fajar`
7. Buat key JSON untuk Service Account.
8. Simpan file JSON secara aman dan JANGAN upload ke GitHub.
9. Dari JSON, gunakan:
   - `client_email` → GOOGLE_SERVICE_ACCOUNT_EMAIL
   - `private_key` → GOOGLE_PRIVATE_KEY

## Google Spreadsheet
Share spreadsheet database kepada email Service Account sebagai Viewer.

Jangan share file JSON ke orang lain dan jangan memasukkannya ke repository.
