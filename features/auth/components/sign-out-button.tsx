import { LogOut } from "lucide-react";
import { signOutAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline">
        <LogOut className="mr-2 size-4" />
        登出
      </Button>
    </form>
  );
}
