import React from "react";
import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
  Navigate,
} from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import WarehousePage from "../pages/WarehousePage";

import NotFound from "../pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider, useAuth } from "../context/AuthContext";
import VendorPage from "@/pages/VendorPage";
import DriversPage from "@/pages/DriversPage";
import AdminsPage from "@/pages/AdminPage";
import OrdersPage from "@/pages/Orderspage";

import CategoriesPage from "@/pages/CategoriesPage";
import DriverAnalyticsPage from "@/pages/DriverAnalyticsPage";
import ProfilePage from "@/pages/Profile";
import UserGrowthAnalyticsPage from "@/pages/Analytics/UserGrowthAnalyticsPage";
import Products from "@/pages/Products";
import ProductInventoryPage from "@/pages/ProductInventoryPage";
import ProductDetails from "@/components/products/ProductDetails";
import VendorProducts from "@/components/vendor/VendorProducts";
import CustomersAnalyticsPage from "@/pages/Analytics/CustomersAnalyticsPage";
import WarehouseProducts from "@/components/warehouses/WarehouseProducts";
import CustomerProfile from "@/pages/CustomersProfile";
import CustomersPage from "@/pages/CustomersPage";
import UsersOrders from "@/pages/UsersOrders";
import OrderDetailPage from "@/pages/OrderDetailPage";
import TicketsPage from "@/pages/TicketsPage";
import WarehouseAnalyticsPage from "@/components/warehouses/WarehouseAnalyticsPage";
// Component to handle redirect logic
const RedirectToLogin: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};

// Define your routes
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "admin",
        element: <AdminsPage />,
      },
      {
        path: "users",
        element: <CustomersPage />,
      },
      {
        path: "users/analytics",
        element: <CustomersAnalyticsPage />,
      },
      {
        path: "users/orders",
        element: <UsersOrders />,
      },
      {
        path: "users/orders/:orderId",
        element: <OrderDetailPage />,
      },
      {
        path: "users/profile/:customerId",
        element: <CustomerProfile />,
      },
      {
        path: "vendor-orders",
        element: <OrdersPage />,
      },
      {
        path: "warehouses",
        element: <WarehousePage />,
      },
      {
        path: "/warehouse/:warehouseId/analytics",
        element: <WarehouseAnalyticsPage />,
      },
      // {
      //   path: "users",
      //   element: <UsersPage />,
      // },
      {
        path: "vendors",
        element: <VendorPage />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
      {
        path: "drivers",
        element: <DriversPage />,
      },
      {
        path: "drivers/:driver_id/analytics",
        element: <DriverAnalyticsPage />,
      },
      {
        path: "usergrowth",
        element: <UserGrowthAnalyticsPage />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "products/:productId",
        element: <ProductDetails/>,
      },
      {
        path: "products/:productId/inventory",
        element: <ProductInventoryPage />,
      },
      {
        path: "vendor/:vendorId",
        element: <VendorProducts/>,
      },
      {
        path: "warehouse/:warehouseId",
        element: <WarehouseProducts/>,
      },
      {
        path: "warehouse/:warehouseId/analytics",
            element: <WarehouseAnalyticsPage/>,
      },
  
     
   
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "tickets",
        element: <TicketsPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <RedirectToLogin />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

// Router Provider Component with Auth Context
const RouterProvider: React.FC = () => {
  return (
    <AuthProvider>
      <ReactRouterProvider router={router} />
    </AuthProvider>
  );
};

export default RouterProvider;
