import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSellerPromotions } from "@/lib/promotions/service";
export async function GET() { try { const session = await getSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (session.user.role !== "SELLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); return NextResponse.json({ success: true, promotions: await getSellerPromotions(session.user.id) }); } catch (error) { console.error("[seller/promotions] GET failed", error); return NextResponse.json({ error: "Unable to load promotions" }, { status: 500 }); } }
