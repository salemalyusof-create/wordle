# Wordle Oyunu

Bu proje, popüler Wordle kelime tahmin oyununun bir klonudur. Oyuncular 5 harfli kelimeleri tahmin etmeye çalışır ve geri bildirim alırlar.

## Özellikler

- **Kelime Tahmin Oyunu**: 6 deneme hakkı ile 5 harfli kelimeleri tahmin edin
- **Renkli Geri Bildirim**: Doğru harfler yeşil, yanlış yerde olanlar sarı, yanlış olanlar gri gösterilir
- **Sanal Klavye**: Ekran klavyesi ile oynayın
- **İstatistikler**: Oyunlar ve seriler tarayıcınızda saklanır

## Nasıl Oynanır

1. **Oyunu Başlatın**: Oyuncu hesabı gerekmeden oyunu açın
2. **Kelime Tahmin Edin**: 5 harfli bir kelime yazın
3. **Geri Bildirim Alın**:
   - 🟢 Yeşil: Harf doğru yerde
   - 🟡 Sarı: Harf kelimede var ama yanlış yerde
   - ⚫ Gri: Harf kelimede yok
4. **6 Deneme Hakkınız Var**: Kelimeyi 6 denemede bulunmaya çalışın

## Kurulum ve Çalıştırma

1. **Dosyaları İndirin**: Tüm proje dosyalarını bir klasöre koyun
2. **Tarayıcıda Açın**: Proje klasöründe `npx serve . -l 5500` çalıştırıp `http://localhost:5500` adresini açın. `file://` ile açmayın.
3. **Oynamaya Başlayın**: Oyuncu hesabı gerekmez.
cd "c:\Users\admin\Desktop\private copy"; npx serve . -l 5500
## Dosya Yapısı

- `index.html`: Ana HTML dosyası
- `script.js`: Oyun mantığı ve JavaScript kodu
- `styles.css`: CSS stilleri
- `backend.js`: Node.js backend kodu
- `englishwordlist.txt` ve `turkishwordlist.txt`: Kelime listeleri
- `README.md`: Bu dosya

## Teknik Detaylar

- **Frontend**: HTML, CSS, JavaScript
- **Kelime Listesi**: `englishwordlist.txt` ve `turkishwordlist.txt` dosyalarından yüklenir
- **Platform**: Web tarayıcısı (Chrome, Firefox, Safari vb.)

## Lisans

yok ):
