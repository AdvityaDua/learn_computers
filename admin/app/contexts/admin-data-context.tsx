"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, AdminAuthError } from "../lib/admin-api";

export type ClassRow = { _id: string; name: string; grade?: string };
export type SubjectRow = { _id: string; name: string; color: string; icon: string; classId: string };

type AdminDataContextValue = {
  classes: ClassRow[];
  allSubjects: SubjectRow[];
  dataLoading: boolean;
  refreshClasses: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue>({
  classes: [],
  allSubjects: [],
  dataLoading: true,
  refreshClasses: async () => {},
  refreshSubjects: async () => {},
});

export function useAdminData() {
  return useContext(AdminDataContext);
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const refreshClasses = useCallback(async () => {
    try {
      // /classes returns { items: [...], total: N } — paginated
      const res = await apiFetch("/classes?limit=200") as { items?: ClassRow[] } | ClassRow[];
      const rows: ClassRow[] = Array.isArray(res)
        ? res
        : (res as { items?: ClassRow[] }).items ?? [];
      setClasses(rows);
    } catch (err) {
      if (!(err instanceof AdminAuthError)) console.error("Failed to load classes", err);
    }
  }, []);

  const refreshSubjects = useCallback(async () => {
    try {
      // /subjects returns a plain array
      const res = await apiFetch("/subjects") as SubjectRow[] | { items?: SubjectRow[] };
      const rows: SubjectRow[] = Array.isArray(res)
        ? res
        : (res as { items?: SubjectRow[] }).items ?? [];
      setAllSubjects(rows);
    } catch (err) {
      if (!(err instanceof AdminAuthError)) console.error("Failed to load subjects", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([refreshClasses(), refreshSubjects()]);
      setDataLoading(false);
    };
    void init();
  }, [refreshClasses, refreshSubjects]);

  return (
    <AdminDataContext.Provider value={{ classes, allSubjects, dataLoading, refreshClasses, refreshSubjects }}>
      {children}
    </AdminDataContext.Provider>
  );
}
