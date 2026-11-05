"use client";

import { useEffect } from "react";
import { markBoxSeen } from "@/app/admin/_actions/fragelada";

/** Nollställer siffran för olästa i sidomenyn när ägaren har öppnat lådan. */
export function MarkBoxSeen({ boxId }: { boxId: number }) {
  useEffect(() => {
    void markBoxSeen(boxId);
  }, [boxId]);
  return null;
}
