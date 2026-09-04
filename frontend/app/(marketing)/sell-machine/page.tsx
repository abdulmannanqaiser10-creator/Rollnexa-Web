import { redirect } from "next/navigation";

/** Compatibility alias for /sell-machine → existing /sell route */
export default function SellMachineAliasPage() {
  redirect("/sell");
}
