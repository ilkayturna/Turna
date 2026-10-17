import dns from 'dns';
import https from 'https';
import http from 'http';

const ENDPOINTS = [
  'https://api.filemarket.com.tr/v1/otp/send',
  'https://www.onurmarket.com/api/v1/auth/register/sendOtp',
  'https://api.hayatsu.com.tr/api/SignUp/SendOtp',
  'https://yapp.com.tr/api/mobile/v1/register',
  'https://suiste.com/api/auth/code',
  'https://www.e-bebek.com/api/v1/auth/register/send-otp',
  'https://www.bkmexpress.com.tr/api/v1/otp/send',
  'https://www.shopandfly.com.tr/api/v1/otp/send',
  'https://www.teb.com.tr/api/v1/otp/send',
  'https://www.kfc.com.tr/api/v1/auth/register/send-otp',
  'https://www.sportive.com.tr/api/v1/auth/register/send-otp',
  'https://api.oldubil.com/api/v1/auth/send-otp',
  'https://www.lcwaikiki.com.tr/api/v1/auth/register/send-otp',
  'https://www.bambi.com.tr/api/v1/auth/register/send-otp',
  'https://www.migros.com.tr/rest/auth/register/send-otp',
  'https://api.dominos.com.tr/api/v1/auth/otp/send',
  'https://www.starbucks.com.tr/api/account/register/otp',
  'https://api.komagene.com.tr/api/v1/auth/send-otp',
  'https://api.kimgbister.com/api/auth/otp/send',
  'https://www.englishhome.com/api/member/register/send-code',
  'https://www.koton.com/api/v1/auth/register/send-otp',
  'https://www.joker.com.tr/api/auth/otp/send',
  'https://www.penti.com/api/member/register/sendOtp',
  'https://api.cineverse.com.tr/api/v1/auth/register/otp',
  'https://www.naosstars.com/api/auth/register/sendOtp',
  'https://api.akasyaavm.com/api/v1/auth/send-otp',
  'https://api.akbati.com.tr/api/v1/auth/send-otp',
  'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number',
  'https://www.wmf.com.tr/users/register/',
  'https://www.evidea.com/users/register/',
  'https://www.dr.com.tr/api/member/sendOtp',
  'https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet',
  'https://api.kuryemgelsin.com/api/v1/auth/otp/send',
  'https://api.marti.tech/api/v2/auth/otp/send',
  'https://api.ido.com.tr/api/v1/member/register/sendOtp',
  'https://api.hamidiyesu.com.tr/api/auth/register/otp',
  'https://api.clickmelive.com/api/v1/auth/otp/send',
  'https://api.hizliecza.com/api/v1/auth/register/otp',
  'https://api.paybol.com/api/v1/auth/otp/send',
  'https://api.tasdelensu.com.tr/api/auth/register/sendSms',
  'https://api.pidem.com.tr/api/v1/auth/otp/send',
  'https://api.orwi.com.tr/api/v1/auth/register/otp',
  'https://api.tazi.com.tr/api/v1/auth/register/sendOtp',
  'https://api.bisu.com.tr/api/v1/auth/otp/send',
  'https://ebelediye.bodrum.bel.tr/api/auth/register/sendOtp',
  'https://api.heyscooter.com/api/v1/auth/otp/send',
  'https://api.tasimacim.com/api/v1/auth/register/otp',
  'https://api.istegelsin.com/api/v1/auth/otp/send',
  'https://api.ipragaz.com.tr/api/v1/auth/register/sendOtp',
  'https://ebelediye.sancaktepe.bel.tr/api/auth/register/sendOtp',
  'https://ebelediye.bayrampasa.bel.tr/api/auth/register/sendOtp',
  'https://www.macrocenter.com.tr/rest/auth/register/send-otp',
  'https://www.jimmykey.com/api/member/register/sendOtp',
  'https://www.alixavien.com.tr/api/member/register/sendOtp',
  'https://www.ayyildiz.com/api/member/register/sendOtp',
  'https://api.tiklagelsin.com/api/v1/auth/otp/send',
  'https://www.kitapyurdu.com/index.php?route=account/register/sendOtp',
  'https://www.bkmkitap.com/api/member/register/sendOtp',
  'https://www.mothercare.com.tr/api/member/register/sendOtp',
  'https://www.toyzzshop.com/api/member/register/sendOtp',
  'https://www.intersport.com.tr/api/v1/auth/register/sendOtp',
  'https://www.decathlon.com.tr/api/v1/auth/register/sendOtp',
  'https://www2.hm.com/tr_tr/api/customer/register/sendOtp',
  'https://www.zara.com/tr/api/v1/auth/register/send-otp',
  'https://shop.mango.com/services/user/v1/register/send-otp',
  'https://www.bershka.com/itxrest/2/auth/register/sendOtp',
  'https://www.pullandbear.com/itxrest/2/auth/register/sendOtp',
  'https://www.stradivarius.com/itxrest/2/auth/register/sendOtp',
  'https://www.massimodutti.com/itxrest/2/auth/register/sendOtp',
  'https://www.mediamarkt.com.tr/api/v1/auth/register/send-otp',
  'https://www.teknosa.com/api/v1/auth/register/sendOtp',
  'https://www.vatanbilgisayar.com/api/v1/auth/register/sendOtp',
  'https://www.itopya.com/api/v1/auth/register/sendOtp',
  'https://www.gamegaraj.com/api/v1/auth/register/sendOtp',
  'https://store.playstation.com/api/v1/auth/otp/send',
  'https://login.live.com/api/v1/auth/otp/send',
  'https://accounts.nintendo.com/api/v1/auth/otp/send',
  'https://store.steampowered.com/phone/add_ajaxop',
  'https://www.epicgames.com/id/api/v1/auth/otp/send',
  'https://www.a101.com.tr/api/v1/auth/register/send-otp',
  'https://www.sokmarket.com.tr/api/v1/auth/register/sendOtp',
  'https://www.carrefoursa.com/api/v1/auth/register/send-otp',
  'https://www.happycenter.com.tr/api/v1/auth/register/sendOtp',
  'https://www.rossmann.com.tr/api/v1/auth/register/send-otp',
  'https://www.watsons.com.tr/api/v1/auth/register/send-otp',
  'https://www.gratis.com/api/v1/auth/register/sendOtp',
  'https://www.flormar.com.tr/api/v1/auth/register/sendOtp',
  'https://www.avon.com.tr/api/v1/auth/register/sendOtp',
  'https://www.oriflame.com.tr/api/v1/auth/register/send-otp',
  'https://www.farmasi.com.tr/api/v1/auth/register/sendOtp',
  'https://www.lrworld.com/tr/api/auth/register/send-otp',
  'https://www.herbalife.com.tr/api/v1/auth/register/sendOtp',
  'https://www.amway.com.tr/api/v1/auth/register/send-otp',
  'https://www.foreverliving.com.tr/api/v1/auth/register/sendOtp',
];

