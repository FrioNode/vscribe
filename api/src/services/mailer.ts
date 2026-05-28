import dotenv from 'dotenv';
dotenv.config();

// Use require-style import for Brevo (same as working TikTok version)
const { BrevoClient } = require('@getbrevo/brevo');

const api = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || '',
  timeoutInSeconds: 30,
  maxRetries: 2
});

const FROM = {
  name: 'Transcribe API',
  email: process.env.MAIL_FROM || 'noreply@frionode.online'
};

async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await api.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: [{ email: to }],
      subject,
      htmlContent: html
    });
    console.log(`✉️  Mail sent → ${to} | ${subject}`);
  } catch (err: any) {
    console.error(`❌ Mail failed → ${to} | ${err?.message}`);
  }
}

const base = (content: string) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden">
    <div style="background:#000;padding:20px 28px;border-bottom:1px solid #2a2a2a"><span style="color:#fff;font-weight:600;font-size:16px">📼 Transcribe API</span></div>
    <div style="padding:28px">${content}</div>
    <div style="padding:16px 28px;border-top:1px solid #2a2a2a;text-align:center"><p style="margin:0;font-size:12px;color:#666">Transcribe API · frionode.online</p></div>
  </div>
</body></html>`;

const h2 = (t: string) => `<h2 style="margin:0 0 8px;font-size:20px;font-weight:500;color:#fff">${t}</h2>`;
const p = (t: string) => `<p style="margin:0 0 16px;font-size:14px;color:#aaa;line-height:1.6">${t}</p>`;
const pill = (t: string, bg = '#0a3a2a', c = '#4ade80') => `<span style="display:inline-block;background:${bg};color:${c};font-size:12px;font-weight:500;padding:3px 10px;border-radius:20px;margin-bottom:16px">${t}</span>`;
const keyBox = (k: string) => `<div style="background:#000;border:1px solid #2a2a2a;border-radius:8px;padding:14px 18px;font-family:monospace;font-size:13px;color:#4ade80;word-break:break-all;margin-bottom:16px">${k}</div>`;
const otpBox = (o: string) => `<div style="text-align:center;margin:24px 0"><span style="font-size:40px;font-weight:500;letter-spacing:16px;color:#fff">${o}</span></div>`;

export async function sendRegistrationOTP({ to, otp }: { to: string; otp: string }) {
  await sendMail({ to, subject: `${otp} — Email Verification`, html: base(`${pill('✉️ Verify your email', '#1a2a3a', '#60a5fa')}${h2('Verify your email')}${p('Use this code to complete registration. Expires in 10 minutes.')}${otpBox(otp)}${p('If you did not create an account, ignore this email.')}`) });
}

export async function sendWelcome({ to, apiKey }: { to: string; apiKey: string }) {
  await sendMail({ to, subject: 'Welcome — your API key is ready', html: base(`${pill('🎉 Account verified', '#0a3a2a', '#4ade80')}${h2('Welcome!')}${p('Your API key is ready.')}${keyBox(apiKey)}${p('Use: <code style="background:#000;padding:2px 6px;border-radius:4px;color:#4ade80">x-api-key: ${apiKey}</code>')}${p('Free: 10 req/hr. Upgrade anytime.')}`) });
}

export async function sendPasswordResetOTP({ to, otp }: { to: string; otp: string }) {
  await sendMail({ to, subject: `${otp} — Password Reset`, html: base(`${pill('🔑 Reset password', '#2a1a0a', '#fbbf24')}${h2('Password reset')}${p('Use this code to reset your password. Expires in 10 minutes.')}${otpBox(otp)}${p('If you did not request this, ignore it.')}`) });
}

export async function sendPasswordChanged({ to }: { to: string }) {
  await sendMail({ to, subject: 'Password changed', html: base(`${pill('🔒 Updated', '#1a1a2a', '#a78bfa')}${h2('Password changed')}${p('Your password was just updated.')}`) });
}

export async function sendNewKey({ to, apiKey, label }: { to: string; apiKey: string; label: string }) {
  await sendMail({ to, subject: `New API key: ${label}`, html: base(`${pill('🔑 New key', '#0a3a2a', '#4ade80')}${h2('New API key created')}${p(`Label: <strong>${label}</strong>`)}${keyBox(apiKey)}`) });
}

export async function sendKeyRotated({ to, newKey }: { to: string; newKey: string }) {
  await sendMail({ to, subject: 'API key rotated', html: base(`${pill('🔄 Key rotated', '#1a2a3a', '#60a5fa')}${h2('Key rotated')}${p('Old key revoked. New key:')}${keyBox(newKey)}`) });
}

export async function sendUsageWarning({ to, used, limit }: { to: string; used: number; limit: number }) {
  await sendMail({ to, subject: `${used}/${limit} requests used`, html: base(`${pill('⚠️ Usage warning', '#2a1a0a', '#fbbf24')}${h2('Approaching limit')}${p(`<strong>${used} of ${limit}</strong> requests this hour.`)}`) });
}

export async function sendLimitReached({ to, limit }: { to: string; limit: number }) {
  await sendMail({ to, subject: 'Hourly limit reached', html: base(`${pill('🚫 Limit reached', '#2a0a0a', '#f87171')}${h2('Limit reached')}${p(`${limit} requests/hour used. Resets next hour.`)}`) });
}
