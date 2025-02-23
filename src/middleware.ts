import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // If user is signed in, check their email domain
    if (session?.user) {
        const email = session.user.email;
        const allowedDomains = ["g.ucla.edu", "ucla.edu"];
        const domain = email?.split("@")[1];

        if (!allowedDomains.includes(domain || "")) {
            // If domain is not allowed, sign out the user
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return res;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
