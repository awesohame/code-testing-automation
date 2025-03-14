"use client"
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Play, 
  Check, 
  X, 
  FileText, 
  Bot, 
  UserCircle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File
} from 'lucide-react';

// Dummy file structure
const fileStructure = {
  'src': {
    type: 'folder',
    children: {
      'components': {
        type: 'folder',
        children: {
          'auth': {
            type: 'folder',
            children: {
              'login.ts': { type: 'file' },
              'passwordReset.ts': { type: 'file' }
            }
          },
          'dashboard': {
            type: 'folder',
            children: {
              'app.ts': { type: 'file' }
            }
          }
        }
      },
      'utils': {
        type: 'folder',
        children: {
          'helpers.ts': { type: 'file' }
        }
      }
    }
  }
};

// Dummy data for automated test cases
const initialAutomatedTests = [
  {
    id: 1,
    name: 'Test Login Authentication',
    status: 'passed',
    type: 'automated',
    description: 'Verify user login with valid credentials',
    generatedFrom: 'src/components/auth/login.ts',
    lastRun: '2024-02-02',
    duration: '1.2s'
  },
  {
    id: 2,
    name: 'Test Invalid Login',
    status: 'failed',
    type: 'automated',
    description: 'Verify error handling for invalid credentials',
    generatedFrom: 'src/components/auth/login.ts',
    lastRun: '2024-02-02',
    duration: '0.8s'
  },
  {
    id: 3,
    name: 'Test Password Reset Flow',
    status: 'pending',
    type: 'automated',
    description: 'Verify password reset functionality',
    generatedFrom: 'src/components/auth/passwordReset.ts',
    lastRun: '2024-02-01',
    duration: '1.5s'
  }
];

// Dummy data for manual test cases
const initialManualTests = [
  {
    id: 4,
    name: 'Visual Verification of Login Page',
    status: 'passed',
    type: 'manual',
    description: 'Check UI elements alignment and responsiveness',
    assignedTo: 'John Doe',
    lastRun: '2024-02-01',
    generatedFrom: 'src/components/auth/login.ts'
  },
  {
    id: 5,
    name: 'Cross-browser Compatibility',
    status: 'pending',
    type: 'manual',
    description: 'Test application in Chrome, Firefox, and Safari',
    assignedTo: 'Jane Smith',
    lastRun: '2024-02-01',
    generatedFrom: 'src/components/dashboard/app.ts'
  }
];

const FileExplorer = ({ structure, level = 0, expandedFolders, setExpandedFolders, selectedFile, setSelectedFile } : any) => {
  const handleFolderClick = (path  : any) => {
    setExpandedFolders((prev : any) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleFileClick = (path : any) => {
    setSelectedFile(path);
  };

  return (
    <div style={{ paddingLeft: level ? '1.5rem' : '0' }} className='bg-black'>
      {Object.entries(structure).map(([name, item] : any) => {
        const path = level === 0 ? name : `${level}/${name}`;
        
        if (item.type === 'folder') {
          const isExpanded = expandedFolders[path];
          return (
            <div key={path}>
              <div
                className="flex bg-black items-center gap-1 py-1 px-2 hover:bg-gray-900 cursor-pointer text-sm"
                onClick={() => handleFolderClick(path)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {isExpanded ? <FolderOpen size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-500" />}
                {name}
              </div>
              {isExpanded && (
                <FileExplorer
                  structure={item.children}
                  level={level + 1}
                  expandedFolders={expandedFolders}
                  setExpandedFolders={setExpandedFolders}
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                />
              )}
            </div>
          );
        } else {
          return (
            <div
              key={path}
              className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-900 cursor-pointer text-sm ${selectedFile === path ? 'bg-blue-100' : ''}`}
              onClick={() => handleFileClick(path)}
            >
              <File size={16} className="text-gray-500" />
              {name}
            </div>
          );
        }
      })}
    </div>
  );
};

const TestCaseDashboard = () => {
  const [automatedTests, setAutomatedTests] = useState(initialAutomatedTests);
  const [manualTests, setManualTests] = useState(initialManualTests);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const getStatusColor = (status : any) => {
    switch (status) {
      case 'passed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const handleGenerateTests = () => {
    if (!selectedFile) {
      alert('Please select a file to generate tests for');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const newTest = {
        id: automatedTests.length + 6,
        name: `Test for ${selectedFile}`,
        status: 'pending',
        type: 'automated',
        description: 'Automatically generated test case',
        generatedFrom: selectedFile,
        lastRun: '2024-02-02',
        duration: '0.0s'
      };
      setAutomatedTests([...automatedTests, newTest]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleAddManualTest = () => {
    if (!selectedFile) {
      alert('Please select a file to add manual test for');
      return;
    }

    const newTest = {
      id: manualTests.length + 6,
      name: `Manual Test for ${selectedFile}`,
      status: 'pending',
      type: 'manual',
      description: 'Enter test case description',
      assignedTo: 'Unassigned',
      lastRun: '2024-02-02',
      generatedFrom: selectedFile
    };
    setManualTests([...manualTests, newTest]);
  };

  const getFilteredTests = (tests : any) => {
    if (!selectedFile) return tests;
    return tests.filter((test : any) => test.generatedFrom === selectedFile);
  };

  return (
    <div className="flex h-screen bg-black">
      {/* File Explorer Sidebar */}
      <div className="w-64 border-r p-4 bg-black">
        <h2 className="text-sm font-semibold mb-4">File Explorer</h2>
        <FileExplorer
          structure={fileStructure}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Test Case Management</h1>
            <div className="flex gap-4 mb-6">
              <Button 
                onClick={handleGenerateTests}
                disabled={isGenerating || !selectedFile}
                className="flex items-center gap-2"
              >
                <Bot size={20} />
                {isGenerating ? 'Generating...' : 'Generate Test Cases'}
              </Button>
              <Button 
                onClick={handleAddManualTest}
                variant="outline"
                disabled={!selectedFile}
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                Add Manual Test
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-600">Selected file: {selectedFile}</p>
            )}
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot size={24} />
                  Automated Test Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {getFilteredTests(automatedTests).map((test :any) => (
                    <div 
                      key={test.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {test.name}
                            <span className={`text-sm ${getStatusColor(test.status)}`}>
                              {test.status === 'passed' && <Check size={16} />}
                              {test.status === 'failed' && <X size={16} />}
                              {test.status === 'pending' && '⏳'}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-600">{test.description}</p>
                        </div>
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Play size={16} />
                          Run Test
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-4">
                        <span>Source: {test.generatedFrom}</span>
                        <span>Duration: {test.duration}</span>
                        <span>Last Run: {test.lastRun}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle size={24} />
                  Manual Test Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {getFilteredTests(manualTests).map((test : any) => (
                    <div 
                      key={test.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {test.name}
                            <span className={`text-sm ${getStatusColor(test.status)}`}>
                              {test.status === 'passed' && <Check size={16} />}
                              {test.status === 'failed' && <X size={16} />}
                              {test.status === 'pending' && '⏳'}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-600">{test.description}</p>
                        </div>
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <FileText size={16} />
                          Edit Test
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-4">
                        <span>Assigned to: {test.assignedTo}</span>
                        <span>Source: {test.generatedFrom}</span>
                        <span>Last Run: {test.lastRun}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseDashboard;