# Dokumentasi Pengembangan SafeRoute-ML (Update Tahap 3)

Sesuai permintaan terbaru Anda, berikut adalah kelanjutan dokumentasi pembaruan dan pengembangan fitur Machine Learning untuk project **SafeRoute-ML**.

## 1. Integrasi Minimal 5 Sumber Portal Berita Utama
Sebelumnya sistem hanya mendukung pencarian di 1-2 sumber. Sekarang, `news_crawler.py` telah berhasil diperluas untuk mencakup minimal **5 sumber portal berita nasional terpercaya** secara *native*:
1. **Detik.com** (`search_detik`)
2. **Suara.com** (`search_suara`)
3. **Liputan6.com** (`search_liputan6`)
4. **Viva.co.id** (`search_viva`)
5. **Antaranews.com** (`search_antara`)

Setiap sumber dilengkapi dengan sistem **Pagination (Halaman Pencarian)** sehingga crawler dapat menjelajahi halaman 1 & 2 dari tiap-tiap situs demi menjangkau puluhan artikel per kata kunci secara bersamaan.

## 2. Penyempurnaan Filter Depok
Filter daerah Depok telah disempurnakan. Evaluasi dilakukan secara berlapis:
- Pertama, menganalisis entitas lokasi hasil prediksi model NER (`locations`).
- Kedua, mengecek seluruh konten teks berita (judul + isi artikel).
- Berita yang tidak berkaitan dengan Depok akan langsung ditolak (`[DITOLAK] Bukan kasus di Depok`), sehingga tidak mengotori dataset peta SafeRoute Anda.

## 3. Hasil Pipeline Data
Semua data berita yang memenuhi kriteria di atas dikomparasi secara otomatis melalui pipeline Anda:
- Mengambil isi berita utuh menggunakan `scraper.py`.
- Melakukan klasifikasi kejahatan (BEGAL, TAWURAN, PEMBACOKAN, PENCURIAN, KECELAKAAN, KEBAKARAN) menggunakan `classifier.py`.
- Mengekstraksi nama jalan/waktu kejadian menggunakan model NER spacy yang telah dilatih (`train_ner.py`).
- Menyimpan hasil terstruktur ke JSON (`scraped_real_cases.json`) dan dapat diubah menjadi CSV latihan menggunakan `prepare_real_dataset.py`.

## Cara Penggunaan
1. **Jalankan Crawler**: `python news_crawler.py`
2. **Ekspor ke CSV Training**: `python prepare_real_dataset.py`
3. **Train NER**: `python train_ner.py`

Semua target fitur Anda sudah berhasil diselesaikan sepenuhnya dan berjalan tanpa kendala!
