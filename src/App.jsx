import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { SalesAuthProvider, useSalesAuth } from "./contexts/SalesAuthContext";
import { SalesCartProvider } from "./contexts/SalesCartContext";
import {
  CustomerNotificationProvider,
  SalesNotificationProvider,
} from "./contexts/NotificationContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import OrderProducts from "./pages/OrderProducts";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import OrderSuccess from "./pages/OrderSuccess";
import Invoice from "./pages/Invoice";
import MyOrders from "./pages/MyOrders";
import Reports from "./pages/Reports";
import Sell from "./pages/Sell";
import ReturnRequest from "./pages/ReturnRequest";
import InstallPrompt from "./components/InstallPrompt";
import ReviewForm from "./pages/ReviewForm";
import Profile from "./pages/Profile";
// Sales
import SalesLogin from "./pages/sales/SalesLogin";
import SalesHome from "./pages/sales/SalesHome";
import SalesOrders from "./pages/sales/SalesOrders";
import SalesOrderDetail from "./pages/sales/SalesOrderDetail";
import SalesOrderProducts from "./pages/sales/SalesOrderProducts";
import SalesProductDetail from "./pages/sales/SalesProductDetail";
import SalesCheckout from "./pages/sales/SalesCheckout";
import SalesOrderSuccess from "./pages/sales/SalesOrderSuccess";
import SalesInvoice from "./pages/sales/SalesInvoice";
import Notifications from "./pages/Notifications";
import SalesNotifications from "./pages/sales/SalesNotifications";
import SalesTransactions from "./pages/sales/SalesTransactions";
import SalesProfile from "./pages/sales/SalesProfile";

// Set document.title sesuai prefix path. Sales portal (/sales/*) →
// "Sales Belanja Yuk", lainnya → "Belanja Yuk".
function TitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pathname.startsWith("/sales") ? "Sales Belanja Yuk" : "Belanja Yuk";
  }, [pathname]);
  return null;
}

// Swap <link rel="manifest"> sesuai portal.
//   /sales/*  → /manifest-sales.webmanifest  (Sales Belanja Yuk, scope /sales)
//   lainnya  → /manifest.webmanifest         (Belanja Yuk, scope /)
// Browser membaca manifest yang aktif saat user trigger install — jadi
// swap-nya cukup di runtime sebelum klik Install.
// Apple title juga ikut diganti supaya nama di home screen iOS akurat.
function ManifestManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const isSales = pathname.startsWith("/sales");
    const link = document.querySelector('link[rel="manifest"]');
    if (link) {
      const target = isSales ? "/manifest-sales.webmanifest" : "/manifest.webmanifest";
      if (link.getAttribute("href") !== target) link.setAttribute("href", target);
    }
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
      appleTitle.setAttribute("content", isSales ? "Sales Belanja Yuk" : "Belanja Yuk");
    }
  }, [pathname]);
  return null;
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireSales({ children }) {
  const { sales } = useSalesAuth();
  return sales ? children : <Navigate to="/sales/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SalesAuthProvider>
        <CustomerNotificationProvider>
          <SalesNotificationProvider>
            <CartProvider>
              <SalesCartProvider>
                <BrowserRouter>
              <TitleManager />
              <ManifestManager />
              <InstallPrompt />
              <Routes>
                {/* Customer auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Customer pages */}
                <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
                <Route path="/catalog" element={<RequireAuth><Catalog /></RequireAuth>} />
                <Route path="/order" element={<RequireAuth><OrderProducts /></RequireAuth>} />
                <Route path="/product/:uid" element={<RequireAuth><ProductDetail /></RequireAuth>} />
                <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                <Route path="/services" element={<RequireAuth><Services /></RequireAuth>} />
                <Route path="/services/:uid" element={<RequireAuth><ServiceDetail /></RequireAuth>} />
                <Route path="/success/:id" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
                <Route path="/invoice/:id" element={<RequireAuth><Invoice /></RequireAuth>} />
                <Route path="/return/new/:orderId" element={<RequireAuth><ReturnRequest /></RequireAuth>} />
                <Route path="/review/:orderId" element={<RequireAuth><ReviewForm /></RequireAuth>} />
                <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
                <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
                <Route path="/sell" element={<RequireAuth><Sell /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

                {/* Sales portal */}
                <Route path="/sales/login" element={<SalesLogin />} />
                <Route path="/sales" element={<RequireSales><SalesHome /></RequireSales>} />
                <Route path="/sales/approval" element={<RequireSales><SalesOrders /></RequireSales>} />
                <Route path="/sales/approval/:id" element={<RequireSales><SalesOrderDetail /></RequireSales>} />
                {/* Legacy URLs that older code may link to */}
                <Route path="/sales/orders/:id" element={<RequireSales><SalesOrderDetail /></RequireSales>} />
                <Route path="/sales/order" element={<RequireSales><SalesOrderProducts /></RequireSales>} />
                <Route path="/sales/product/:uid" element={<RequireSales><SalesProductDetail /></RequireSales>} />
                <Route path="/sales/checkout" element={<RequireSales><SalesCheckout /></RequireSales>} />
                <Route path="/sales/success/:id" element={<RequireSales><SalesOrderSuccess /></RequireSales>} />
                <Route path="/sales/invoice/:id" element={<RequireSales><SalesInvoice /></RequireSales>} />
                <Route path="/sales/transactions" element={<RequireSales><SalesTransactions /></RequireSales>} />
                <Route path="/sales/transactions/:id" element={<RequireSales><SalesOrderSuccess /></RequireSales>} />
                <Route path="/sales/profile" element={<RequireSales><SalesProfile /></RequireSales>} />

                  <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                  <Route path="/sales/notifications" element={<RequireSales><SalesNotifications /></RequireSales>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
              </SalesCartProvider>
            </CartProvider>
          </SalesNotificationProvider>
        </CustomerNotificationProvider>
      </SalesAuthProvider>
    </AuthProvider>
  );
}
