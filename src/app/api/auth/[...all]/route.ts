import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const { POST, GET: betterAuthGET } = toNextJsHandler(auth);

export { POST };

export async function GET(request: NextRequest) {
    const url = new URL(request.url);

    if (url.pathname.includes("/error")) {
        const error = url.searchParams.get("error");
        return NextResponse.redirect(new URL(`/error?error=${error || "unknown_error"}`, request.url));
    }

    return betterAuthGET(request);
}
