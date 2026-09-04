import { NextResponse } from "next/server";
import { getMachineBySlug } from "@/lib/machines/detail";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const session = await getSession();
    const machine = await getMachineBySlug(slug, session?.user?.id);

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: machine });
  } catch (error) {
    console.error("[api/machines/slug] Failed:", error);
    return NextResponse.json({ error: "Unable to load machine" }, { status: 500 });
  }
}
