import React from "react";
import CodeStandardizer from "../components/CodeStandardizer";

const CodeStandardizerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-blue-400 font-bold text-xl">
                  CodeStandardizer
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <CodeStandardizer />
        </div>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2025 CodeStandardizer. All rights reserved.
            </p>
            <p className="text-gray-400 mt-2 sm:mt-0">
              Powered by Google Gemini 2.0 and LangChain
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CodeStandardizerPage;
