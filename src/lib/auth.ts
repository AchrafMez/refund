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
  const baseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";

  return betterAuth({
    baseURL,

    trustedOrigins: [
      "http://localhost:3000",
    ],

    pages: {
      error: "/error",
    },

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

            mapProfileToUser: async (profile: Record<string, unknown>) => {
              const profileData = profile as { "staff?": boolean; usual_full_name?: string; displayname?: string; login?: string; email?: string; image?: { link?: string } };
              const isStaff = profileData["staff?"] === true;

              return {
                name:
                  profileData.usual_full_name ||
                  profileData.displayname ||
                  profileData.login,
                email: profileData.email,
                image: profileData.image?.link ?? null,
                role: isStaff ? "STAFF" : "STUDENT",
              };
            },
          },
        ],
      }),
    ],
  });
}

export const auth = globalForAuth[AUTH_KEY] ?? (globalForAuth[AUTH_KEY] = createAuthInstance());
