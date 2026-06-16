import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import { interpolatePhone, attemptStrategies } from './services/proxy-core';

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const groqApiKey = process.env.GROQ_API_KEY || '';
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, mode: 'local', pid: process.pid });
});

app.post('/api/proxy', async (req, res) => {
  const { serviceId, serviceUrl, serviceMethod, targetPhone, email, initialPayload } = req.body;

  if (!serviceId || !serviceUrl || !targetPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let payloadToUse = initialPayload
      ? typeof initialPayload === 'string'
        ? JSON.parse(initialPayload)
        : initialPayload
      : { phone: targetPhone };
    payloadToUse = interpolatePhone(payloadToUse, targetPhone, email);

    const attempts = await attemptStrategies({
      serviceUrl,
      serviceMethod: serviceMethod || 'POST',
      targetPhone,
      email: email || '',
      payloadToUse,
      customHeaders: req.body.serviceHeaders,
      groqClient: groq,
    });

    const successAttempt = attempts.find(a => a.success);
    if (successAttempt) {
      return res.status(200).json({
        ok: true,
        upstreamStatus: successAttempt.status,
        attempt: successAttempt.attempt,
        strategy: successAttempt.strategy,
        healed: successAttempt.healed || false,
        healedPayload: successAttempt.healedPayload || null,
        lastResponse: successAttempt.rawBody?.substring(0, 500) || null,
      });
    }

    const lastAttempt = attempts[attempts.length - 1] || { strategy: 'none', status: 0, data: 'No attempts made' };
    return res.status(200).json({
      ok: false,
      upstreamStatus: lastAttempt.status || 0,
      strategy: lastAttempt.strategy || 'none',
      error: 'All upstream attempts failed',
      lastResponse:
        typeof lastAttempt.data === 'string' ? lastAttempt.data.substring(0, 300) : JSON.stringify(lastAttempt.data).substring(0, 300),
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return res.status(502).json({ ok: false, upstreamStatus: 0, strategy: 'error', error: (error as Error).message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Local Proxy] Running on http://localhost:${PORT}`);
});
