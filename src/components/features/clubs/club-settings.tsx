"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConnectButton } from "@/components/features/billing/connect-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organization } from "@/lib/db/schema";
import { CLUB_CITIES } from "@/lib/validations/club";
import { deleteClub, updateClub } from "@/server/actions/clubs";

export function ClubSettings({
  club,
  canDelete,
}: {
  club: Organization;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: club.name,
    description: club.description ?? "",
    city: club.city ?? "",
    foundedYear: club.foundedYear?.toString() ?? "",
    website: club.website ?? "",
    instagram: club.instagram ?? "",
    facebook: club.facebook ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const result = await updateClub(club.slug, {
      name: form.name,
      description: form.description,
      city: form.city,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      website: form.website,
      instagram: form.instagram,
      facebook: form.facebook,
    });
    setSaving(false);
    setMessage(result.success ? "U ruajt!" : (result.error ?? "Gabim."));
    if (result.success) router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Të dhënat e klubit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Emri">
            <Input
              className="h-9"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Përshkrimi">
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Qyteti">
            <select
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            >
              <option value="">Zgjidh qytetin</option>
              {CLUB_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Viti i themelimit">
            <Input
              className="h-9"
              type="number"
              value={form.foundedYear}
              onChange={(e) => set("foundedYear", e.target.value)}
            />
          </Field>
          <Field label="Website">
            <Input
              className="h-9"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </Field>
          <Field label="Instagram">
            <Input
              className="h-9"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
            />
          </Field>
          <Field label="Facebook">
            <Input
              className="h-9"
              value={form.facebook}
              onChange={(e) => set("facebook", e.target.value)}
            />
          </Field>
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Ruaj ndryshimet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagesat</CardTitle>
          <CardDescription>
            Aktivizo Stripe Connect për të marrë pagesa për udhëtimet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectButton
            organizationId={club.id}
            connected={Boolean(club.stripeConnectAccountId)}
          />
        </CardContent>
      </Card>

      {canDelete ? <DangerZone club={club} /> : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function DangerZone({ club }: { club: Organization }) {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteClub(club.slug, confirmName);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Gabim.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Zona e rrezikut</CardTitle>
        <CardDescription>Fshirja e klubit nuk kthehet mbrapsht.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger
            render={<Button variant="destructive">Fshij klubin</Button>}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fshij {club.name}?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Shkruani <strong>{club.name}</strong> për të konfirmuar.
            </p>
            <Input
              className="h-9"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={loading || confirmName !== club.name}
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              Fshij përgjithmonë
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
