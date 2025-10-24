import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
import Unauthorized from "./Unauthorized.page";
// import Loading from "../components/common/Loading"; // bạn tự tạo hoặc import
// import NotPermitted from "../components/common/NotPermitted"; // trang 403



const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user } = useContext(AuthContext);
    const userRole = user.role;

    console.log("check user", userRole)
    // Nếu vai trò người dùng có trong danh sách cho phép
    if (allowedRoles.includes(userRole)) {
        return <>{children}</>;
    }

    return <Unauthorized />;
};

export default ProtectedRoute;
