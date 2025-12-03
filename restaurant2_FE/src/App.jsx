import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { useContext, useEffect } from 'react';
import { AuthContext } from './components/context/auth.context';
import { getAccountAPI, getCart } from './services/api.service';
import { Spin } from 'antd';
import LayoutApp from './components/share/Layout.app';
import ErrorPage from './pages/client/error';
import HomePage from './pages/client/home';
import DishPage from './pages/client/dish';
import { InfoPage } from './components/client/info/info';
import PrivateRoute from './share/private.route';
import LayoutAdmin from './components/admin/Layout.admin';
import LoginPage from './pages/client/login';
import RegisterPage from './pages/client/register';
import ConfirmPage from './components/client/Confirm/Confirm';
import AboutPage from './pages/client/about';
import './style/global.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import './style/animation.css'
import './style/base.css'
import './style/home.css'
import './style/modal.css'
import './style/responsive.css'
import './style/login.css'
import 'antd/dist/reset.css';
import { InfoPageAdmin } from './components/admin/info/Info';
import IndexPage from './components/admin/index/IndexPage';
import TableDish from './components/admin/dish/Table.dish';
import OrderPage from './pages/client/order';
import OrderPageAdmin from './pages/admin/order/OrderPage';
import UserPageAdmin from './pages/admin/user/UserPage';
import TableCategory from './components/admin/category/Table.category';
import RolePermissionManagement from './pages/admin/RolePermissionManagement';
import StaffImportStock from './components/staff/inventory/StaffImportStock';
import Unauthorized from './share/Unauthorized.page';
import ProtectedRoute from './share/ProtectedRoute';
import LayoutStaff from './components/staff/LayoutStaff';
import ThanksPage from './pages/client/thanks';
import PaymentPage from './pages/client/payment';
import PaymentManagement from './pages/admin/PaymentManagement';
import AnalysisPage from './pages/admin/analysis';
import PaymentResult from './pages/client/payment/VNPayCallback';
import VNPaySuccess from './pages/client/payment/VNPaySuccess';
import VNPayFailed from './pages/client/payment/VNPayFailed';
import SessionManagementPage from './pages/admin/SessionManagementPage';


const LayoutClient = () => {

  const { isAppLoading } = useContext(AuthContext);
  return (
    <>
      {isAppLoading === true ?
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50% , -50%)"
        }}>
          <Spin />
        </div>
        :
        <>
          <Header />
          <Outlet />
          <Footer />
        </>
      }
    </>)
}

const App = () => {
  const { user } = useContext(AuthContext);
  console.log(user)

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <LayoutApp>
          <LayoutClient />
        </LayoutApp>
      ),
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "/dish", element: <DishPage /> },
        { path: "/about", element: <AboutPage /> },
        { path: "/info", element: <PrivateRoute>  <InfoPage /></PrivateRoute> },
        { path: "/order", element: <PrivateRoute> <OrderPage /> </PrivateRoute> },
        { path: "/payment", element: <PrivateRoute> <PaymentPage /> </PrivateRoute> },

      ],
    },

    {
      path: "/admin",
      element: (
        <LayoutApp>
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <LayoutAdmin />
          </ProtectedRoute>
        </LayoutApp>
      ),
      children: [
        { index: true, element: <IndexPage /> },
        { path: "dish", element: <TableDish /> },
        { path: "info", element: <InfoPageAdmin /> },
        { path: "orders", element: <OrderPageAdmin /> },
        { path: "user", element: <UserPageAdmin /> },
        { path: "category", element: <TableCategory /> },
        { path: "role-permission", element: <RolePermissionManagement /> },
        { path: "payment", element: <PaymentManagement /> },
        { path: "analysis", element: <AnalysisPage /> },
        { path: "sessions", element: <SessionManagementPage /> },
      ],
    },


    {
      path: "/staff",
      element: (
        <LayoutApp>
          <ProtectedRoute allowedRoles={['STAFF', 'SUPER_ADMIN']}>
            <LayoutStaff />
          </ProtectedRoute>
        </LayoutApp>
      ),
      children: [
        { index: true, element: <OrderPageAdmin /> },
        { path: "info", element: <InfoPageAdmin /> },
        { path: "order", element: <OrderPageAdmin /> },
        { path: "inventory", element: <StaffImportStock /> },
        { path: "payment", element: <PaymentManagement /> },
      ],
    },

    { path: "/thanks", element: <ThanksPage /> },
    { path: "/payment-result", element: <PaymentResult /> },
    { path: "/payment/vnpay/success", element: <VNPaySuccess /> },
    { path: "/payment/vnpay/failed", element: <VNPayFailed /> },

    // Auth Pages
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/confirm", element: <ConfirmPage /> },
    { path: "/unauthorized", element: <Unauthorized /> },
  ]);

  return <RouterProvider router={router} />;
};

export default App;