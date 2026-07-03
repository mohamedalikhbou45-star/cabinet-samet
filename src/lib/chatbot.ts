export const CHATBOT_GREETING =
  "Bonjour ! Je suis l'assistant du Cabinet Samet de Comptabilité. Comment puis-je vous aider ?";

const STATUS_ANSWER = "Vous avez 2 documents en cours de traitement.";
const FISCAL_ANSWER =
  "Pour cette question, je vous invite à contacter directement votre comptable.";
const DEFAULT_ANSWER = "Je suis en cours d'activation. Bientôt disponible !";

const STATUS_KEYWORDS = [
  "statut",
  "etat",
  "état",
  "en cours",
  "ou en est",
  "où en est",
  "avancement",
  "traitement",
];

const FISCAL_KEYWORDS = [
  "fiscal",
  "fiscalite",
  "fiscalité",
  "impot",
  "impôt",
  "tva",
  "declaration",
  "déclaration",
  "taxe",
  "cotisation",
];

const DIACRITICS_REGEX = /[̀-ͯ]/g;

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "");
}

/**
 * Réponses préprogrammées du mode démo — remplacées par l'appel à l'API
 * Anthropic dès qu'ANTHROPIC_API_KEY est configurée côté serveur.
 */
export function getDemoResponse(userMessage: string): string {
  const normalized = normalize(userMessage);

  if (STATUS_KEYWORDS.some((k) => normalized.includes(normalize(k)))) {
    return STATUS_ANSWER;
  }
  if (FISCAL_KEYWORDS.some((k) => normalized.includes(normalize(k)))) {
    return FISCAL_ANSWER;
  }
  return DEFAULT_ANSWER;
}
