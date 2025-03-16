import { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import type { GitHubContentItem } from '../types';

interface FileExplorerProps {
  files: GitHubContentItem[];
  isLoading?: boolean;
  error?: string;
}

function FileTreeNode({ node, depth = 0 }: { node: GitHubContentItem; depth?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={() => node.type === 'dir' && setIsOpen(!isOpen)}
      >
        {node.type === 'dir' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
            )}
            <Folder className="w-4 h-4 mr-2 text-yellow-400" />
          </>
        ) : (
          <File className="w-4 h-4 mr-2 text-blue-400" />
        )}
        <span className={`${node.type === 'dir' ? 'text-gray-300 font-medium' : 'text-gray-400'} truncate`}>
          {node.name}
        </span>
      </div>
      {isOpen && node.contents && (
        <div>
          {node.contents.map((child, index) => (
            <FileTreeNode key={index} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, isLoading, error }: FileExplorerProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full overflow-auto">
      {files.length > 0 ? (
        files.map((file, index) => (
          <FileTreeNode key={index} node={file} />
        ))
      ) : (
        <div className="text-gray-400 text-sm">No files to display</div>
      )}
    </div>
  );
}