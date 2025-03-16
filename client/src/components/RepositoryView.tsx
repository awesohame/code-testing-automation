import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, Edit, Check, X, TestTube, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import { RepositoryCard } from "./RepositoryCard";
import { Activity, Laptop, Server, LineChart, PenTool, PlayCircle } from 'lucide-react';

const RepositoryView = ({
  username,
  isEditingUsername,
  setIsEditingUsername,
  tempUsername,
  setTempUsername,
  handleUsernameSubmit,
  fetchRepos,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
  filteredRepositories,
  handleRepositoryClick,
  selectedRepo,
  setSelectedRepo,
}: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const onSelectAPIExplorer = (repo) => {
    handleRepositoryClick(repo);
  };

  const onSelectUnitTest = (repo) => {
    navigate(`/unit-test/${username}/${repo.name}`);
  };

  const handleAPIExplorer = () => {
    setIsModalOpen(false);
    onSelectAPIExplorer(selectedRepo);
  };

  const handleUnitTest = () => {
    setIsModalOpen(false);
    onSelectUnitTest(selectedRepo);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 space-y-8">
      {/* Backdrop gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-blue-900/5 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-8 mb-12">
          {/* Title area with better alignment */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              <h1 className="text-4xl font-bold flex items-center gap-3 mb-4 h-full">
                <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent ">
                  Welcome to the Testing Suite
                </span>
              </h1>

              <div className="flex items-center gap-2">
                {isEditingUsername ? (
                  <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleUsernameSubmit}
                    className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm border border-blue-500/20 rounded-lg px-3 py-2"
                  >
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="bg-transparent border-none text-blue-100/80 placeholder-blue-100/50 focus:outline-none"
                      placeholder="GitHub username"
                      autoFocus
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="p-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                    >
                      <Check className="w-4 h-4 text-blue-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setTempUsername(username);
                      }}
                      className="p-1 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                    >
                      <X className="w-4 h-4 text-blue-100/80" />
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-blue-100/80"
                  >
                    <p>Choose a github repository to start testing</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditingUsername(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
                    >
                      <span className="text-blue-400 font-medium">
                        {username}
                      </span>
                      <Edit className="w-4 h-4 text-blue-400" />
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchRepos(username)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 text-[#f8fafc]"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>
          </div>

          {/* Improved search bar design */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 z-[20]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search repositories..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-900/80 border border-blue-500/30 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-[#f8fafc] placeholder-blue-100/60 backdrop-blur-sm shadow-lg shadow-blue-900/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-lg mb-8 backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Repository Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRepositories.map((repo, index) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onSelect={(repo) => {
                setIsModalOpen(true);
                setSelectedRepo(repo);
              }}
              isSelected={repo.name === selectedRepo?.name}
              index={index}
            />
          ))}
        </motion.div>

        {/* Repository Action Modal */}
        {isModalOpen && (
          <RepositoryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            repository={selectedRepo}
            onUnitTest={handleUnitTest}
            onPerformanceTest={handleAPIExplorer}
          />
        )}
      </div>
    </div>
  );
};

const RepositoryModal = ({
  isOpen,
  onClose,
  repository,
  onUnitTest,
  onPerformanceTest,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-4xl shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Repository Actions</h2>
            <p className="text-gray-400 text-sm mt-1">
              {repository?.name} • Testing & Analysis Tools
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unit Test Card */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors">
            <div className="p-5 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-2 rounded-md mr-3">
                    <TestTube className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Unit Testing</h3>
                </div>
                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded font-medium">Code Quality</span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="space-y-4 text-gray-300 text-sm mb-5">
                <div className="flex items-start">
                  <Laptop className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                  <p>Interactive web code editor opens with your repository code pre-loaded</p>
                </div>
                <div className="flex items-start">
                  <RefreshCw className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                  <p>Real-time synchronization with your VS Code environment for seamless testing</p>
                </div>
                <div className="flex items-start">
                  <LineChart className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                  <p>Comprehensive test coverage analysis with detailed reports and metrics</p>
                </div>
              </div>
              
              <button
                onClick={() => onUnitTest(repository)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center gap-2 transition-colors text-white font-medium"
              >
                <TestTube className="w-5 h-5" />
                Generate Unit Tests
              </button>
            </div>
          </div>

          {/* Performance Test Card */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-purple-500 transition-colors">
            <div className="p-5 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="bg-purple-500/20 p-2 rounded-md mr-3">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Performance Testing</h3>
                </div>
                <span className="bg-purple-900/30 text-purple-400 text-xs px-2 py-1 rounded font-medium">Load Analysis</span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="space-y-4 text-gray-300 text-sm mb-5">
                <div className="flex items-start">
                  <Code2 className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                  <p>Automatic API extraction with support for dynamic discovery and manual configuration</p>
                </div>
                <div className="flex items-start">
                  <PenTool className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                  <p>Intelligent test script generation with customizable parameters and scenarios</p>
                </div>
                <div className="flex items-start">
                  <Server className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                  <p>Containerized test execution via Docker with scalable cloud deployment options</p>
                </div>
              </div>
              
              <button
                onClick={() => onPerformanceTest(repository)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-md flex items-center justify-center gap-2 transition-colors text-white font-medium"
              >
                <PlayCircle className="w-5 h-5" />
                Run Performance Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default RepositoryView;
