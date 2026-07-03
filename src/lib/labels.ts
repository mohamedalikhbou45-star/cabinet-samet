export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  LEASING: "Leasing",
  RELEVE_BANCAIRE: "Relevé bancaire",
  AUTRE: "Autre",
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "FACTURE", label: "Facture" },
  { value: "LEASING", label: "Leasing" },
  { value: "RELEVE_BANCAIRE", label: "Relevé bancaire" },
  { value: "AUTRE", label: "Autre" },
];

export const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TRAITE: "Traité",
};

export const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800 ring-amber-600/20",
  EN_TRAITEMENT: "bg-blue-100 text-blue-800 ring-blue-600/20",
  TRAITE: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
};

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
