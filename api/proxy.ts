// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import axios from 'axios';

// SSL Bypass
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { serviceId, serviceUrl, serviceMethod, targetPhone, email, initialPayload } = req.body;

    if (!serviceId || !serviceUrl || !targetPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let payloadToUse = initialPayload || { phone: targetPhone };
        
        // 1. Check Supabase for learned schema
        const { data: endpointData } = await supabase
            .from('endpoints')
            .select('payload_schema')
            .eq('id', serviceId)
            .single();

        if (endpointData && endpointData.payload_schema) {
            let schemaStr = JSON.stringify(endpointData.payload_schema);
            schemaStr = schemaStr.replace(/{{PHONE}}/g, targetPhone);
            schemaStr = schemaStr.replace(/{{EMAIL}}/g, email || 'test@test.com');
            schemaStr = schemaStr.replace(/\+905XXXXXXXXX/g, `+90${targetPhone}`);
            schemaStr = schemaStr.replace(/905XXXXXXXXX/g, `90${targetPhone}`);
            schemaStr = schemaStr.replace(/05XXXXXXXXX/g, `0${targetPhone}`);
            schemaStr = schemaStr.replace(/5XXXXXXXXX/g, targetPhone);
            payloadToUse = JSON.parse(schemaStr);
        }

        const executeRequest = async (payload) => {
            try {
                const response = await axios({
                    method: serviceMethod || 'POST',
                    url: serviceUrl,
                    data: payload,
                    timeout: 6000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*'
                    }
                });
                return { success: response.status >= 200 && response.status < 300, status: response.status, data: response.data, html: '' };
            } catch (err) {
                return { 
                    success: false, 
                    status: err.response?.status || 500, 
                    data: err.response?.data || err.message,
                    html: typeof err.response?.data === 'string' ? err.response.data : JSON.stringify(err.response?.data) 
                };
            }
        };

        // 2. İlk Deneme
        let firstAttempt = await executeRequest(payloadToUse);

        if (firstAttempt.success) {
            return res.status(200).json({ ok: true, upstreamStatus: firstAttempt.status });
        }

        // 3. Çelik Kubbe Devreye Giriyor (Auto-Heal via Groq)
        console.log(`[Proxy] Request to ${serviceId} failed with ${firstAttempt.status}. Healing...`);
        
        const prompt = `
        You are a highly advanced API reverse-engineering AI. 
        I tried to send a POST request to ${serviceUrl}.
        The payload I sent was: ${JSON.stringify(payloadToUse)}
        The server rejected it with HTTP ${firstAttempt.status}.
        The server returned this error/HTML body: 
        ---
        ${firstAttempt.html ? firstAttempt.html.substring(0, 1500) : 'No body'}
        ---
        Based on this error or HTML form, deduce the correct JSON body format required by this API.
        You MUST output ONLY valid JSON. Nothing else. No markdown formatting. 
        Where a phone number belongs, output EXACTLY the string "{{PHONE}}".
        Where an email belongs, output EXACTLY the string "{{EMAIL}}".
        Give me the fully corrected structured JSON.
        `;

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You extract API schemas and return strictly valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const healedJsonString = chatCompletion.choices[0].message.content;
        let healedPayloadSchema;
        try {
            healedPayloadSchema = JSON.parse(healedJsonString);
        } catch(e) {
            return res.status(200).json({ ok: false, error: "AI failed to parse JSON" });
        }

        let testStr = JSON.stringify(healedPayloadSchema);
        testStr = testStr.replace(/{{PHONE}}/g, targetPhone);
        testStr = testStr.replace(/{{EMAIL}}/g, email || 'test@test.com');
        const healedTestPayload = JSON.parse(testStr);

        // 4. Retry with healed payload
        let secondAttempt = await executeRequest(healedTestPayload);

        if (secondAttempt.success) {
            // Başarılı olursa Supabase'e bu yeni formatı kaydet
            await supabase.from('endpoints').update({
                payload_schema: healedPayloadSchema,
                status: 'working',
                is_auto_healed: true,
                last_healed_at: new Date().toISOString()
            }).eq('id', serviceId);

            return res.status(200).json({ ok: true, upstreamStatus: secondAttempt.status, healed: true, healedPayload: healedPayloadSchema });
        }

        return res.status(200).json({ 
            ok: false, 
            upstreamStatus: secondAttempt.status, 
            error: "AI Heal failed",
            healedPayload: healedPayloadSchema
        });

    } catch (error: any) {
        console.error('[Proxy] Error:', error);
        return res.status(500).json({ ok: false, error: String(error) });
    }
}