function getDomain(url) {
  return new URL(url).hostname;
}

function resolveDns(hostname) {
  return new Promise(resolve => {
    dns.resolve(hostname, (err, addresses) => {
      resolve(err ? null : addresses);
    });
  });
}

async function quickCheck(url) {
  const domain = getDomain(url);
  const ips = await resolveDns(domain);
  if (!ips) return { url, domain, dns: false, status: 'DNS_FAIL' };

  return new Promise(resolve => {
    const req = https.get(
      url,
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        rejectUnauthorized: false,
      },
      res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ url, domain, dns: true, status: res.statusCode, body: body.substring(0, 100) });
        });
      },
    );
    req.on('error', err => {
      resolve({ url, domain, dns: true, status: 'ERR', error: err.code || err.message.substring(0, 30) });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, domain, dns: true, status: 'TIMEOUT' });
    });
  });
}

async function main() {
  console.log('=== DNS ÇÖZÜMLEME ===\n');
  const dnsResults = [];
  for (const url of ENDPOINTS) {
    const domain = getDomain(url);
    const ips = await resolveDns(domain);
    dnsResults.push({ url, domain, ips });
    if (!ips) {
      console.log(`❌ ${domain.padEnd(30)} DNS ÇÖZÜMLENEMEDİ`);
    } else {
      console.log(`✅ ${domain.padEnd(30)} ${ips[0]}`);
    }
  }

  const failedDns = dnsResults.filter(r => !r.ips);
  if (failedDns.length > 0) {
    console.log(`\n⚠️ ${failedDns.length} domain DNS çözümlenemedi!`);
  }

  console.log(`\n=== ${ENDPOINTS.length} ENDPOINT TEST ===\n`);
  const results = [];
  for (const url of ENDPOINTS) {
    const r = await quickCheck(url);
    results.push(r);
    const id = new URL(url).hostname;
    if (r.dns === false) {
      console.log(`❌ ${id.padEnd(30)} DNS_FAIL`);
    } else if (r.status === 'ERR') {
      console.log(`❌ ${id.padEnd(30)} ${r.error}`);
    } else if (r.status === 'TIMEOUT') {
      console.log(`⏱️ ${id.padEnd(30)} TIMEOUT`);
    } else if (r.status >= 200 && r.status < 300) {
      console.log(`✅ ${id.padEnd(30)} ${r.status}`);
    } else {
      console.log(`⚠️ ${id.padEnd(30)} ${r.status}`);
    }
  }

  const success = results.filter(r => typeof r.status === 'number' && r.status >= 200 && r.status < 300);
  const dnsFail = results.filter(r => r.dns === false);
  const timeout = results.filter(r => r.status === 'TIMEOUT');
  const error = results.filter(r => r.status === 'ERR');
  const httpFail = results.filter(r => typeof r.status === 'number' && r.status >= 300);

  console.log(`\n========== ÖZET ==========`);
  console.log(`Toplam: ${results.length}`);
  console.log(`✅ 2xx Başarılı: ${success.length}`);
  console.log(`⚠️ HTTP Hatası: ${httpFail.length}`);
  console.log(`❌ DNS Hatası: ${dnsFail.length}`);
  console.log(`⏱️  Timeout: ${timeout.length}`);
  console.log(`🔴 Bağlantı Hatası: ${error.length}`);

  if (dnsFail.length > 0) {
    console.log(`\nDNS çözümlenemeyen domainler (muhtemelen yanlış URL):`);
    for (const r of dnsFail) {
      console.log(`  ${new URL(r.url).hostname} → ${r.url}`);
    }
  }
}

main().catch(console.error);
