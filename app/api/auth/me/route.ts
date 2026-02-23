import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "unauthorized",
      message: "No token provided"
    },
    { status: 401 }
  );
}
