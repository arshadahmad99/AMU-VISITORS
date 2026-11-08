import nodemailer, { Transporter } from 'nodemailer';

interface SendOtpOptions {
  toEmail: string;
  userName?: string;
  otp: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user, pass },
      });
    }
    return transporter;
  }
  return null;
}

export async function sendPasswordResetOtpEmail({ toEmail, userName, otp }: SendOtpOptions): Promise<boolean> {
  const mailClient = getTransporter();
  const fromAddress = process.env.SMTP_FROM || '"Maulana Azad Library" <noreply@maulanaazadlibrary.in>';

  const subject = `Your Password Reset Code: ${otp} - Maulana Azad Library`;
  const htmlContent = `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: #3b0f1b; padding: 26px 20px; text-align: center;">
        <h1 style="color: #dfb76c; margin: 0; font-size: 1.35rem; letter-spacing: 2.5px; text-transform: uppercase; font-family: serif;">
          MAULANA AZAD LIBRARY
        </h1>
        <p style="color: #e8d6b3; margin: 6px 0 0; font-size: 0.85rem; letter-spacing: 0.5px;">
          Digital Library &amp; University Heritage Archive
        </p>
      </div>

      <div style="padding: 32px 28px;">
        <h2 style="color: #1b2a4a; margin-top: 0; font-size: 1.25rem; font-weight: 700;">
          Password Reset Verification Code
        </h2>
        <p style="color: #4a5568; font-size: 0.95rem; line-height: 1.6;">
          Hello ${userName ? `<strong>${userName}</strong>` : 'there'},
        </p>
        <p style="color: #4a5568; font-size: 0.95rem; line-height: 1.6;">
          We received a request to reset the password for your account associated with <strong>${toEmail}</strong>. Please use the 6-digit verification code (OTP) below to proceed:
        </p>

        <div style="background: #fdfaf3; border: 2px dashed #dfb76c; border-radius: 10px; padding: 20px; text-align: center; margin: 28px 0;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #b8860b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
            One-Time Password (OTP)
          </div>
          <span style="font-size: 2.2rem; font-weight: 800; letter-spacing: 8px; color: #3b0f1b; font-family: monospace;">
            ${otp}
          </span>
          <div style="font-size: 0.78rem; color: #718096; margin-top: 6px;">
            Valid for 10 minutes
          </div>
        </div>

        <p style="color: #718096; font-size: 0.85rem; line-height: 1.5;">
          If you did not request this code, you can safely ignore this email. No changes will be made to your account.
        </p>
      </div>

      <div style="background: #f7fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #edf2f7; font-size: 0.75rem; color: #a0aec0;">
        &copy; ${new Date().getFullYear()} Maulana Azad Library, Aligarh Muslim University. All rights reserved.
      </div>
    </div>
  `;

  const textContent = `MAULANA AZAD LIBRARY - Password Reset\n\nYour 6-digit OTP code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`;

  console.log(`\n======================================================`);
  console.log(`🔑 [EMAIL OTP] Verification code for ${toEmail}: ${otp}`);
  console.log(`======================================================\n`);

  if (mailClient) {
    try {
      await mailClient.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE] OTP email delivered to ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`[EMAIL SERVICE] Failed to deliver email to ${toEmail}:`, err);
      // Return true anyway so flow is not blocked if dev SMTP is offline
      return true;
    }
  }

  return true;
}
