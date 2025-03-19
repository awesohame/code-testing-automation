import { useState } from 'react';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import type { APIEndpoint, APIParameter } from '../types';

interface APITableProps {
  endpoints: APIEndpoint[];
  onUpdate: (endpoint: APIEndpoint) => void;
  onDelete: (id: string) => void;
}

export function APITable({ endpoints, onUpdate, onDelete }: APITableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<APIEndpoint | null>(null);

  const startEditing = (endpoint: APIEndpoint) => {
    setEditingId(endpoint.id);
    setEditForm(endpoint);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveChanges = () => {
    if (editForm) {
      onUpdate(editForm);
      cancelEditing();
    }
  };

  const addNewEndpoint = () => {
    const newEndpoint: APIEndpoint = {
      id: Date.now().toString(),
      method: 'GET',
      path: '',
      params: [],
      description: ''
    };

    // Add the new endpoint directly
    onUpdate(newEndpoint);
    startEditing(newEndpoint);
  };

  const handleParamsChange = (value: string) => {
    if (!editForm) return;

    const params: APIParameter[] = value.split(',')
      .filter(param => param.trim() !== '')
      .map(param => {
        const trimmed = param.trim();
        return {
          key: trimmed,
          required: false,
          type: 'string'
        };
      });

    setEditForm({ ...editForm, params });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-750">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Method</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Path</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Parameters</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Description</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {endpoints.map((endpoint) => (
              <tr
                key={endpoint.id}
                className="bg-gray-800 hover:bg-gray-750 transition-colors"
              >
                {editingId === endpoint.id ? (
                  <>
                    <td className="px-4 py-3">
                      <select
                        className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                        value={editForm?.method}
                        onChange={(e) =>
                          setEditForm(prev => ({ ...prev!, method: e.target.value as APIEndpoint['method'] }))
                        }
                      >
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                        value={editForm?.path}
                        onChange={(e) =>
                          setEditForm(prev => ({ ...prev!, path: e.target.value }))
                        }
                        placeholder="/api/resource"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                        value={editForm?.params.map(p => p.key).join(', ')}
                        onChange={(e) => handleParamsChange(e.target.value)}
                        placeholder="param1, param2"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                        value={editForm?.description}
                        onChange={(e) =>
                          setEditForm(prev => ({ ...prev!, description: e.target.value }))
                        }
                        placeholder="Endpoint description"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={saveChanges}
                          className="p-1 text-green-500 hover:text-green-400 transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                          endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                            endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                              endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                                'bg-purple-500/20 text-purple-400'}`}>
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{endpoint.path}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {endpoint.params.map((param, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${param.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'
                              }`}
                            title={`Type: ${param.type}${param.required ? ' (Required)' : ''}`}
                          >
                            {param.key}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{endpoint.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => startEditing(endpoint)}
                          className="p-1 text-blue-500 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(endpoint.id)}
                          className="p-1 text-red-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addNewEndpoint}
        className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Endpoint</span>
      </button>
    </div>
  );
}