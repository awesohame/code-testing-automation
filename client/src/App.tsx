import React from "react";
import { Routes, Route } from "react-router-dom";
import RepoSelectionPage from "./pages/RepoSelectingPage";
import RepoViewerPage from "./pages/RepoViewerPage";

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
    </Routes>
  );
};

export default App;
