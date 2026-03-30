import { serverFetch } from "@/src/lib/server-fetch";
import type { User } from "@/src/types/auth.types";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  let user: User | null = null;
  try {
    user = await serverFetch<User>("/api/users/me");
  } catch { /* keep null */ }

  return <ProfileClient initialUser={user} />;
}
