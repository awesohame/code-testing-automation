import { Star, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import type { Repository } from '../types';

interface RepositoryCardProps {
  repository: Repository;
  onSelect: (repo: Repository) => void;
  isSelected: boolean;
}

export function RepositoryCard({ repository, onSelect, isSelected }: RepositoryCardProps) {
  return (
    <div
      className={clsx(
        'p-4 rounded-lg transition-all duration-200 cursor-pointer',
        'border border-gray-700 hover:border-blue-500',
        'bg-gray-800 hover:bg-gray-750',
        'min-h-[150px] flex flex-col justify-around',
        isSelected && 'border-blue-500 ring-2 ring-blue-500/50'
      )}
      onClick={() => onSelect(repository)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{repository.name}</h3>
          <p className="text-gray-400 text-sm mt-1">{repository.description}</p>
        </div>
        <button
          className={clsx(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white'
          )}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
      <div className="flex items-center space-x-4 mt-4 text-gray-400 text-sm">
        <div className="flex items-center">
          <Star className="w-4 h-4 mr-1" />
          {repository.stars}
        </div>
        <div className="flex items-center">
          <GitBranch className="w-4 h-4 mr-1" />
          Last updated: {repository.lastUpdated}
        </div>
      </div>
    </div>
  );
}