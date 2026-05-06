import { Navigate, useLocation } from "react-router-dom"
import { getToken, getUser } from "../lib/api"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!getToken() || !getUser()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
