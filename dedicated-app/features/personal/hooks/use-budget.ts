"use client";

import { useCallback, useEffect, useState } from "react";
import { personalApi } from "../api/personal.api";
import type { PersonalBudget } from "../types";

export function useBudget(month: string, errorMessage: string) {
  const [budgets, setBudgets] = useState<PersonalBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await personalApi.budgets(month);
      setBudgets(
        Array.isArray(response.data) ? (response.data as PersonalBudget[]) : [],
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
  return { budgets, loading, error, refresh };
}
