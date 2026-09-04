import { NextResponse } from "next/server";
import {
  getMachinesForCompare,
  parseCompareIds,
} from "@/lib/compare/query";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = parseCompareIds(searchParams.get("ids") || undefined);

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const machines = await getMachinesForCompare(ids);

    return NextResponse.json({
      success: true,
      data: machines,
    });
  } catch (error) {
    console.error("[api/compare] GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load machines for comparison" },
      { status: 500 }
    );
  }
}
