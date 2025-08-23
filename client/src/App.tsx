import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthCallback } from "./pages/AuthCallback";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { ConnectPage } from "./pages/ConnectPage";
import { ConnectNearbyPageRadar } from "./pages/ConnectNearbyPageRadar";
import { ConnectLocationPage } from "./pages/ConnectLocationPage";
import { FriendsPage } from "./pages/FriendsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { isAuthenticated } from "./utils/auth";
import { ChatPage } from "./pages/ChatPage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          !isAuthenticated() ? <LoginPage /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated() ? <RegisterPage /> : <Navigate to="/" replace />
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<UserProfilePage />} />
        <Route path="connect" element={<ConnectPage />} />
        <Route path="connect/nearby" element={<ConnectNearbyPageRadar />} />
        <Route path="connect/:location" element={<ConnectLocationPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:chatId" element={<ChatPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
