import { readWallet } from "@/lib/wallet";
export async function GET() {
  return Response.json(await readWallet(), {
    headers: { "Cache-Control": "no-store" },
  });
}
