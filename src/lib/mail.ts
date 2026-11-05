import "server-only";
import nodemailer from "nodemailer";

export type MailResult = "skickat" | "misslyckades" | "ej_installt";

/** Mejl är valfritt. Utan SMTP_HOST och avsändare går allt annat på sajten som vanligt, och det som skulle mejlats syns bara i portalen. */
export const mailIsConfigured = () => Boolean(process.env.SMTP_HOST && (process.env.MAIL_FROM || process.env.SMTP_USER));

/**
 * Skickar ett textmejl. Kastar aldrig: den som anropar har redan sparat det viktiga och ska bara notera hur det gick. Tidsgränserna gör
 * att en SMTP-server som inte svarar inte blir hängande. Port 587 kräver kryptering, 465 är krypterad från start.
 */
export async function sendMail(mail: { to: string; replyTo?: string; subject: string; text: string }): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const from = process.env.MAIL_FROM || user;
  if (!host || !from || !mail.to) return "ej_installt";
  const port = Number(process.env.SMTP_PORT) || 587;
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    await transport.sendMail({ from, to: mail.to, replyTo: mail.replyTo, subject: mail.subject, text: mail.text });
    return "skickat";
  } catch (err) {
    console.error("[statlin] Mejlet gick inte att skicka:", err instanceof Error ? err.message : err);
    return "misslyckades";
  }
}
