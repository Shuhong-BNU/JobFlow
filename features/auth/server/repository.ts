import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userCredentials, users } from "@/db/schema";

export async function getAuthUserByEmail(email: string) {
  const db = getDb();
  const [record] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: userCredentials.passwordHash,
    })
    .from(users)
    .leftJoin(userCredentials, eq(userCredentials.userId, users.id))
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return record ?? null;
}

export async function createUserAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        name: input.name,
        email: input.email.toLowerCase(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    await tx.insert(userCredentials).values({
      userId: user.id,
      passwordHash: input.passwordHash,
    });

    return user;
  });
}
