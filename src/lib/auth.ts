import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { prisma } from "@/lib/prisma";

const AUTH_KEY = Symbol.for("app.auth");

type GlobalWithAuth = typeof globalThis & {
  [AUTH_KEY]?: ReturnType<typeof betterAuth>;
};

const globalForAuth = globalThis as GlobalWithAuth;

function createAuthInstance() {
  const isProduction =process.env.NODE_ENV === "production" || !!process.env.VERCEL;

  const baseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    (isProduction
      ? "https://refund-med.vercel.app"
      : "http://localhost:3000");

  return betterAuth({
    baseURL,

    trustedOrigins: [
      "http://localhost:3000",
      "https://refund-med.vercel.app",
    ],

    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    emailAndPassword: {
      enabled: true,
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "STUDENT",
          input: false,
        },
      },
    },

    plugins: [
      genericOAuth({
        config: [
          {
            providerId: "42-school",
            clientId: process.env.AUTH_42_SCHOOL_ID!,
            clientSecret: process.env.AUTH_42_SCHOOL_SECRET!,

            authorizationUrl: "https://api.intra.42.fr/oauth/authorize",
            tokenUrl: "https://api.intra.42.fr/oauth/token",
            userInfoUrl: "https://api.intra.42.fr/v2/me",

            redirectURI: process.env.REDIRECT_URL,

            mapProfileToUser: async (profile: any) => {
              const isStaff =
                profile["staff?"] === true ||
                profile.kind === "admin" ||
                profile.kind === "external";

              return {
                name:
                  profile.usual_full_name ||
                  profile.displayname ||
                  profile.login,
                email: profile.email,
                image: profile.image?.link ?? null,
                role: isStaff ? "STAFF" : "STUDENT",
              };
            },
          },
        ],
      }),
    ],
  });
}

export const auth =globalForAuth[AUTH_KEY] ?? (globalForAuth[AUTH_KEY] = createAuthInstance());
