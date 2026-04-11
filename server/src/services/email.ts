import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "");
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@grimoire.app";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sleeved</title>
</head>
<body style="margin:0;padding:0;background:#0e0a06;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0a06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="color:#c9a84c;font-size:18px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;">SLEEVED</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#1a1208;border:1px solid #3a2e1a;border-radius:12px;padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;color:#6b5c3a;font-size:12px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#c9a84c;color:#0e0a06;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;margin-top:24px;letter-spacing:0.1em;text-transform:uppercase;">${text}</a>`;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  const content = `
    <h1 style="margin:0 0 8px;color:#f0e6cc;font-size:20px;font-weight:700;">Verify your email</h1>
    <p style="margin:0 0 4px;color:#a08c5a;font-size:15px;">Thanks for signing up for Sleeved.</p>
    <p style="margin:0;color:#a08c5a;font-size:15px;">Click the button below to verify your account. This link expires in <strong style="color:#c9a84c;">24 hours</strong>.</p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton("Verify email", link)}
    </div>
    <p style="margin:24px 0 0;color:#6b5c3a;font-size:13px;text-align:center;">
      Or copy this link:<br/>
      <span style="color:#a08c5a;word-break:break-all;">${link}</span>
    </p>
  `;
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Sleeved account",
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  const content = `
    <h1 style="margin:0 0 8px;color:#f0e6cc;font-size:20px;font-weight:700;">Reset your password</h1>
    <p style="margin:0;color:#a08c5a;font-size:15px;">We received a request to reset your Sleeved password. Click the button below to choose a new one. This link expires in <strong style="color:#c9a84c;">1 hour</strong>.</p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton("Reset password", link)}
    </div>
    <p style="margin:24px 0 0;color:#6b5c3a;font-size:13px;text-align:center;">
      Or copy this link:<br/>
      <span style="color:#a08c5a;word-break:break-all;">${link}</span>
    </p>
  `;
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your Sleeved password",
    html: baseTemplate(content),
  });
}
