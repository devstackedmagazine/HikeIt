"use client";

import { Calendar, Map, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils/cn";
import type { GlobalSearchResult, SearchResult } from "@/server/queries/search";

const HREF: Record<SearchResult["type"], (slug: string) => string> = {
  trail: (s) => `/trails/${s}`,
  club: (s) => `/clubs/${s}`,
  trip: (s) => `/trips/${s}`,
};

const ICON = { trail: Map, club: Users, trip: Calendar } as const;

export function SearchCommand({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd/Ctrl+K toggles the dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const runSearch = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        setResults((await res.json()) as GlobalSearchResult);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  function onValueChange(value: string) {
    setQuery(value);
    runSearch(value);
  }

  function go(result: SearchResult) {
    setOpen(false);
    router.push(HREF[result.type](result.slug));
  }

  const groups: { key: keyof GlobalSearchResult & string; heading: string }[] = [
    { key: "trails", heading: "Shtigjet" },
    { key: "clubs", heading: "Klubet" },
    { key: "trips", heading: "Udhëtimet" },
  ];

  const typeFor: Record<string, SearchResult["type"]> = {
    trails: "trail",
    clubs: "club",
    trips: "trip",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted",
          className,
        )}
      >
        <Search className="size-4" />
        <span>Kërko…</span>
        <kbd className="ml-2 hidden rounded border px-1.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Kërko"
        description="Kërko shtigje, klube dhe udhëtime"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onValueChange}
            placeholder="Kërko shtigje, klube, udhëtime..."
          />
          <CommandList>
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Duke kërkuar…
              </div>
            ) : query.trim().length >= 2 && results?.total === 0 ? (
              <CommandEmpty>Asnjë rezultat për “{query}”</CommandEmpty>
            ) : null}

            {groups.map(({ key, heading }) => {
              const items = results?.[key];
              if (!Array.isArray(items) || items.length === 0) return null;
              const Icon = ICON[typeFor[key]!];
              return (
                <CommandGroup key={key} heading={heading}>
                  {items.map((item) => (
                    <CommandItem
                      key={`${item.type}-${item.id}`}
                      value={`${item.type}-${item.id}`}
                      onSelect={() => go(item)}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="font-medium">{item.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}

            {results && results.total > 0 ? (
              <CommandGroup>
                <CommandItem
                  value="see-all"
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                >
                  <Search className="size-4" />
                  Shiko të gjitha rezultatet për “{query}”
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
