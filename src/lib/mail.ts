import { Resend } from "resend";

const NAVY = "#0B2545";
const GREEN = "#86BC25";

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TRAITE: "Traité",
};

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function fromAddress() {
  const email = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  return `Cabinet Samet de Comptabilité <${email}>`;
}

/** Gabarit HTML commun à tous les emails : en-tête bleu marine, logo CS vert. */
function shell(bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 560px; margin: auto; color: #1a1a1a; background:#f4f5f7;">
      <div style="background:${NAVY}; padding:28px 28px 24px; border-radius:8px 8px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${GREEN}; width:36px; height:36px; border-radius:6px; text-align:center; vertical-align:middle;">
              <span style="color:${NAVY}; font-weight:800; font-size:14px; font-family: -apple-system, Arial, sans-serif;">CS</span>
            </td>
            <td style="padding-left:12px;">
              <span style="color:#fff; font-size:15px; font-weight:700;">Cabinet Samet</span>
              <span style="color:#c8d3e0; font-size:15px; font-weight:400;"> de Comptabilité</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-top:none; padding:28px; border-radius:0 0 8px 8px; font-size:14px; line-height:1.6;">
        ${bodyHtml}
        <p style="color:#94a3b8; font-size:12px; margin-top:32px; border-top:1px solid #eef0f3; padding-top:16px;">
          Ceci est un message automatique, merci de ne pas y répondre.
        </p>
      </div>
    </div>
  `;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block; background:${GREEN}; color:${NAVY}; font-weight:700; text-decoration:none; padding:12px 24px; border-radius:4px; font-size:14px;">${label}</a>`;
}

function badge(label: string) {
  return `<span style="display:inline-block; background:#fef3c7; color:#92400e; font-weight:700; font-size:12px; padding:4px 10px; border-radius:999px;">${label}</span>`;
}

/**
 * Vrai en mode sandbox Resend (expéditeur onboarding@resend.dev, aucun
 * domaine vérifié) : seule l'adresse propriétaire du compte peut recevoir
 * des emails. Toute autre destination est rejetée avec ce type d'erreur.
 */
function isSandboxRestriction(error: unknown): boolean {
  const e = error as { statusCode?: number; name?: string; message?: string } | undefined;
  return Boolean(
    e &&
      e.statusCode === 403 &&
      e.name === "validation_error" &&
      typeof e.message === "string" &&
      e.message.includes("own email address")
  );
}

/**
 * Repli développement : quand Resend refuse l'envoi à cause de la
 * restriction sandbox, on redirige l'email vers une boîte de test (au lieu
 * de le perdre silencieusement) pour pouvoir vérifier son rendu. Désactivable
 * via EMAIL_DEV_FALLBACK=false — à couper une fois un domaine vérifié.
 */
function devFallbackAddress(): string | null {
  if (process.env.EMAIL_DEV_FALLBACK === "false") return null;
  return process.env.ADMIN_NOTIFICATION_EMAIL?.split(",")[0]?.trim() || null;
}

async function attemptSend(to: string, subject: string, html: string) {
  return resendClient!.emails.send({ from: fromAddress(), to, subject, html });
}

