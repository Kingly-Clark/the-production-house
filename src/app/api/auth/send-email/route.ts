// ContentMill — Supabase Auth Email Hook
// Intercepts Supabase auth emails and sends styled versions via Resend
// Register this endpoint in: Supabase Dashboard → Authentication → Hooks → Send Email Hook
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/newsletter/resend-client';

interface EmailHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'email_change' | 'invite' | 'magiclink';
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function buildVerificationUrl(payload: EmailHookPayload): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const { token_hash, email_action_type, redirect_to } = payload.email_data;
  const params = new URLSearchParams({
    token: token_hash,
    type: email_action_type,
    redirect_to,
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

function buildSignupEmail(payload: EmailHookPayload, verificationUrl: string): string {
  const name = payload.user.user_metadata?.full_name || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your ContentMill account</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#1e40af 50%,#7c3aed 100%);padding:40px 48px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:20px;font-weight:bold;">C</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ContentMill</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:28px;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;">Confirm your email address</h1>
                    <p style="margin:10px 0 0;color:#94a3b8;font-size:15px;">One click and you're ready to build.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;background-color:#ffffff;">
              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;color:#334155;font-size:16px;line-height:1.6;">
                Thanks for signing up for ContentMill! You're one step away from automating your content empire. Click the button below to verify your email address and activate your account.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:8px 0 36px;">
                    <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.2px;">
                      Confirm Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding-top:28px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link into your browser:</p>
                    <p style="margin:0;word-break:break-all;color:#3b82f6;font-size:12px;">${verificationUrl}</p>
                  </td>
                </tr>
              </table>

              <!-- What's next -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;">
                <tr>
                  <td style="background-color:#f8fafc;border-radius:8px;padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#1e293b;font-size:14px;font-weight:600;">What happens next?</p>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">✓&nbsp; Confirm your email → get instant access</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">✓&nbsp; Add your content sources in minutes</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">✓&nbsp; AI rewrites and publishes automatically</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
                If you didn't create a ContentMill account, you can safely ignore this email.
                This link expires in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 ContentMill. All rights reserved.</p>
              <p style="margin:6px 0 0;color:#cbd5e1;font-size:12px;">
                <a href="https://contentmill.co" style="color:#3b82f6;text-decoration:none;">contentmill.co</a>
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

function buildPasswordResetEmail(payload: EmailHookPayload, verificationUrl: string): string {
  const name = payload.user.user_metadata?.full_name || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your ContentMill password</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#1e40af 50%,#7c3aed 100%);padding:40px 48px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:20px;font-weight:bold;">C</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ContentMill</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:28px;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;">Reset your password</h1>
                    <p style="margin:10px 0 0;color:#94a3b8;font-size:15px;">We received a request to reset your password.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;background-color:#ffffff;">
              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;color:#334155;font-size:16px;line-height:1.6;">
                Click the button below to set a new password. This link will expire in 1 hour.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:8px 0 36px;">
                    <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.2px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding-top:28px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link into your browser:</p>
                    <p style="margin:0;word-break:break-all;color:#3b82f6;font-size:12px;">${verificationUrl}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password won't change until you click the link above.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 ContentMill. All rights reserved.</p>
              <p style="margin:6px 0 0;color:#cbd5e1;font-size:12px;">
                <a href="https://contentmill.co" style="color:#3b82f6;text-decoration:none;">contentmill.co</a>
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

function buildMagicLinkEmail(payload: EmailHookPayload, verificationUrl: string): string {
  const name = payload.user.user_metadata?.full_name || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ContentMill magic link</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#1e40af 50%,#7c3aed 100%);padding:40px 48px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:20px;font-weight:bold;">C</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ContentMill</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:28px;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;">Your magic link</h1>
                    <p style="margin:10px 0 0;color:#94a3b8;font-size:15px;">Click below to sign in instantly.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:48px;background-color:#ffffff;">
              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;color:#334155;font-size:16px;line-height:1.6;">
                Click the button below to sign in to ContentMill. This link expires in 1 hour and can only be used once.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:8px 0 36px;">
                    <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.2px;">
                      Sign in to ContentMill →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 ContentMill. All rights reserved.</p>
              <p style="margin:6px 0 0;color:#cbd5e1;font-size:12px;">
                <a href="https://contentmill.co" style="color:#3b82f6;text-decoration:none;">contentmill.co</a>
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

async function verifyHookSignature(request: NextRequest, rawBody: string): Promise<boolean> {
  const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!hookSecret) return true; // Skip verification if no secret configured

  // Supabase uses Standard Webhooks format: v1,whsec_<base64-encoded-secret>
  const secretBase64 = hookSecret.startsWith('v1,whsec_')
    ? hookSecret.slice('v1,whsec_'.length)
    : hookSecret;

  const msgId = request.headers.get('webhook-id') ?? '';
  const msgTimestamp = request.headers.get('webhook-timestamp') ?? '';
  const msgSignature = request.headers.get('webhook-signature') ?? '';

  if (!msgId || !msgTimestamp || !msgSignature) return false;

  // Reject timestamps older than 5 minutes
  const timestamp = parseInt(msgTimestamp, 10);
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`;
  const secretBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const computedSig = 'v1,' + btoa(String.fromCharCode(...new Uint8Array(signature)));

  // The header may contain multiple signatures (space-separated)
  const signatures = msgSignature.split(' ');
  return signatures.some((sig) => sig === computedSig);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const isValid = await verifyHookSignature(request, rawBody);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: EmailHookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { user, email_data } = payload;
  const verificationUrl = buildVerificationUrl(payload);

  let subject: string;
  let html: string;

  switch (email_data.email_action_type) {
    case 'signup':
      subject = 'Confirm your ContentMill account';
      html = buildSignupEmail(payload, verificationUrl);
      break;
    case 'recovery':
      subject = 'Reset your ContentMill password';
      html = buildPasswordResetEmail(payload, verificationUrl);
      break;
    case 'magiclink':
      subject = 'Your ContentMill magic link';
      html = buildMagicLinkEmail(payload, verificationUrl);
      break;
    case 'invite':
      subject = "You've been invited to ContentMill";
      html = buildSignupEmail(payload, verificationUrl);
      break;
    default:
      subject = 'Action required for your ContentMill account';
      html = buildSignupEmail(payload, verificationUrl);
  }

  try {
    await sendEmail({
      to: user.email,
      from: 'noreply@contentmill.co',
      subject,
      html,
    });

    return NextResponse.json({});
  } catch (error) {
    console.error('Failed to send auth email via Resend:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
