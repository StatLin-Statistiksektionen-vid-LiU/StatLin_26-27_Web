"use client";

import { useEffect } from "react";
import { markTasksSeen } from "@/app/admin/_actions/tasks";

/** Nollställer siffran för nya uppdrag i sidomenyn när tavlan har öppnats. */
export function MarkTasksSeen() {
  useEffect(() => {
    void markTasksSeen();
  }, []);
  return null;
}
