import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ detail: "Gunakan penjanaan melalui backend dengan sesi log masuk." }, { status: 410 });
}
