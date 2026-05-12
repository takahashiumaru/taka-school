import { Navigate, useLocation } from "react-router-dom"
import { getToken, getUser, type AuthUser } from "../lib/api"
import { hasAnyRole } from "../lib/permissions"

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: AuthUser["role"][] }) {
  const location = useLocation()
  const user = getUser()
  if (!getToken() || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!hasAnyRole(user, roles)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
