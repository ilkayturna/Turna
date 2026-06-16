import type { VercelRequest, VercelResponse } from '@vercel/node';
import { interpolatePhone, attemptStrategies } from '../services/proxy-core';

if (process.env.VERCEL_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { serviceId, serviceUrl, serviceMethod, serviceHeaders, targetPhone, email, initialPayload } = req.body;

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
      customHeaders: serviceHeaders,
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
  } catch (error: unknown) {
    console.error('[Proxy] Error:', error);
    return res.status(502).json({ ok: false, upstreamStatus: 0, strategy: 'error', error: (error as Error).message });
  }
}
