# STRUKTUR DATABASE GOOGLE SHEETS

Spreadsheet utama: `DATABASE KPI BMT FAJAR`

Sheet wajib:

1. `01_USERS`
2. `02_DATA_KARYAWAN`
3. `03_KPI_AO`
4. `04_KPI_FO`
5. `05_TARGET_AO`
6. `06_TARGET_FO`
7. `07_CONFIG`

## Aturan data
- Rupiah disimpan sebagai angka, bukan teks `Rp...`.
- Persentase disimpan sebagai angka/persentase yang konsisten.
- Tahun dan Bulan sebaiknya angka.
- ID marketing harus unik.
- Target menjadi sumber acuan capaian.
- Dashboard membaca target dari spreadsheet; jangan hard-code target bisnis di frontend.

## Perhitungan target AO
Kategori berdasarkan Outstanding:
- Magang: >= 500 juta dan < 1,5 M
- Junior: >= 1,5 M dan < 3 M
- Senior: >= 3 M

Target pencairan:
- Magang 200 juta
- Junior 300 juta
- Senior 500 juta

Target lain:
- Anggota Baru 13
- Net Growth 50 juta
- NPF 5% (lebih rendah lebih baik)
- Collection 100%
- Dokumen 100%
- Visit 13/bulan

## Target FO
Yang ditarget:
- Visit minimal 100/bulan

Indikator FO lain dapat bernilai 0 / Tidak Ada Target.
