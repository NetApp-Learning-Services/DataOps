import { unstable_noStore } from "next/cache";

export function getRuntimeEnvVars() {
  unstable_noStore();

  return process.env;
}