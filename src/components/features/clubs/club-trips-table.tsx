"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Trip } from "@/lib/db/schema";
import { tripStatusLabels } from "@/lib/i18n/labels";
import { formatTripDate } from "@/lib/utils/datetime";

const STATUS_FILTERS = [
  "all",
  "open",
  "draft",
  "completed",
  "canceled",
] as const;

export function ClubTripsTable({
  trips,
  clubSlug,
}: {
  trips: Trip[];
  clubSlug: string;
}) {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const filtered =
    status === "all" ? trips : trips.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as (typeof STATUS_FILTERS)[number])
          }
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">Të gjitha</option>
          {STATUS_FILTERS.slice(1).map((s) => (
            <option key={s} value={s}>
              {tripStatusLabels[s]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          render={<Link href={`/dashboard/club/${clubSlug}/trips/create`} />}
        >
          <Plus />
          Krijo Udhëtim të Ri
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Asnjë udhëtim.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulli</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Statusi</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Çmimi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/club/${clubSlug}/trips/${trip.slug}`}
                      className="font-medium hover:underline"
                    >
                      {trip.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTripDate(trip.startDatetime)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tripStatusLabels[trip.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trip.maxParticipants ?? "∞"}
                  </TableCell>
                  <TableCell>
                    {Number(trip.priceEur) === 0
                      ? "Falas"
                      : `€${trip.priceEur}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
