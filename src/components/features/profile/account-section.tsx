"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

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
import { changePassword, deleteAccount } from "@/server/actions/profile";

export function AccountSection({ email }: { email: string }) {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <DangerZone email={email} />
    </div>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMessage(null);
    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
    });
    setLoading(false);
    setMessage(result.success ? "Fjalëkalimi u ndryshua!" : (result.error ?? "Gabim."));
    if (result.success) {
      setCurrent("");
      setNext("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ndrysho fjalëkalimin</CardTitle>
      </CardHeader>
      <CardContent className="max-w-sm space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="current-pw">Fjalëkalimi aktual</Label>
          <Input
            id="current-pw"
            type="password"
            className="h-9"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Fjalëkalimi i ri</Label>
          <Input
            id="new-pw"
            type="password"
            className="h-9"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
        <Button onClick={submit} disabled={loading || !current || !next}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          Ruaj
        </Button>
      </CardContent>
    </Card>
  );
}

function DangerZone({ email }: { email: string }) {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    await deleteAccount(confirmation);
    // On success the action redirects; reaching here means it didn't match.
    setLoading(false);
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Fshij llogarinë</CardTitle>
        <CardDescription>Ky veprim nuk kthehet mbrapsht.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger
            render={<Button variant="destructive">Fshij llogarinë</Button>}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Je i sigurt?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Shkruaj email-in tënd <strong>{email}</strong> për të konfirmuar.
            </p>
            <Input
              className="h-9"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={loading || confirmation.trim().toLowerCase() !== email.toLowerCase()}
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
