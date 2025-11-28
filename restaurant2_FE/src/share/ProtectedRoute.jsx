import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
import Unauthorized from "./Unauthorized.page";

const normalizeRole = (role) => {
    if (typeof role === "string") return role;
    return role?.name || "";
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isAppLoading } = useContext(AuthContext);
    const location = useLocation();
    const roleName = normalizeRole(user?.role);

    if (isAppLoading) {
        return null;
    }

    if (!user?.id) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles.length === 0 || allowedRoles.includes(roleName)) {
        return <>{children}</>;
    }

    return <Unauthorized />;
};

export default ProtectedRoute;
