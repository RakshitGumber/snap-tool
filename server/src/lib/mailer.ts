import nodemailer from "nodemailer";

import { env } from "../env";

type TransactionalEmail = {
  to: string;
  subject: string;
  heading: string;
  body: string;
  url: string;
  buttonLabel: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER || env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    })
  : null;

const renderEmail = ({
  heading,
  body,
  url,
  buttonLabel,
}: Omit<TransactionalEmail, "to" | "subject">) => {
  const text = `${heading}\n\n${body}\n\n${url}`;

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h1 style="font-size: 24px; margin: 0 0 16px;">${escapeHtml(heading)}</h1>
      <p style="margin: 0 0 16px;">${escapeHtml(body)}</p>
      <p style="margin: 0 0 24px;">
        <a href="${escapeHtml(url)}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 999px;">
          ${escapeHtml(buttonLabel)}
        </a>
      </p>
      <p style="margin: 0; word-break: break-all; color: #6b7280;">${escapeHtml(url)}</p>
    </div>
  `;

  return { html, text };
};

export const sendTransactionalEmail = async (email: TransactionalEmail) => {
  const content = renderEmail(email);

  if (transport) {
    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      html: content.html,
      text: content.text,
    });
    return;
  }

  console.info(
    `[mail] SMTP not configured, skipping email to ${email.to}: ${email.subject}`,
  );
  console.info(content.text);
};
