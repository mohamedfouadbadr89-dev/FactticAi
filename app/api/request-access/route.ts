import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BLOCKED_DOMAINS = [
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate presence
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();

    // Validate format
    if (!EMAIL_REGEX.test(trimmed)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Block disposable domains
    const domain = trimmed.split("@")[1];
    if (BLOCKED_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "Please use an institutional email address." },
        { status: 400 }
      );
    }

    // Block free email providers for enterprise CTA
    const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];
    if (freeProviders.includes(domain)) {
      return NextResponse.json(
        { error: "Please use your organization email address." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // TODO: Integrate with your email service / CRM here
    // e.g., Supabase insert, SendGrid, HubSpot, etc.
    // For now, log and return success.
    // -------------------------------------------------------
    console.log(`[REQUEST-ACCESS] New enterprise lead: ${trimmed}`);

    return NextResponse.json(
      {
        success: true,
        message: "Access request received. Our engineering team will contact you within 24 hours.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
