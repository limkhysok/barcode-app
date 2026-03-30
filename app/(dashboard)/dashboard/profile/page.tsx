import { serverFetch } from "@/src/lib/server-fetch";
import { getMe } from "@/src/services/auth.service";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getMe(serverFetch);

  return <ProfileClient initialUser={user} />;
}
