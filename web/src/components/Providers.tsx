"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

/** Client-side session (fetched from /api/auth/session), so pages stay statically rendered. */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
