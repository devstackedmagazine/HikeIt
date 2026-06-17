"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAvatar, updateProfile } from "@/server/actions/profile";

interface ProfileFormValues {
  name: string;
  bio: string;
  phone: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  language: "sq" | "en";
  alertSensitivity: "low" | "medium" | "high";
}

export function ProfileForm({
  initial,
  avatarUrl,
}: {
  initial: ProfileFormValues;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(avatarUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const result = await updateProfile({
      name: values.name,
      bio: values.bio,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      preferences: {
        language: values.language,
        alertSensitivity: values.alertSensitivity,
      },
    });
    setSaving(false);
    if (!result.success) {
      setMessage(result.error ?? "Gabim.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("avatar", file);
    const result = await updateAvatar(fd);
    if (result.success && result.avatarUrl) {
      setAvatar(result.avatarUrl);
      router.refresh();
    } else {
      setMessage(result.error ?? "Ngarkimi dështoi.");
    }
  }

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Detajet e profilit</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Ndrysho Profilin
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Detail label="Bio" value={values.bio} />
          <Detail label="Telefon" value={values.phone} />
          <Detail label="Kontakti i emergjencës" value={values.emergencyContactName} />
          <Detail label="Gjuha" value={values.language === "en" ? "English" : "Shqip"} />
          <Detail
            label="Ndjeshmëria e alarmeve"
            value={
              { low: "E ulët", medium: "Mesatare", high: "E lartë" }[
                values.alertSensitivity
              ]
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ndrysho Profilin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className="size-full object-cover" />
            ) : (
              (values.name || "?").charAt(0).toUpperCase()
            )}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
            Ngarko foto
          </Button>
        </div>

        <Field label="Emri i plotë">
          <Input
            className="h-9"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Bio">
          <Textarea
            rows={3}
            maxLength={500}
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon">
            <Input
              className="h-9"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Data e lindjes">
            <Input
              className="h-9"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kontakti i emergjencës">
            <Input
              className="h-9"
              value={values.emergencyContactName}
              onChange={(e) => set("emergencyContactName", e.target.value)}
            />
          </Field>
          <Field label="Telefoni i emergjencës">
            <Input
              className="h-9"
              value={values.emergencyContactPhone}
              onChange={(e) => set("emergencyContactPhone", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gjuha">
            <select
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={values.language}
              onChange={(e) =>
                set("language", e.target.value as "sq" | "en")
              }
            >
              <option value="sq">Shqip</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Ndjeshmëria e alarmeve">
            <select
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={values.alertSensitivity}
              onChange={(e) =>
                set(
                  "alertSensitivity",
                  e.target.value as "low" | "medium" | "high",
                )
              }
            >
              <option value="low">E ulët (vetëm rrezik)</option>
              <option value="medium">Mesatare</option>
              <option value="high">E lartë (të gjitha)</option>
            </select>
          </Field>
        </div>

        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Ruaj
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Anulo
          </Button>
        </div>
      </CardContent>
    </Card>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}
