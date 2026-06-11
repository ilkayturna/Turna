import axios from 'axios';

const ph = '5343622375';

const CANDIDATES = [
  {id:'e_bebek', url:'https://www.e-bebek.com/api/v1/auth/register/send-otp', p:{phone:ph, email:'test@test.com'}},
  {id:'onur_market', url:'https://www.onurmarket.com/api/v1/auth/register/sendOtp', p:{phone:ph}},
  {id:'bim', url:'https://bim.com.tr/api/v1/user/register/otp', p:{phone:'90'+ph}},
  {id:'frink', url:'https://api.frink.com.tr/api/auth/send-otp', p:{phone:ph}},
  {id:'sportive', url:'https://www.sportive.com.tr/api/v1/auth/register/send-otp', p:{phone:ph}},
  {id:'forever_living', url:'https://www.foreverliving.com.tr/api/v1/auth/register/sendOtp', p:{phone:ph,email:'test@test.com',name:'Test Name'}},
];

console.log('Testing candidates through proxy...\n');
for (const t of CANDIDATES) {
  process.stdout.write(t.id.padEnd(18));
  try {
    const r = await axios.post('http://localhost:3001/api/proxy', {
      serviceId: t.id, serviceUrl: t.url, serviceMethod: 'POST',
      targetPhone: ph, email: 'test@test.com',
      initialPayload: t.p, allowAiHealing: false
    }, {timeout:20000, validateStatus:()=>true});
    
    if (r.data && r.data.ok) {
      console.log('✅ ' + r.data.upstreamStatus);
    } else {
      console.log('  ' + (r.data?.upstreamStatus||'??') + ' (not ok)');
    }
  } catch(e) {
    const msg = e.response ? e.response.status + ' ' + JSON.stringify(e.response.data).substring(0,60) : (e.code||e.message.substring(0,40));
    console.log('  ERR ' + msg);
  }
}