/** Envoi via Resend — trace dans la console si RESEND_API_KEY est absente. */
async function send(to: string, subject: string, html: string, logLine: string) {
  if (!resendClient) {
    console.log(`\n[EMAIL SIMULÉ] À: ${to}\nObjet: ${subject}\n${logLine}\n`);
    return { ok: false, simulated: true as const };
  }

  try {
    const result = await attemptSend(to, subject, html);

    if (result.error) {
      const fallback = devFallbackAddress();
      if (isSandboxRestriction(result.error) && fallback && fallback !== to) {
        console.warn(
          `[RESEND] Sandbox : envoi à ${to} refusé, redirection vers ${fallback} (aperçu de test).`
        );
        const retry = await attemptSend(
          fallback,
          `[Aperçu — destiné à ${to}] ${subject}`,
          `<p style="background:#fef3c7;color:#92400e;padding:10px 14px;border-radius:4px;font-size:13px;margin-bottom:16px;">
             ⚠️ Sandbox Resend : cet email était destiné à <strong>${to}</strong>. Vérifiez un domaine sur resend.com/domains pour l'envoyer réellement à ce destinataire.
           </p>${html}`
        );
        if (retry.error) {
          console.error(`[RESEND] Échec de la redirection vers ${fallback} :`, retry.error);
          return { ok: false, error: retry.error };
        }
        console.log(`[RESEND] Aperçu envoyé à ${fallback} (id=${retry.data?.id}) — ${subject}`);
        return { ok: true, id: retry.data?.id, redirected: true as const };
      }

      console.error(`[RESEND] Échec envoi à ${to} :`, result.error);
      return { ok: false, error: result.error };
    }

    console.log(`[RESEND] Email envoyé à ${to} (id=${result.data?.id}) — ${subject}`);
    return { ok: true, id: result.data?.id };
  } catch (error) {
    console.error(`[RESEND] Exception envoi à ${to} :`, error);
    return { ok: false, error };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Inscription client → email de bienvenue
// ─────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(params: { to: string; name: string }) {
  const subject = "Bienvenue au Cabinet Samet de Comptabilité";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Votre espace client <strong>Cabinet Samet de Comptabilité</strong> a bien été créé. Vous pouvez dès à présent déposer vos documents (factures, leasing, relevés bancaires) et suivre leur traitement.</p>
    <p style="margin:24px 0;">${button(`${base}/login`, "Accéder à mon espace")}</p>
    <p style="font-size:13px; color:#666;">Bienvenue parmi nos clients !</p>
  `);
  return send(params.to, subject, html, `Bienvenue ${params.name}.`);
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Dépôt de document → confirmation au client
// ─────────────────────────────────────────────────────────────────────────
export async function sendDocumentUploadConfirmationEmail(params: {
  to: string;
  clientName: string;
  documentName: string;
}) {
  const subject = "Document bien reçu — Cabinet Samet de Comptabilité";
  const html = shell(`
    <p>Bonjour ${params.clientName},</p>
    <p>Nous avons bien reçu votre document :</p>
    <p style="font-size:16px;"><strong>${params.documentName}</strong></p>
    <p>${badge("En attente")}</p>
    <p style="margin-top:16px;">Notre équipe va le traiter prochainement. Vous serez notifié par email à chaque changement de statut.</p>
  `);
  return send(
    params.to,
    subject,
    html,
    `Document reçu : ${params.documentName}.`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Changement de statut → notification au client
// ─────────────────────────────────────────────────────────────────────────
export async function sendStatusChangeEmail(params: {
  to: string;
  clientName: string;
  documentName: string;
  status: string;
}) {
  const statusLabel = STATUS_LABELS[params.status] ?? params.status;
  const subject = `Mise à jour de votre document : ${statusLabel}`;
  const html = shell(`
    <p>Bonjour ${params.clientName},</p>
    <p>Le statut de votre document <strong>${params.documentName}</strong> a été mis à jour :</p>
    <p style="font-size:18px;"><strong>${statusLabel}</strong></p>
    <p>Vous pouvez consulter le détail depuis votre espace client.</p>
  `);
  return send(params.to, subject, html, `Statut: ${statusLabel} — Document: ${params.documentName}`);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Mot de passe oublié → lien de réinitialisation
// ─────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const subject = "Réinitialisation de votre mot de passe";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>.</p>
    <p style="margin:24px 0;">${button(params.resetUrl, "Réinitialiser mon mot de passe")}</p>
    <p style="font-size:13px; color:#666;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.</p>
  `);
  return send(params.to, subject, html, `Lien de réinitialisation : ${params.resetUrl}`);
}

