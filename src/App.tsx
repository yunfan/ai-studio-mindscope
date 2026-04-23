import React, { useState } from 'react';
import { MapNode, HighlightConfig } from './lib/treeUtils';
import MindMapCanvas from './components/MindMapCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DslPanel } from './components/DslPanel';
import { Network, SplitSquareHorizontal } from 'lucide-react';

const INITIAL_DATA: MapNode = {
  id: 'root',
  title: 'Mind Map Root',
  notes: 'This is the main topic. You can navigate and add children with your keyboard.',
  children: [
    {
      id: 'node_a',
      title: 'Branch A',
      notes: 'Details about branch A',
      children: [
        {
          id: 'node_a1',
          title: 'Sub-branch A1',
          notes: 'This is specifically targeted',
        },
        {
          id: 'node_a2',
          title: 'Sub-branch A2',
          notes: 'This will NOT be highlighted because of pick mode',
        }
      ]
    },
    {
      id: 'node_b',
      title: 'Branch B',
      notes: '',
    }
  ]
};

export default function App() {
  const [treeData, setTreeData] = useState<MapNode>(INITIAL_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'properties' | 'dsl'>('properties');
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>({
    strokeColor: '#f59e0b',
    fillColor: '#fef3c7',
    fillOpacity: 0.5,
    orientation: 'horizontal'
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded">
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="font-semibold text-slate-800">MindScope DSL Editor</h1>
        </div>
        <div className="flex items-center text-xs text-slate-500 gap-4 font-mono">
            <span>Root ID: root</span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Canvas */}
        <section className="flex-1 relative border-r border-slate-200 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]">
            <MindMapCanvas 
              data={treeData} 
              onChange={setTreeData} 
              selectedId={selectedId}
              onSelect={setSelectedId}
              highlightedIds={highlightedIds}
              highlightConfig={highlightConfig}
            />
        </section>

        {/* Right: Sidebar */}
        <aside className="w-[360px] flex flex-col bg-white shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
            <div className="flex border-b border-slate-200 shrink-0">
               <button 
                 onClick={() => setActiveTab('properties')}
                 className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'properties' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
               >
                 Properties
               </button>
               <button 
                 onClick={() => setActiveTab('dsl')}
                 className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'dsl' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
               >
                 <SplitSquareHorizontal className="w-4 h-4"/> TreeScope DSL
               </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {activeTab === 'properties' && (
                    <PropertiesPanel 
                      data={treeData} 
                      selectedId={selectedId} 
                      onChange={setTreeData} 
                    />
                )}
                {activeTab === 'dsl' && (
                    <DslPanel 
                      tree={treeData} 
                      onHighlightResult={setHighlightedIds} 
                      config={highlightConfig}
                      onConfigChange={setHighlightConfig}
                    />
                )}
            </div>
        </aside>
      </main>
    </div>
  );
}
