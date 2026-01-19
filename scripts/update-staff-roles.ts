/**
 * Script to update existing users' roles based on their 42 Intra 'kind' field.
 * 
 * This script:
 * 1. Fetches all users who authenticated via 42 School
 * 2. Queries the 42 API for each user's profile
 * 3. Updates their role to STAFF if their 'kind' is 'admin' or 'external'
 * 
 * Usage: npx tsx scripts/update-staff-roles.ts
 * 
 * Required env vars:
 * - DATABASE_URL: Prisma database connection
 * - AUTH_42_SCHOOL_ID: 42 OAuth client ID
 * - AUTH_42_SCHOOL_SECRET: 42 OAuth client secret
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getAccessToken(): Promise<string> {
    const clientId = process.env.AUTH_42_SCHOOL_ID;
    const clientSecret = process.env.AUTH_42_SCHOOL_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing AUTH_42_SCHOOL_ID or AUTH_42_SCHOOL_SECRET env vars");
    }

    const response = await fetch("https://api.intra.42.fr/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

async function getUserKind(accessToken: string, email: string): Promise<string | null> {
    // Search for user by email
    const response = await fetch(
        `https://api.intra.42.fr/v2/users?filter[email]=${encodeURIComponent(email)}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        console.error(`Failed to fetch user ${email}: ${response.status}`);
        return null;
    }

    const users = await response.json();
    if (users.length === 0) {
        console.log(`No 42 user found for email: ${email}`);
        return null;
    }

    return users[0].kind;
}

async function main() {
    console.log("🔄 Updating staff roles from 42 Intra API...\n");

    // Get all users who have a 42-school account
    const usersWithAccounts = await prisma.user.findMany({
        where: {
            accounts: {
                some: {
                    providerId: "42-school",
                },
            },
        },
        include: {
            accounts: {
                where: { providerId: "42-school" },
            },
        },
    });

    console.log(`Found ${usersWithAccounts.length} users with 42 School accounts\n`);

    if (usersWithAccounts.length === 0) {
        console.log("No users to update.");
        return;
    }

    // Get access token for 42 API
    const accessToken = await getAccessToken();
    console.log("✅ Got 42 API access token\n");

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of usersWithAccounts) {
        try {
            const kind = await getUserKind(accessToken, user.email);

            if (!kind) {
                console.log(`⚠️  Skipping ${user.email}: Could not fetch 42 profile`);
                skipped++;
                continue;
            }

            const shouldBeStaff = kind === "admin" || kind === "external";
            const newRole = shouldBeStaff ? "STAFF" : "STUDENT";

            if (user.role === newRole) {
                console.log(`✓ ${user.email}: Already ${newRole} (kind: ${kind})`);
                skipped++;
                continue;
            }

            // Update the role
            await prisma.user.update({
                where: { id: user.id },
                data: { role: newRole },
            });

            console.log(`✅ ${user.email}: ${user.role} → ${newRole} (kind: ${kind})`);
            updated++;

            // Rate limit: 42 API has limits, add small delay
            await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`❌ Error processing ${user.email}:`, error);
            errors++;
        }
    }

    console.log("\n📊 Summary:");
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
}

main()
    .catch((e) => {
        console.error("Script failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
