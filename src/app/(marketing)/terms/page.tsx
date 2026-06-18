import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kushtet e Shërbimit",
  alternates: { canonical: "https://hikeit.app/terms" },
};

// TODO: These terms are a draft and must be reviewed by a lawyer before launch.
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Kushtet e Shërbimit</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Përditësuar së fundi: 2026
      </p>

      <div className="mt-8 space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Llogaria</h2>
          <p>
            Ju jeni përgjegjës për ruajtjen e sigurisë së llogarisë tuaj dhe për
            saktësinë e informacionit që jepni.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Klubet</h2>
          <p>
            Klubet janë përgjegjëse për udhëtimet që organizojnë, përfshirë
            sigurinë, çmimet dhe komunikimin me pjesëmarrësit.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Pagesat</h2>
          <p>
            Pagesat procesohen nëpërmjet Stripe. Politikat e rimbursimit
            përcaktohen nga klubi organizator.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Përgjegjësia
          </h2>
          <p className="font-medium text-foreground">
            HikeIt është një platformë, jo një operator turistik. Alpinizmi mbart
            rreziqe të natyrshme. Hikerët marrin pjesë me përgjegjësinë e tyre.
          </p>
          <p className="mt-2">
            HikeIt nuk mban përgjegjësi për aksidente, lëndime apo dëme që mund
            të ndodhin gjatë udhëtimeve.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Zgjidhja e mosmarrëveshjeve
          </h2>
          <p>
            Mosmarrëveshjet do të zgjidhen sipas legjislacionit në fuqi në
            Republikën e Kosovës.
          </p>
        </section>
      </div>
    </article>
  );
}
