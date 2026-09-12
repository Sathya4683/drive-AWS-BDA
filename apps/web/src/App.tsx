import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import { verify } from "./api/auth";
import { Canvas } from "./components/Canvas";
import { ArchitectureSection } from "./components/ArchitectureSection";

function App() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const verifyQuery = useQuery({
    queryKey: ["auth", "verify"],
    queryFn: verify,
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (token && verifyQuery.isError) {
      logout();
    }
  }, [token, verifyQuery.isError, logout]);

  if (token && verifyQuery.isLoading) {
    return <div className="loading">Loading…</div>;
  }

  return (
    <>
      <Canvas />
      <ArchitectureSection />
    </>
  );
}

export default App;