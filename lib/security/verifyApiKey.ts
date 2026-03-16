import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

export async function verifyApiKey(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing Authorization header", status: 401 };
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();

    if (!apiKey) {
      return { error: "Missing API Key", status: 401 };
    }

    // Hash the incoming API key
    const hashedKey = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    // Query API key
    const { data, error } = await supabaseServer
      .from("api_keys")
      .select("id, org_id, hashed_key, user_id")
      .eq("hashed_key", hashedKey)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase query error:", error);
      return { error: "API verification failed", status: 500 };
    }

    if (!data) {
      return { error: "Invalid API Key", status: 401 };
    }

    return {
      org_id: data.org_id,
      key_id: data.id,
      user_id: (data as any).user_id ?? null,
      status: 200,
    };

  } catch (err) {
    console.error("API key verification failed:", err);
    return { error: "API verification error", status: 500 };
  }
}