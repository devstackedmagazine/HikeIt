import { globalSearch } from "@/server/queries/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await globalSearch(q);
  return Response.json(results);
}
