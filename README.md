# Wordle Oyunu

Bu proje, popüler Wordle kelime tahmin oyununun bir klonudur. Oyuncular 5 harfli kelimeleri tahmin etmeye çalışır ve geri bildirim alırlar.

## Özellikler

- **Firebase Authentication**: E-posta/şifre veya Google ile giriş ve kayıt
- **Kelime Tahmin Oyunu**: 6 deneme hakkı ile 5 harfli kelimeleri tahmin edin
- **Renkli Geri Bildirim**: Doğru harfler yeşil, yanlış yerde olanlar sarı, yanlış olanlar gri gösterilir
- **Sanal Klavye**: Ekran klavyesi ile oynayın
- **Yönetici Paneli**: Admin kullanıcıları için özel yönetim özellikleri

## Nasıl Oynanır

1. **Giriş Yapın**: Kullanıcı adı ve şifre ile giriş yapın
2. **Kelime Tahmin Edin**: 5 harfli bir kelime yazın
3. **Geri Bildirim Alın**:
   - 🟢 Yeşil: Harf doğru yerde
   - 🟡 Sarı: Harf kelimede var ama yanlış yerde
   - ⚫ Gri: Harf kelimede yok
4. **6 Deneme Hakkınız Var**: Kelimeyi 6 denemede bulunmaya çalışın

## Yönetim Özellikleri (Admin İçin)

Admin kullanıcısı olarak giriş yaptığınızda:

- **Kullanıcı Yönetimi**: Yeni kullanıcı ekleyin veya mevcut kullanıcıları silin
- **Gizli Kelimeyi Görme**: Mevcut turun gizli kelimesini görün
- **Yönetici Panelini Aç/Kapat**: "Admin Options" butonu ile paneli kontrol edin

## Kurulum ve Çalıştırma

1. **Dosyaları İndirin**: Tüm proje dosyalarını bir klasöre koyun
2. **Firebase Console**: Authentication > Sign-in method bölümünde Email/Password ve Google sağlayıcılarını etkinleştirin
3. **Tarayıcıda Açın**: Proje klasöründe `npx serve . -l 5500` çalıştırıp `http://localhost:5500` adresini açın. `file://` ile açmayın.
4. **Oynamaya Başlayın**: Firebase hesabınızla giriş yapın
cd "c:\Users\admin\Desktop\private copy"; npx serve . -l 5500
## Dosya Yapısı

- `index.html`: Ana HTML dosyası
- `script.js`: Oyun mantığı ve JavaScript kodu
- `styles.css`: CSS stilleri
- `backend.js`: Node.js backend kodu
- `expandedwordlist.txt`: Genişletilmiş kelime listesi
- `README.md`: Bu dosya

## Teknik Detaylar

- **Frontend**: HTML, CSS, JavaScript
- **Kimlik doğrulama**: Firebase Authentication
- **Kelime Listesi**: `words.txt` ve `expandedwordlist.txt` dosyalarından yüklenir
- **Platform**: Web tarayıcısı (Chrome, Firefox, Safari vb.)

## Lisans

yok ):
