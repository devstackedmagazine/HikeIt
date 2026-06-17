"use client";

import { Loader2, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { memberRoleLabels } from "@/lib/i18n/labels";
import { formatTripDate } from "@/lib/utils/datetime";
import {
  changeMemberRole,
  inviteMember,
  removeMember,
} from "@/server/actions/clubs";
import type { MemberWithUser } from "@/server/queries/clubs";

export function ClubMembersTable({
  members,
  clubSlug,
  canManage,
}: {
  members: MemberWithUser[];
  clubSlug: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.name ?? "").toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  async function onRoleChange(membershipId: string, role: string) {
    await changeMemberRole(
      clubSlug,
      membershipId,
      role as "member" | "organizer" | "admin",
    );
    router.refresh();
  }

  async function onRemove(membershipId: string) {
    if (!confirm("Hiq këtë anëtar?")) return;
    await removeMember(clubSlug, membershipId);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          className="h-9 max-w-xs"
          placeholder="Kërko anëtarë…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canManage ? <InviteDialog clubSlug={clubSlug} /> : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {members.length} anëtarë gjithsej
      </p>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roli</TableHead>
              <TableHead>U bashkua</TableHead>
              {canManage ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.membershipId}>
                <TableCell className="font-medium">
                  {m.name ?? "Anëtar"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.email}
                </TableCell>
                <TableCell>
                  {canManage ? (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        onRoleChange(m.membershipId, e.target.value)
                      }
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      <option value="member">Anëtar</option>
                      <option value="organizer">Organizator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  ) : (
                    <Badge variant="secondary">
                      {memberRoleLabels[m.role]}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTripDate(m.joinedAt)}
                </TableCell>
                {canManage ? (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(m.membershipId)}
                      aria-label="Hiq"
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InviteDialog({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "organizer">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const result = await inviteMember(clubSlug, email, role);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    setOpen(false);
    setEmail("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus />
            Fto Anëtar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fto Anëtar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Roli</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "member" | "organizer")
              }
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="member">Anëtar</option>
              <option value="organizer">Organizator</option>
            </select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={submit} disabled={loading || !email} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : null}
            Dërgo ftesën
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
