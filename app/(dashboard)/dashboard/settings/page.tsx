import { cookies } from "next/headers";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  await cookies(); // force dynamic rendering
  return <SettingsClient />;
}
