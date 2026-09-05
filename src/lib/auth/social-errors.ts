/**
 * Albanian copy for Better Auth's social sign-in / account-linking error
 * codes. Shared by `/social-login-error` (sign-in time, unauthenticated) and
 * the profile page's "Lidh Google/Facebook" flow (link time, authenticated) —
 * both land on the same `?error=<code>` shape via `errorCallbackURL`.
 *
 * Account linking is deliberately explicit-only (see `src/lib/auth/index.ts`
 * and `linkSocial` usage) — Better Auth refuses to auto-link on a matching
 * email, which is exactly what produces `account_not_linked` below.
 */

interface SocialErrorCopy {
  title: string;
  message: string;
}

const SOCIAL_ERROR_COPY: Record<string, SocialErrorCopy> = {
  // Thrown at sign-in when a verified account with this email already
  // exists (email/password or another provider) — the case this file exists
  // to handle.
  account_not_linked: {
    title: "Llogaria ekziston tashmë",
    message:
      "Një llogari me këtë email ekziston tashmë në HikeIt — e krijuar me email/fjalëkalim ose me një ofrues tjetër social. Kyçu me metodën origjinale, pastaj lidh këtë llogari shtesë nga Cilësimet e profilit.",
  },
  email_not_found: {
    title: "Mungon email-i",
    message:
      "Ofruesi nuk na dërgoi adresën tënde email. Kontrollo lejet e llogarisë dhe provo përsëri.",
  },
  access_denied: {
    title: "Kyçja u anulua",
    message: "Nuk u dha leja e kërkuar, prandaj kyçja nuk u realizua.",
  },
  unable_to_get_user_info: {
    title: "Gabim gjatë kyçjes",
    message: "Nuk arritëm të marrim të dhënat e llogarisë. Provo përsëri.",
  },
  oauth_provider_not_found: {
    title: "Ofruesi s'u gjet",
    message: "Ky ofrues kyçjeje nuk është i konfiguruar ende.",
  },
  invalid_code: {
    title: "Kyçja skadoi",
    message: "Kodi i kyçjes skadoi ose është i pavlefshëm. Provo përsëri.",
  },
  no_code: {
    title: "Kyçja u ndërpre",
    message: "Diçka e ndërpreu procesin e kyçjes. Provo përsëri.",
  },
  // From here down: raised by the *linking* flow (settings), not plain
  // sign-in, but they share the same `?error=` shape so they live here too.
  unable_to_link_account: {
    title: "Lidhja dështoi",
    message:
      "Nuk arritëm ta lidhim llogarinë e re. Provo përsëri, ose kontakto suportin nëse problemi vazhdon.",
  },
  "email_doesn't_match": {
    title: "Email-et nuk përputhen",
    message:
      "Email-i i kësaj llogarie nuk përputhet me email-in e llogarisë tënde në HikeIt. Për arsye sigurie, mund të lidhësh vetëm një llogari me të njëjtin email.",
  },
  account_already_linked_to_different_user: {
    title: "Llogari e zënë",
    message:
      "Kjo llogari është tashmë e lidhur me një përdorues tjetër në HikeIt.",
  },
  // Thrown synchronously by `linkSocial` (before any redirect) when a
  // provider isn't registered yet — e.g. Facebook before the Meta app exists.
  PROVIDER_NOT_FOUND: {
    title: "Ofruesi s'u gjet",
    message: "Kjo mundësi lidhjeje nuk është ende e disponueshme.",
  },
};

const DEFAULT_COPY: SocialErrorCopy = {
  title: "Diçka shkoi keq",
  message: "Kyçja nuk u realizua. Provo përsëri ose përdor email/fjalëkalim.",
};

export function getSocialErrorCopy(
  code: string | null | undefined,
): SocialErrorCopy {
  if (!code) return DEFAULT_COPY;
  return SOCIAL_ERROR_COPY[code] ?? DEFAULT_COPY;
}

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credential: "Email",
};

export function providerLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return PROVIDER_LABELS[id] ?? null;
}