export async function sendPasswordChangedEmail(params: { to: string; name: string }) {
  const subject = "Votre mot de passe a été modifié";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Nous vous confirmons que votre mot de passe a bien été modifié.</p>
    <p style="font-size:13px; color:#666;">Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement le cabinet.</p>
  `);
  return send(params.to, subject, html, "Confirmation de changement de mot de passe.");
}

// ─────────────────────────────────────────────────────────────────────────
// 4bis. Double authentification → code de connexion à 6 chiffres
// ─────────────────────────────────────────────────────────────────────────
export async function sendTwoFactorCodeEmail(params: {
  to: string;
  name: string;
  code: string;
}) {
  const subject = "Votre code de connexion Cabinet Samet";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Voici votre code de connexion à usage unique :</p>
    <p style="margin:28px 0; text-align:center;">
      <span style="display:inline-block; background:#f4f5f7; border:1px solid #e5e7eb; border-radius:8px; padding:16px 28px; font-size:32px; font-weight:800; letter-spacing:8px; color:${NAVY};">
        ${params.code}
      </span>
    </p>
    <p style="font-size:13px; color:#666;">Ce code expire dans <strong>10 minutes</strong>.</p>
    <p style="font-size:13px; color:#666;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
  `);
  return send(params.to, subject, html, `Code de connexion : ${params.code}`);
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Compte verrouillé → alerte au client
// ─────────────────────────────────────────────────────────────────────────
export async function sendAccountLockedEmail(params: { to: string; name: string }) {
  const subject = "🔒 Votre compte a été bloqué";
  const html = shell(`
    <p>Bonjour ${params.name},</p>
    <p>Pour votre sécurité, votre compte a été <strong>bloqué</strong> à la suite de plusieurs tentatives de connexion échouées.</p>
    <p>Contactez le cabinet ou attendez l'intervention d'un administrateur pour le débloquer.</p>
  `);
  return send(params.to, subject, html, "Compte bloqué (tentatives de connexion échouées).");
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Message admin → notification au client
// ─────────────────────────────────────────────────────────────────────────
export async function sendAdminMessageNotificationEmail(params: {
  to: string;
  clientName: string;
  messageBody: string;
}) {
  const subject = "Nouveau message du Cabinet Samet de Comptabilité";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = shell(`
    <p>Bonjour ${params.clientName},</p>
    <p>Vous avez reçu un nouveau message de votre cabinet :</p>
    <p style="background:#f4f5f7; border-left:3px solid ${GREEN}; padding:12px 16px; border-radius:4px; font-style:italic;">${params.messageBody}</p>
    <p style="margin:24px 0;">${button(`${base}/dashboard`, "Voir dans mon espace")}</p>
  `);
  return send(params.to, subject, html, `Message reçu : ${params.messageBody}`);
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Nouveau client inscrit → alerte à l'admin
// ─────────────────────────────────────────────────────────────────────────
export async function sendAdminNewClientEmail(params: {
  to: string;
  clientName: string;
  clientEmail: string;
}) {
  const subject = "Nouveau client inscrit";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = shell(`
    <p>Un nouveau client vient de créer un compte :</p>
    <p><strong>${params.clientName}</strong> — ${params.clientEmail}</p>
    <p style="margin:24px 0;">${button(`${base}/admin/clients`, "Voir les clients")}</p>
  `);
  return send(
    params.to,
    subject,
    html,
    `Nouveau client : ${params.clientName} (${params.clientEmail})`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Document reçu → alerte à l'admin
// ─────────────────────────────────────────────────────────────────────────
export async function sendAdminNewDocumentEmail(params: {
  to: string;
  clientName: string;
  documentName: string;
}) {
  const subject = "Nouveau document reçu";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = shell(`
    <p>Un nouveau document vient d'être déposé :</p>
    <p><strong>${params.documentName}</strong></p>
    <p>Déposé par : ${params.clientName}</p>
    <p style="margin:24px 0;">${button(`${base}/admin/documents`, "Voir les documents")}</p>
  `);
  return send(
    params.to,
    subject,
    html,
    `Document reçu de ${params.clientName} : ${params.documentName}`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 8bis. Réponse d'un client à un message → alerte à l'admin
// ─────────────────────────────────────────────────────────────────────────
export async function sendAdminClientReplyEmail(params: {
  to: string;
  clientName: string;
  messageBody: string;
}) {
  const subject = "Nouvelle réponse client";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = shell(`
    <p><strong>${params.clientName}</strong> a répondu à un message :</p>
    <p style="background:#f4f5f7; border-left:3px solid ${GREEN}; padding:12px 16px; border-radius:4px; font-style:italic;">${params.messageBody}</p>
    <p style="margin:24px 0;">${button(`${base}/admin/messages`, "Voir les messages")}</p>
  `);
  return send(
    params.to,
    subject,
    html,
    `Réponse de ${params.clientName} : ${params.messageBody}`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Tentative suspecte de connexion (admin) → alerte à l'admin
// ─────────────────────────────────────────────────────────────────────────
export async function sendAdminSuspiciousLoginEmail(params: {
  to: string;
  adminName: string;
  attempts: number;
  ip: string;
}) {
  const subject = "🔒 Tentatives de connexion admin suspectes";
  const html = shell(`
    <p>Alerte de sécurité :</p>
    <p>Le compte administrateur <strong>${params.adminName}</strong> a fait l'objet de <strong>${params.attempts} tentatives de connexion échouées</strong>.</p>
    <p>Dernière adresse IP : <strong>${params.ip}</strong></p>
    <p>Si vous n'êtes pas à l'origine de ces tentatives, changez votre mot de passe et vérifiez l'accès au compte.</p>
  `);
  return send(
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
  const subject = "🔒 Compte client bloqué";
  const html = shell(`
    <p>Alerte de sécurité :</p>
    <p>Le compte du client <strong>${params.clientName}</strong> (${params.clientEmail}) vient d'être bloqué après 5 tentatives de connexion échouées.</p>
    <p>Vous pouvez le débloquer depuis l'espace d'administration.</p>
  `);
  return send(params.to, subject, html, `Compte bloqué : ${params.clientName} (${params.clientEmail})`);
}
