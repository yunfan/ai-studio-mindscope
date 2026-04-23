import React, { useState, useEffect } from 'react';
import { evaluateTreeScope } from '../lib/dslEngine';
import { MapNode, HighlightConfig } from '../lib/treeUtils';
import { Play, Settings2 } from 'lucide-react';

interface Props {
  tree: MapNode;
  onHighlightResult: (ids: string[]) => void;
  config: HighlightConfig;
  onConfigChange: (config: HighlightConfig) => void;
}

const DEFAULT_DSL = `scope "HighlightPath" {
    root    = "root"
    depth   = -1
    mode    = "pick"
    include = ["node_a", "node_a1"]
}`;

export function DslPanel({ tree, onHighlightResult, config, onConfigChange }: Props) {
  const [dsl, setDsl] = useState(DEFAULT_DSL);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const runDsl = () => {
    const result = evaluateTreeScope(tree, dsl);
    if ('error' in result && typeof result.error === 'string') {
        setError(result.error);
        setOutput('');
        onHighlightResult([]);
    } else {
        setError(null);
        setOutput(JSON.stringify(result, null, 2));
        onHighlightResult(result);
    }
  };

  useEffect(() => {
    runDsl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]); 

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 border-l border-slate-200">
      <div className="flex items-center justify-between p-3 border-b border-slate-800 shrink-0">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            TreeScope DSL Runner
        </h3>
        <button 
            onClick={runDsl}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs transition-colors"
        >
            <Play className="w-3 h-3" /> Run
        </button>
      </div>
      
      <div className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto">

        {/* Global Configuration */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-100 font-medium text-xs uppercase tracking-wider">
             <Settings2 className="w-3 h-3"/> Global Style
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
             <div>
                <label className="block text-slate-500 mb-1">Border Color</label>
                <div className="flex items-center gap-2">
                   <input type="color" value={config.strokeColor} onChange={e => onConfigChange({...config, strokeColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                   <span className="font-mono text-slate-400">{config.strokeColor}</span>
                </div>
             </div>
             <div>
                <label className="block text-slate-500 mb-1">Fill Color</label>
                <div className="flex items-center gap-2">
                   <input type="color" value={config.fillColor} onChange={e => onConfigChange({...config, fillColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                   <span className="font-mono text-slate-400">{config.fillColor}</span>
                </div>
             </div>
               <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 flex justify-between">
                    <span>Fill Opacity</span>
                    <span className="font-mono">{config.fillOpacity.toFixed(2)}</span>
                  </label>
                  <input 
                     type="range" min="0" max="1" step="0.05" 
                     value={config.fillOpacity} 
                     onChange={e => onConfigChange({...config, fillOpacity: parseFloat(e.target.value)})}
                     className="w-full accent-green-500" 
                   />
               </div>
               <div className="col-span-2 mt-1 border-t border-slate-800 pt-3 flex gap-2">
                 <button 
                    onClick={() => onConfigChange({...config, orientation: 'horizontal'})}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${config.orientation === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                    Horizontal Layout
                 </button>
                 <button 
                    onClick={() => onConfigChange({...config, orientation: 'vertical'})}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${config.orientation === 'vertical' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                    Vertical Layout
                 </button>
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[150px]">
            <label className="block text-xs font-medium text-slate-400 mb-2">
                HCL DSL Input
            </label>
            <textarea
                value={dsl}
                onChange={(e) => setDsl(e.target.value)}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded p-3 text-sm font-mono text-emerald-400 focus:outline-none focus:border-green-500 resize-none min-h-[150px]"
                spellCheck={false}
            />
        </div>

        <div className="h-40 flex flex-col shrink-0">
            <label className="block text-xs font-medium text-slate-400 mb-2">
                Output View (JSON)
            </label>
            <div className={`w-full flex-1 rounded p-3 text-sm font-mono overflow-auto border ${error ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-950 text-slate-300'}`}>
                {error ? (
                    <div className="whitespace-pre-wrap">{error}</div>
                ) : (
                    <pre>{output}</pre>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
