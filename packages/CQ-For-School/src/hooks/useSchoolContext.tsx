import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface School {
  id: string;
  name: string;
  slug: string;
}

interface SchoolContextType {
  schools: School[];
  selectedSchoolId: string;
  selectedSchool: School | null;
  setSelectedSchoolId: (id: string) => void;
  isLoading: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string>(
    () => localStorage.getItem("selectedSchoolId") ?? ""
  );

  const setSelectedSchoolId = (id: string) => {
    localStorage.setItem("selectedSchoolId", id);
    setSelectedSchoolIdState(id);
  };

  const TEST_SCHOOL_ID = "d184f91b-3049-4fa0-a03e-1378561527e4";

  const { data: allSchools = [], isLoading } = useQuery({
    queryKey: ["all-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data as School[];
    },
  });

  const schools = allSchools.filter((s) => s.id === TEST_SCHOOL_ID);

  // Auto-select Test School
  useEffect(() => {
    if (schools.length > 0) {
      const stored = localStorage.getItem("selectedSchoolId") ?? selectedSchoolId;
      if (stored && schools.some((s) => s.id === stored)) return;
      setSelectedSchoolId(schools[0].id);
    }
  }, [schools, selectedSchoolId]);

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) ?? null;

  return (
    <SchoolContext.Provider
      value={{ schools, selectedSchoolId, selectedSchool, setSelectedSchoolId, isLoading }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchoolContext must be used within SchoolProvider");
  return ctx;
}
