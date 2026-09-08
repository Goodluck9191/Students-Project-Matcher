import { redirect } from "next/navigation";

/** Sidebar links to /profile/me — the canonical own-profile route is /profile. */
export default function ProfileMeRedirect() {
  redirect("/profile");
}
