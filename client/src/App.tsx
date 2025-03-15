import React from "react";
import { Routes, Route, Navigate} from "react-router-dom";
import RootLayout from "@/components/layouts/RootLayout"; // Ensure the import path is correct
import RepoSelectionPage from "./pages/RepoSelectingPage";
import RepoViewerPage from "./pages/RepoViewerPage";
import TestCaseDashboard from "./pages/TestCases";
import TestingPage from "./pages/Testing";
import DashboardPage from "./pages/Dashboard";
import Test from "./pages/Test";

const App: React.FC = () => {
  const handleRepoSubmit = (owner: string, name: string) => {
    console.log("Selected Repo:", owner, name);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<RepoSelectionPage onSubmit={handleRepoSubmit} />}
      />
      <Route path="/repo/:repoOwner/:repoName" element={<RepoViewerPage />} />

      <Route element={<RootLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/test-cases" element={<TestCaseDashboard />} />
        <Route path="/testing" element={<TestingPage />} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;