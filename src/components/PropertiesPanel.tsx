import React from 'react';
import { MapNode, updateNodeInTree } from '../lib/treeUtils';
import { Save, AlertCircle } from 'lucide-react';

interface Props {
  data: MapNode;
  selectedId: string | null;
  onChange: (newData: MapNode) => void;
}

export function PropertiesPanel({ data, selectedId, onChange }: Props) {
  if (!selectedId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-4">
         <div className="bg-slate-100 p-4 rounded-full">
            <AlertCircle className="w-6 h-6" />
         </div>
         <p>Select a node in the mind map to view its details and properties.</p>
      </div>
    );
  }

  // Find selected node details recursively
  let selectedNode: MapNode | null = null;
  function find(node: MapNode) {
      if (node.id === selectedId) selectedNode = node;
      if (node.children) node.children.forEach(find);
  }
  find(data);

  if (!selectedNode) return null;

  const handleUpdate = (field: keyof MapNode, value: string) => {
    const newTree = updateNodeInTree(data, selectedId, (node) => ({
      ...node,
      [field]: value
    }));
    if (newTree) onChange(newTree);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Node Properties</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Node ID (ReadOnly)
          </label>
          <input 
            type="text" 
            value={selectedNode.id} 
            readOnly
            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Title
          </label>
          <input 
            type="text" 
            value={selectedNode.title} 
            onChange={(e) => handleUpdate('title', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Node Title..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Detailed Notes
          </label>
          <textarea 
            value={selectedNode.notes || ''} 
            onChange={(e) => handleUpdate('notes', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
            placeholder="Add detailed annotations here..."
          />
        </div>
      </div>
    </div>
  );
}
