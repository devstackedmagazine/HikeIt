"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downscaleImage } from "@/lib/images/downscale-image";
import { cn } from "@/lib/utils/cn";
import { updateAvatar, updateProfile } from "@/server/actions/profile";

interface ProfileFormValues {
  name: string;
  bio: string;
  phone: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  // Shown next to the button, not at the bottom of the form where it was
  // easy to miss on a phone.
  const [avatarError, setAvatarError] = useState<string | null>(null);
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
    // Reset so picking the same file again after an error re-fires onChange.
    e.target.value = "";
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    // Avatars render at 200×200; 1024px keeps plenty of headroom while
    // keeping the request well under the platform body limit.
    fd.set("avatar", await downscaleImage(file, 1024));
    let result;
    try {
      result = await updateAvatar(fd);
    } catch {
      // The action never ran — typically the body was over the size limit
      // (a format the browser couldn't shrink, e.g. HEIC outside Safari).
      setAvatarError("Imazhi është shumë i madh. Provo një foto JPG ose PNG.");
      return;
    }
    if (result.success && result.avatarUrl) {
      setAvatar(result.avatarUrl);
      router.refresh();
    } else {
      setAvatarError(result.error ?? "Ngarkimi dështoi.");
    }
  }

  const inputCls =
    "h-9 border-summit/15 bg-summit/[0.05] text-summit placeholder:text-summit/30";

  if (!editing) {
    return (
      <section id="edit-profile" className={cardCls}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <CardTitle>Detajet e profilit</CardTitle>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={cn(btnCls, "border-sage/40 text-sage hover:border-sage")}
          >
            Ndrysho
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <Detail label="Bio" value={values.bio} />
          <Detail label="Telefon" value={values.phone} />
          <Detail
            label="Kontakti i emergjencës"
            value={values.emergencyContactName}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="edit-profile" className={cardCls}>
      <div className="mb-3">
        <CardTitle>Ndrysho profilin</CardTitle>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="bg-abyss text-sage font-heading flex size-16 shrink-0 items-center justify-center overflow-hidden text-xl font-bold">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Avatar"
                className="size-full object-cover"
              />
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
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              className={cn(
                btnCls,
                "border-sage/40 text-sage hover:border-sage flex items-center gap-1.5 disabled:opacity-50",
              )}
            >
              {avatarUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {avatarUploading ? "Duke ngarkuar…" : "Ngarko foto"}
            </button>
            {avatarError ? (
              <p role="alert" className="mt-1.5 text-xs text-red-300">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>

        <Field label="Emri i plotë">
          <Input
            className={inputCls}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Bio">
          <Textarea
            rows={3}
            maxLength={500}
            className="border-summit/15 bg-summit/[0.05] text-summit placeholder:text-summit/30"
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon">
            <Input
              className={inputCls}
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Data e lindjes">
            <Input
              className={cn(inputCls, "scheme-dark")}
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kontakti i emergjencës">
            <Input
              className={inputCls}
              value={values.emergencyContactName}
              onChange={(e) => set("emergencyContactName", e.target.value)}
            />
          </Field>
          <Field label="Telefoni i emergjencës">
            <Input
              className={inputCls}
              value={values.emergencyContactPhone}
              onChange={(e) => set("emergencyContactPhone", e.target.value)}
            />
          </Field>
        </div>

        {message ? <p className="text-summit/60 text-sm">{message}</p> : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cn(
              btnCls,
              "bg-moss text-abyss border-moss flex items-center gap-1.5 disabled:opacity-50",
            )}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Ruaj
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={cn(
              btnCls,
              "border-summit/20 text-summit/70 hover:text-summit",
            )}
          >
            Anulo
          </button>
        </div>
      </div>
    </section>
  );
}

const cardCls = "border-summit/8 bg-summit/[0.03] scroll-mt-4 border p-4";
const btnCls =
  "border px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors";

function CardTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-moss h-[18px] w-[3px]" />
      <h2 className="text-summit text-[11px] font-bold tracking-[0.08em] uppercase">
        {children}
      </h2>
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
      <Label className="text-summit/60">{label}</Label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-summit/8 flex justify-between gap-4 border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-summit/45">{label}</span>
      <span className="text-summit text-right font-medium break-words">
        {value || "—"}
      </span>
    </div>
  );
}
