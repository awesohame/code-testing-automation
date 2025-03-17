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

    </div>
  );
};

export default CodeStandardizerPage;
