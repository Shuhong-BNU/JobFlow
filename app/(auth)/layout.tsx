import { getOptionalUser } from "@/server/permissions";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/dashboard");
  }

  return children;
}
