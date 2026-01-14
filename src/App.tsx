import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import LandingPage from "./pages/landing-page";
import DashboardLayout from "./components/layout/dashboard-layout";
import LoginPage from "./pages/auth/login";
import SignupPage from "./pages/auth/signup";
import DocumentPage from "./pages/document-page";
import AiChatPage from "./pages/ai-chat-page";
import MasteryPage from "./pages/mastery-page";
import GraphPage from "./pages/graph-page";
import SearchPage from "./pages/search-page";
import WorkspaceSynthesisPage from "./pages/synthesis-page";

import HomePage from "./pages/home-page";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Dashboard Shell */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<HomePage />} />
            <Route path="documents" element={<div className="p-6">Select a document from sidebar</div>} />
            <Route path="documents/:documentId" element={<DocumentPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="synthesis" element={<WorkspaceSynthesisPage />} />
            <Route path="ai-chat" element={<AiChatPage />} />
            <Route path="mastery" element={<MasteryPage />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="inbox" element={<div className="p-6">Inbox Placeholder</div>} />
            <Route path="settings" element={<div className="p-6">Settings Placeholder</div>} />
            {/* Catch-all for dashboard sub-routes */}
            <Route path="*" element={<div className="p-6">Page not found</div>} />
          </Route>
        </Routes>
        <Toaster position="bottom-center" />
      </Router>
    </AuthProvider>
  );
}

export default App;
