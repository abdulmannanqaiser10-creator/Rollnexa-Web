import { NextResponse } from "next/server";
import { getPromotionPackages } from "@/lib/promotions/service";
export async function GET() { try { return NextResponse.json({ success: true, packages: await getPromotionPackages() }); } catch (error) { console.error("[promotions/packages] GET failed", error); return NextResponse.json({ error: "Unable to load promotion packages" }, { status: 500 }); } }
