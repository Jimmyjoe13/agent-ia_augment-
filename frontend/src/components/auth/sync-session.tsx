"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "@/lib/api";

export function SyncSession() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.accessToken) {
      api.setAccessToken(session.accessToken);
    }
  }, [session]);

  return null;
}
