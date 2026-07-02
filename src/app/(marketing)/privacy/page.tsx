import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politika e Privatësisë",
  alternates: { canonical: "https://hikeit.app/privacy" },
};

// TODO: This privacy policy is a draft and must be reviewed by a lawyer before
// public launch.
export default function PrivacyPage() {
  return (
    <article className="prose-hikeit mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Politika e Privatësisë
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Përditësuar së fundi: 2026
      </p>

      <div className="mt-8 space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Të dhënat që mbledhim
          </h2>
          <p>
            Mbledhim emrin, email-in, dhe të dhënat e profilit që ju jepni
            vullnetarisht (telefon, kontakt emergjence, foto). Gjithashtu
            ruajmë regjistrimet tuaja në udhëtime dhe klube.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Si i përdorim
          </h2>
          <p>
            Përdorim të dhënat për të ofruar shërbimin: menaxhimin e llogarisë,
            njoftimet për udhëtime dhe mot, dhe komunikimin me klubet.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Palët e treta
          </h2>
          <p>
            Përdorim Stripe (pagesa), Resend (email), Cloudflare R2 (ruajtje
            skedarësh), Supabase (bazë të dhënash) dhe Open-Meteo (mot). Këto
            shërbime përpunojnë të dhëna sipas politikave të tyre.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Të drejtat tuaja (GDPR)
          </h2>
          <p>
            Keni të drejtë të aksesoni, korrigjoni ose fshini të dhënat tuaja.
            Mund të fshini llogarinë në çdo kohë nga profili juaj.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
          <p>
            Për çdo pyetje rreth privatësisë:{" "}
            <a href="mailto:hello@hikeit.app" className="text-primary underline">
              hello@hikeit.app
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
