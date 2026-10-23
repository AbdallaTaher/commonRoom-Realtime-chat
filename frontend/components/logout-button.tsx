import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return <form action={signOutAction}><Button type="submit" variant="outline">Sign out</Button></form>;
}
