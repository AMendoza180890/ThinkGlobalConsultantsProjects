import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isDemo = localStorage.getItem("demo_auth") === "true";

  if (loading && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="w-8 h-8 border-4 border-[#1a7a7a]/30 border-t-[#1a7a7a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isDemo) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
