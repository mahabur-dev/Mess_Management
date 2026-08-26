"use client";

import { useCallback, useEffect, useState } from "react";
import { personalApi } from "../api/personal.api";
import type { FamilyMember } from "../types";

export function useFamilyMembers(month: string, errorMessage: string) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await personalApi.familyMembers(month);
      setFamilyMembers(
        Array.isArray(response.data) ? (response.data as FamilyMember[]) : [],
      );
    } catch {
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [errorMessage, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { familyMembers, loading, error, refresh };
}
