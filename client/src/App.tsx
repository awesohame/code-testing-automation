import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "@/components/layouts/RootLayout";
import RepoViewerPage from "./pages/RepoViewerPage";
import TestCaseDashboard from "./pages/TestCases";
import TestingPage from "./pages/Testing";
import DashboardPage from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Test from "./pages/Test";
import Swagger from "./pages/Swagger";
import CodeStandardizerPage from "./pages/CodeStandardizerPage";
import RoutingPage from "./components/ai-tools/routing";
import AiCourse from "./pages/AiCourse";
import { Researcher } from "./components/ai-tools/pocket-perplexity/Researcher";
import AiVideo from "./pages/AiVideo";
import ResourceHub from "./pages/ResourceHub";

const App: React.FC = () => {
  const handleRepoSubmit = (owner: string, name: string) => {
    console.log("Selected Repo:", owner, name);
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/unit-test/:repoOwner/:repoName" element={<RepoViewerPage />} />

      <Route element={<RootLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/test-cases" element={<TestCaseDashboard />} />
        <Route path="/testing" element={<TestingPage />} />
        <Route path="/swag" element={<Swagger />} />
        <Route path="/test" element={<Test />} />
        <Route path="/code-culture" element={<CodeStandardizerPage />} />
        <Route path="/ai-tools" element={<RoutingPage />} />
        <Route path="/ai-course" element={<AiCourse />} />
        <Route path="/ai-course/aivideo" element={<AiVideo />} />
        <Route path="/researcher" element={<Researcher />} />
        <Route path="/resources" element={<ResourceHub />} />
      </Route>

    </Routes>
  );
};

export default App;