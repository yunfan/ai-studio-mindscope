import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MapNode, generateId, deleteNodeFromTree, addNodeToTree, addSiblingToTree, HighlightConfig } from '../lib/treeUtils';

interface MindMapCanvasProps {
  data: MapNode;
  onChange: (newData: MapNode) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  highlightedIds: string[];
  highlightConfig: HighlightConfig;
}

export default function MindMapCanvas({ data, onChange, selectedId, onSelect, highlightedIds, highlightConfig }: MindMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  // Compute Layout
  const margin = { top: 40, right: 120, bottom: 40, left: 120 };
  const nodeWidth = 140;
  const nodeHeight = 50;
  const blobPadding = 35; // Controls the repulsion/cushion around the nodes
  const isHorizontal = highlightConfig.orientation === 'horizontal';

  const root = React.useMemo(() => {
    const rootHierarchy = d3.hierarchy<MapNode>(data);
    // Increased nodeSize gap to prevent blobs from overlapping unselected siblings
    const xGap = nodeWidth + 120;
    const yGap = nodeHeight + 80;
    
    // For D3 tree layout, the coords are [cross-axis spacing, main-axis spacing]
    if (isHorizontal) {
        d3.tree<MapNode>().nodeSize([yGap, xGap])(rootHierarchy);
    } else {
        d3.tree<MapNode>().nodeSize([xGap, yGap])(rootHierarchy);
    }
    return rootHierarchy;
  }, [data, isHorizontal]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Setup Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (e) => setZoomTransform(e.transform));
      
    svg.call(zoom);
  }, []);

  // Keyboard navigation interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Basic check if a modal or input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (!selectedId) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (selectedId === data.id) return; // Cannot delete root
        const newTree = deleteNodeFromTree(data, selectedId);
        if (newTree) {
          onChange(newTree);
          onSelect(null);
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const newId = generateId();
        const newNode: MapNode = { id: newId, title: "New Node", notes: "" };
        const newTree = addNodeToTree(data, selectedId, newNode);
        onChange(newTree);
        onSelect(newId);
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedId === data.id) {
            // Root enter typically adds child
             const newId = generateId();
             const newNode: MapNode = { id: newId, title: "New Node", notes: "" };
             const newTree = addNodeToTree(data, selectedId, newNode);
             onChange(newTree);
             onSelect(newId);
             return;
        }
        const newId = generateId();
        const newNode: MapNode = { id: newId, title: "New Node", notes: "" };
        const newTree = addSiblingToTree(data, selectedId, newNode);
        onChange(newTree);
        onSelect(newId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, selectedId, onChange, onSelect]);


  // Links
  const links = root.links();
  const linkPathGenerator = isHorizontal 
    ? d3.linkHorizontal<d3.HierarchyLink<MapNode>, d3.HierarchyPointNode<MapNode>>()
      .x(d => d.y)
      .y(d => d.x)
    : d3.linkVertical<d3.HierarchyLink<MapNode>, d3.HierarchyPointNode<MapNode>>()
      .x(d => d.x)
      .y(d => d.y);

  const highlightedNodes = root.descendants().filter(n => highlightedIds.includes(n.data.id));

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full bg-slate-50 relative outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500 overflow-hidden"
        tabIndex={0}
        onClick={(e) => {
            if (e.target === svgRef.current) {
                onSelect(null);
            }
        }}
    >
        <div className="absolute top-4 left-4 bg-white/80 p-2 rounded shadow text-xs text-slate-500 pointer-events-none z-10 border border-slate-200">
            <strong>Keybinds:</strong><br/>
            Tab: Add child<br/>
            Enter: Add sibling<br/>
            Backspace: Delete
        </div>

      <svg ref={svgRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
        <defs>
          <filter id="gooey-highlight" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 25 -10" result="baseMask" />
            
            <feMorphology in="baseMask" operator="dilate" radius="4" result="dilated" />
            <feComposite in="dilated" in2="baseMask" operator="out" result="borderMask" />
            
            <feFlood floodColor={highlightConfig.fillColor} floodOpacity={highlightConfig.fillOpacity} result="fillColor" />
            <feComposite in="fillColor" in2="baseMask" operator="in" result="fill" />
            
            <feFlood floodColor={highlightConfig.strokeColor} result="strokeColor" />
            <feComposite in="strokeColor" in2="borderMask" operator="in" result="border" />
            
            <feMerge>
              <feMergeNode in="fill" />
              <feMergeNode in="border" />
            </feMerge>
          </filter>
        </defs>

        <g transform={zoomTransform.toString()}>
          {/* Centering the root roughly */}
          <g transform={`translate(${margin.left}, ${margin.top + 200})`}>
            
            {/* Organic Highlight Blob Layer */}
            {highlightedIds.length > 0 && (
              <g filter="url(#gooey-highlight)">
                {/* Highlight Links */}
                {links.map((link) => {
                  if (highlightedIds.includes(link.source.data.id) && highlightedIds.includes(link.target.data.id)) {
                    return (
                      <path
                        key={`blob-link-${link.target.data.id}`}
                        d={linkPathGenerator(link) || ''}
                        stroke="black"
                        strokeWidth={(isHorizontal ? nodeHeight : nodeWidth) + blobPadding * 1.5}
                        fill="none"
                        strokeLinecap="round"
                        className="transition-all duration-300 pointer-events-none"
                      />
                    );
                  }
                  return null;
                })}
                {/* Highlight Nodes */}
                {highlightedNodes.map(node => {
                  const px = isHorizontal ? node.y : node.x;
                  const py = isHorizontal ? node.x : node.y;
                  return (
                    <rect
                      key={`blob-node-${node.data.id}`}
                      x={px - nodeWidth / 2 - blobPadding}
                      y={py - nodeHeight / 2 - blobPadding}
                      width={nodeWidth + blobPadding * 2}
                      height={nodeHeight + blobPadding * 2}
                      fill="black"
                      rx={blobPadding}
                      className="transition-all duration-300 pointer-events-none"
                    />
                  );
                })}
              </g>
            )}

            {/* Draw Links */}
            {links.map((link, i) => (
              <path
                key={`link-${link.target.data.id}`}
                d={linkPathGenerator(link) || ''}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={2}
              />
            ))}

            {/* Draw Nodes */}
            {root.descendants().map((node) => {
              const isSelected = selectedId === node.data.id;
              const px = isHorizontal ? node.y : node.x;
              const py = isHorizontal ? node.x : node.y;
              
              // We removed the individual box highlighting since the hull envelope completely covers it
              return (
                <g 
                  key={node.data.id} 
                  transform={`translate(${px}, ${py})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.data.id);
                  }}
                  className="cursor-pointer"
                >
                  <rect
                    x={-nodeWidth / 2}
                    y={-nodeHeight / 2}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={8}
                    fill={isSelected ? '#e0f2fe' : 'white'}
                    stroke={isSelected ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-colors duration-200"
                  />
                  <text
                    dy="-0.2em"
                    textAnchor="middle"
                    className="text-sm font-medium text-slate-800"
                  >
                    {node.data.title || "Untitled"}
                  </text>
                  <text
                    dy="1.2em"
                    textAnchor="middle"
                    className="text-[10px] text-slate-400 font-mono"
                  >
                     {node.data.id}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
