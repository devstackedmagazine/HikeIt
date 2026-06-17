/**
 * Albanian labels for enum-ish values stored in the DB. Centralized so cards,
 * filters, and detail pages all render the same translations. Unknown keys fall
 * back to the raw value via `labelFor`.
 */
export const difficultyLabels: Record<string, string> = {
  easy: "E lehtë",
  moderate: "E mesme",
  hard: "E vështirë",
  expert: "Ekspert",
};

export const trailTypeLabels: Record<string, string> = {
  loop: "Vajtje-Ardhje",
  out_and_back: "Vajtje-ardhje",
  point_to_point: "Pikë në pikë",
};

export const seasonLabels: Record<string, string> = {
  spring: "Pranverë",
  summer: "Verë",
  autumn: "Vjeshtë",
  winter: "Dimër",
};

export const featureLabels: Record<string, string> = {
  waterfall: "Ujëvarë",
  lake: "Liqen",
  summit: "Majë",
  forest: "Pyll",
  canyon: "Kanion",
  historic: "Historik",
  river: "Lumë",
  cave: "Shpellë",
  village: "Fshat",
  panorama: "Panoramë",
  alpine_meadow: "Livadh alpin",
  ski_resort: "Qendër skijimi",
  picnic: "Piknik",
  family_friendly: "Për familje",
  swimming: "Notim",
  border: "Kufi",
  castle: "Kështjellë",
  city_view: "Pamje qyteti",
  monastery: "Manastir",
};

export const tripStatusLabels: Record<string, string> = {
  draft: "Draft",
  open: "I hapur",
  full: "I plotë",
  in_progress: "Në progres",
  completed: "Përfunduar",
  canceled: "Anuluar",
};

export const registrationStatusLabels: Record<string, string> = {
  pending: "Në pritje",
  confirmed: "Konfirmuar",
  waitlisted: "Lista e pritjes",
  canceled: "Anuluar",
  attended: "Mori pjesë",
  no_show: "Nuk erdhi",
};

export const memberRoleLabels: Record<string, string> = {
  admin: "Administrator",
  organizer: "Organizator",
  member: "Anëtar",
};

export const SEASON_ORDER = ["spring", "summer", "autumn", "winter"] as const;

export function labelFor(
  map: Record<string, string>,
  key: string | null | undefined,
): string {
  if (!key) return "";
  return map[key] ?? key;
}
