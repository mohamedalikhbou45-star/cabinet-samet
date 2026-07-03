import nodemailer from "nodemailer";

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TRAITE: "Traité",
};

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

function shell(bodyHtml: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #1a1a1a;">
      <div style="background:#0a0a0a; padding:24px; border-radius:8px 8px 0 0;">
        <h1 style="color:#fff; font-size:16px; margin:0;">
          Cabinet Samet <span style="color:#86BC25;">de Comptabilité</span>
        </h1>
      </div>
      <div style="border:1px solid #eee; border-top:none; padding:28px; border-radius:0 0 8px 8px;">
        ${bodyHtml}
        <p style="color:#999; font-size:12px; margin-top:32px;">
          Ceci est un message automatique, merci de ne pas y répondre.
        </p>
      </div>
    </div>
  `;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block; background:#86BC25; color:#0a0a0a; font-weight:bold; text-decoration:none; padding:12px 22px; border-radius:4px;">${label}</a>`;
}

/** Envoi générique — trace dans la console si aucun SMTP n'est configuré. */
async function send(to: string, subject: string, html: string, logLine: string) {
  const from =
    process.env.SMTP_FROM ??
    "Cabinet Samet de Comptabilité <no-reply@cabinet-samet.fr>";
  const transport = getTransport();

  if (!transport) {
    console.log(`\n[EMAIL SIMULÉ] À: ${to}\nObjet: ${subject}\n${logLine}\n`);
    return;
  }

  try {
    await transport.sendMail({ from, to, subject, html });
  } catch (error) {
    console.error("Échec de l'envoi de l'email :", error);
  }
}

export async function sendStatusChangeEmail(params: {
  to: string;
  clientName: string;
  documentName: string;
  status: string;
}) {
  const statusLabel = STATUS_LABELS[params.status] ?? params.status;
  const subject = `Cabinet Samet — Mise à jour de votre document : ${statusLabel}`;
  const html = shell(`
    <p>Bonjour ${params.clientName},</p>
    <p>Le statut de votre document <strong>${params.documentName}</strong> a été mis à jour :</p>
    <p style="font-size:18px;"><strong>${statusLabel}</strong></p>
    <p>Vous pouvez consulter le détail depuis votre espace client.</p>
  `);
  await send(params.to, subject, html, `Statut: ${statusLabel} — Document: ${params.documentName}`);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const subject = "Cabinet Samet — Réinitialisation de votre mot de passe";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>.</p>
    <p style="margin:24px 0;">${button(params.resetUrl, "Réinitialiser mon mot de passe")}</p>
    <p style="font-size:13px; color:#666;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.</p>
  `);
  await send(params.to, subject, html, `Lien de réinitialisation : ${params.resetUrl}`);
}

export async function sendPasswordChangedEmail(params: { to: string; name: string }) {
  const subject = "Cabinet Samet — Votre mot de passe a été modifié";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Nous vous confirmons que votre mot de passe a bien été modifié.</p>
    <p style="font-size:13px; color:#666;">Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement le cabinet.</p>
  `);
  await send(params.to, subject, html, "Confirmation de changement de mot de passe.");
}

export async function sendAccountLockedEmail(params: { to: string; name: string }) {
  const subject = "Cabinet Samet — Votre compte a été bloqué";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Pour votre sécurité, votre compte a été <strong>bloqué</strong> à la suite de plusieurs tentatives de connexion échouées.</p>
    <p>Contactez le cabinet ou attendez l'intervention d'un administrateur pour le débloquer.</p>
  `);
  await send(params.to, subject, html, "Compte bloqué (tentatives de connexion échouées).");
}

export async function sendAdminSuspiciousLoginEmail(params: {
  to: string;
  adminName: string;
  attempts: number;
  ip: string;
}) {
  const subject = "[Alerte sécurité] Tentatives de connexion admin suspectes";
  const html = shell(`
    <p>Alerte de sécurité :</p>
    <p>Le compte administrateur <strong>${params.adminName}</strong> a fait l'objet de <strong>${params.attempts} tentatives de connexion échouées</strong>.</p>
    <p>Dernière adresse IP : <strong>${params.ip}</strong></p>
    <p>Si vous n'êtes pas à l'origine de ces tentatives, changez votre mot de passe et vérifiez l'accès au compte.</p>
  `);
  await send(
    params.to,
    subject,
    html,
    `Tentatives admin suspectes : ${params.attempts} échecs (IP ${params.ip})`
  );
}

export async function sendAdminLockAlertEmail(params: {
  to: string;
  clientName: string;
  clientEmail: string;
}) {
  const subject = "[Alerte sécurité] Compte client bloqué";
  const html = shell(`
    <p>Alerte de sécurité :</p>
    <p>Le compte du client <strong>${params.clientName}</strong> (${params.clientEmail}) vient d'être bloqué après 5 tentatives de connexion échouées.</p>
    <p>Vous pouvez le débloquer depuis l'espace d'administration.</p>
  `);
  await send(params.to, subject, html, `Compte bloqué : ${params.clientName} (${params.clientEmail})`);
}
