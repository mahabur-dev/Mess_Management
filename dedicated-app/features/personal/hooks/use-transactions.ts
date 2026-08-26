"use client";

import { useCallback, useEffect, useState } from "react";
import { personalApi } from "../api/personal.api";
import type { PersonalTransaction, PersonalTransactionFilters } from "../types";

export function useTransactions(
  filters: PersonalTransactionFilters,
  errorMessage: string,
) {
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const filterKey = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await personalApi.transactions(filters);
      setTransactions(
        Array.isArray(response.data)
          ? (response.data as PersonalTransaction[])
          : [],
      );
    } catch {
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage, filterKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { transactions, loading, error, refresh };
}
