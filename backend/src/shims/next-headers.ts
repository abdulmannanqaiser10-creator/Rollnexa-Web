import { getRequestHeaders } from "@/lib/request-context";

export async function headers() {
  return getRequestHeaders();
}
