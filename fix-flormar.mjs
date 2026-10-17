const PHONE = '05343622375';

async function tryFlormar() {
  const emails = [
    'test.flormar@gmail.com',
    'testflormar@hotmail.com',
    'test.flormar@yandex.com',
    'testflormar@proton.me',
    'ali.yilmaz.1987@gmail.com',
    'mehmet.demir.1995@hotmail.com.tr',
  ];
  for (const email of emails) {
    const r = await fetch('https://www.flormar.com.tr/users/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Type': 'akinon-mobile',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ phone: PHONE, first_name: 'Ali', last_name: 'Yılmaz', email, password: 'Test123!' }),
    });
    const body = await r.text();
    console.log(email.padEnd(40), r.status, body.substring(0, 120));
  }
}
tryFlormar().catch(console.error);
