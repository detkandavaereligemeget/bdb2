import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import nodemailer from "nodemailer";
import path from "path";

interface ContactFormPayload {
  navn?: unknown;
  email?: unknown;
  virksomhed?: unknown;
  program?: unknown;
  hasBackup?: unknown;
  backupDetails?: {
    frekvens?: unknown;
    ekstern?: unknown;
  };
  hasEfaktura?: unknown;
  efakturaType?: unknown;
  hasBank?: unknown;
  hasSaft?: unknown;
  fritekst?: unknown;
  humanCheck?: unknown;
}

const DEFAULT_RECIPIENT = "info@behold-dit-bogforingsprogram.dk";

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asTrimmedString(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function formatBoolean(value: unknown): string {
  return value === true ? "Ja" : "Nej";
}

function buildEmailContent(payload: ContactFormPayload) {
  const navn = sanitizeHeader(asTrimmedString(payload.navn, 200));
  const email = sanitizeHeader(asTrimmedString(payload.email, 200));
  const virksomhed = sanitizeHeader(asTrimmedString(payload.virksomhed, 200));
  const program = asTrimmedString(payload.program, 200);
  const hasBackup = payload.hasBackup === true;
  const backupFrekvens = asTrimmedString(payload.backupDetails?.frekvens, 200);
  const backupEkstern = payload.backupDetails?.ekstern === true;
  const hasEfaktura = payload.hasEfaktura === true;
  const efakturaType = asTrimmedString(payload.efakturaType, 100) || "OIOUBL/Nemhandel";
  const hasBank = payload.hasBank === true;
  const hasSaft = payload.hasSaft === true;
  const fritekst = asTrimmedString(payload.fritekst, 4000);
  const timestamp = new Intl.DateTimeFormat("da-DK", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Copenhagen",
  }).format(new Date());

  const subject = sanitizeHeader(
    `Ny henvendelse fra ${virksomhed} (${navn}) — Behold dit bogføringsprogram`
  );

  const lines = [
    "Ny henvendelse via kontaktformularen på Behold dit bogføringsprogram",
    "================================================================",
    `Tidspunkt: ${timestamp}`,
    `Navn: ${navn}`,
    `E-mail: ${email}`,
    `Virksomhed og CVR-nr.: ${virksomhed}`,
    `Bogføringsprogram: ${program}`,
    "",
    "Nuværende bogføringsprogram:",
    `- Tager løbende backup: ${formatBoolean(hasBackup)}`,
    ...(hasBackup
      ? [
          `  • Backup-frekvens: ${backupFrekvens || "Ikke oplyst"}`,
          `  • Sikkerhedskopi hos ekstern tredjepart i EU/EØS: ${formatBoolean(backupEkstern)}`,
        ]
      : []),
    `- Har e-faktura-funktion: ${formatBoolean(hasEfaktura)}${
      hasEfaktura ? ` (${efakturaType})` : ""
    }`,
    `- Har bankafstemningsfunktion: ${formatBoolean(hasBank)}`,
    `- Har SAF-T-fil: ${formatBoolean(hasSaft)}`,
    "",
    "Spørgsmål / kommentarer:",
    fritekst || "(Ingen spørgsmål angivet)",
  ];

  const text = lines.join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 640px; margin: 0 auto; line-height: 1.5;">
      <h2 style="color: #1d4ed8; margin-bottom: 4px;">Ny henvendelse fra kontaktformularen</h2>
      <p style="color: #64748b; font-size: 13px; margin-top: 0;">Modtaget ${escapeHtml(timestamp)}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 200px;">Navn</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(navn)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">E-mail</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Virksomhed & CVR-nr.</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(virksomhed)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Bogføringsprogram</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(program)}</td>
        </tr>
      </table>

      <h3 style="font-size: 15px; margin-bottom: 8px;">Nuværende bogføringsprogram</h3>
      <ul style="padding-left: 20px; margin-top: 0;">
        <li><strong>Tager løbende backup:</strong> ${formatBoolean(hasBackup)}
          ${
            hasBackup
              ? `<ul>
                  <li>Frekvens: ${escapeHtml(backupFrekvens || "Ikke oplyst")}</li>
                  <li>Ekstern tredjepart i EU/EØS: ${formatBoolean(backupEkstern)}</li>
                </ul>`
              : ""
          }
        </li>
        <li><strong>Har e-faktura-funktion:</strong> ${formatBoolean(hasEfaktura)}${
          hasEfaktura ? ` (${escapeHtml(efakturaType)})` : ""
        }</li>
        <li><strong>Har bankafstemningsfunktion:</strong> ${formatBoolean(hasBank)}</li>
        <li><strong>Har SAF-T-fil:</strong> ${formatBoolean(hasSaft)}</li>
      </ul>

      <h3 style="font-size: 15px; margin-bottom: 8px;">Spørgsmål / kommentarer</h3>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; white-space: pre-wrap;">${escapeHtml(
        fritekst || "(Ingen spørgsmål angivet)"
      )}</div>
    </div>
  `;

  return { navn, email, virksomhed, program, subject, text, html };
}

function getGmailCredentials(): { user: string; pass: string } | null {
  const pass = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASSWORD ||
    process.env.APP_PASSWORD ||
    (!process.env.SMTP_HOST ? process.env.SMTP_PASS : "") ||
    ""
  ).replace(/\s+/g, "");

  if (!pass) return null;

  const user = (
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    "dennisllaursen@gmail.com"
  ).trim();

  return { user, pass };
}

function getEmailProviderName(): string | null {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.SMTP_HOST) return "smtp";
  if (getGmailCredentials()) return "gmail";
  return null;
}

async function sendContactEmail(params: {
  recipient: string;
  replyToName: string;
  replyToEmail: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const { recipient, replyToName, replyToEmail, subject, text, html } = params;
  const replyTo = `"${replyToName.replace(/"/g, "")}" <${replyToEmail}>`;

  if (process.env.RESEND_API_KEY) {
    const from =
      process.env.SMTP_FROM ||
      "Behold dit bogføringsprogram <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: replyToEmail,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Resend API error (${response.status}): ${details}`);
    }
    return;
  }

  if (process.env.SENDGRID_API_KEY) {
    const fromEmail = process.env.SMTP_FROM || recipient;
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipient }] }],
        from: { email: fromEmail, name: "Behold dit bogføringsprogram" },
        reply_to: { email: replyToEmail, name: replyToName },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`SendGrid API error (${response.status}): ${details}`);
    }
    return;
  }

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.toLowerCase() === "true"
      : port === 465;

    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth,
    });

    const from =
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER
        ? `"Behold dit bogføringsprogram" <${process.env.SMTP_USER}>`
        : `"Behold dit bogføringsprogram" <${recipient}>`);

    await transporter.sendMail({
      from,
      to: recipient,
      replyTo,
      subject,
      text,
      html,
    });
    return;
  }

  const gmailCreds = getGmailCredentials();
  if (gmailCreds) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailCreds.user,
        pass: gmailCreds.pass,
      },
    });

    const from =
      process.env.SMTP_FROM ||
      `"Behold dit bogføringsprogram" <${gmailCreds.user}>`;

    await transporter.sendMail({
      from,
      to: recipient,
      replyTo,
      subject,
      text,
      html,
    });
    return;
  }

  throw new Error("EMAIL_NOT_CONFIGURED");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "64kb" }));

  const allowedOrigins = new Set([
    "https://www.behold-dit-bogforingsprogram.dk",
    "https://behold-dit-bogforingsprogram.dk",
  ]);
  app.use("/api", (req: Request, res: Response, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/contact", async (req: Request, res: Response) => {
    const payload = (req.body || {}) as ContactFormPayload;
    const { navn, email, virksomhed, program, subject, text, html } =
      buildEmailContent(payload);

    if (!navn || !email || !virksomhed || !program) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Udfyld venligst alle påkrævede felter (navn, e-mail, virksomhed og bogføringsprogram).",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        code: "INVALID_EMAIL",
        error: "Indtast venligst en gyldig e-mailadresse.",
      });
      return;
    }

    const humanCheck = asTrimmedString(payload.humanCheck, 50).toLowerCase();
    if (humanCheck !== "8" && humanCheck !== "menneske") {
      res.status(400).json({
        success: false,
        code: "HUMAN_CHECK_FAILED",
        error: "Sikkerhedstjekket er ikke korrekt (skriv 8).",
      });
      return;
    }

    const recipient = sanitizeHeader(
      process.env.CONTACT_TO_EMAIL || DEFAULT_RECIPIENT
    );

    if (!getEmailProviderName()) {
      console.error(
        "[contact] Email delivery failed: no mail transport configured. Configure SMTP_HOST/SMTP_USER/SMTP_PASS, GMAIL_USER/GMAIL_APP_PASSWORD, RESEND_API_KEY, or SENDGRID_API_KEY."
      );
      res.status(503).json({
        success: false,
        code: "EMAIL_NOT_CONFIGURED",
        error:
          "Automatisk mailafsendelse er ikke konfigureret på serveren endnu. Send venligst din besked direkte til info@behold-dit-bogforingsprogram.dk.",
      });
      return;
    }

    try {
      await sendContactEmail({
        recipient,
        replyToName: navn,
        replyToEmail: email,
        subject,
        text,
        html,
      });

      res.json({
        success: true,
        message:
          "Tak! Din besked er sendt. Vi vender tilbage snarest muligt. Hav en dejlig dag!",
      });
    } catch (error) {
      console.error("[contact] Failed to send email:", error);
      res.status(502).json({
        success: false,
        code: "EMAIL_SEND_FAILED",
        error:
          "Kunne ikke afsende e-mailen automatisk lige nu. Send venligst din besked direkte til info@behold-dit-bogforingsprogram.dk.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
