import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Hardcoded GitHub username
const GITHUB_USERNAME = "anish3333"; // Replace with the actual hardcoded username

function RepoSelectionPage({ onSubmit }: any) {
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repos, setRepos] = useState<any[]>([]);
  const navigate = useNavigate();

  // Fetch public repositories of the hardcoded user
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos`
        );
        if (!response.ok) throw new Error("Failed to fetch repositories");
        const data = await response.json();
        setRepos(data);
        localStorage.setItem("publicRepos", JSON.stringify(data)); // Store in localStorage
      } catch (error) {
        console.error("Error fetching repositories:", error);
      }
    };

    // Check if repos are already stored in localStorage
    const storedRepos = localStorage.getItem("publicRepos");
    if (storedRepos) {
      setRepos(JSON.parse(storedRepos));
    } else {
      fetchRepos();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoOwner.trim() && repoName.trim()) {
      onSubmit(repoOwner, repoName);
      navigate(`/repo/${repoOwner}/${repoName}`);
    }
  };

  // Handle card click to navigate to the repository viewer page
  const handleCardClick = (owner: string, repoName: string) => {
    navigate(`/repo/${owner}/${repoName}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-w-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-400">
        GitHub Repository Viewer
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg mb-8"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="GitHub Username"
            value={repoOwner}
            onChange={(e) => setRepoOwner(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Repository Name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            View Repository
          </button>
        </div>
      </form>

      {/* Display public repositories as cards */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6 text-blue-400">
          Public Repositories of {GITHUB_USERNAME}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => handleCardClick(repo.owner.login, repo.name)}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <h3 className="text-xl font-bold text-blue-400 mb-2">
                {repo.name}
              </h3>
              <p className="text-gray-300 mb-4">
                {repo.description || "No description"}
              </p>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition"
                onClick={(e) => e.stopPropagation()} // Prevent card click when link is clicked
              >
                View on GitHub
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RepoSelectionPage;
