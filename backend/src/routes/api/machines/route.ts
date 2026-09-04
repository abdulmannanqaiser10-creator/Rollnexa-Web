import { NextResponse } from "next/server";
import { browseMachines } from "@/lib/machines/query";
import { parseMachineBrowseFilters } from "@/lib/validations/machine-filters";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });

    const filters = parseMachineBrowseFilters(raw);
    const result = await browseMachines(filters);

    return NextResponse.json({
      success: true,
      data: result.machines,
      pagination: result.pagination,
      filters: result.filters,
    });
  } catch (error) {
    console.error("[api/machines] Failed to browse machines:", error);
    return NextResponse.json(
      { error: "Unable to load machines" },
      { status: 500 }
    );
  }
}
