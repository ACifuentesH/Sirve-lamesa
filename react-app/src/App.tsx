import { Navigate, Route, Routes } from "react-router-dom";
import { GamePage } from "./pages/GamePage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/juego" element={<GamePage />} />
      <Route path="/admin" element={<Navigate to="/admin.html" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
