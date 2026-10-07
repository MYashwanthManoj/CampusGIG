import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function GET() {
  const icon = await readFile(join(process.cwd(), "app", "icon.svg"));
  return new Response(icon, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public,max-age=86400" } });
}