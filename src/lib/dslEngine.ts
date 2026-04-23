import { MapNode } from "./treeUtils";

export interface Scope {
  name: string;
  root: string;
  depth: number;
  mode: 'all' | 'pick';
  include: string[];
}

export function evaluateTreeScope(tree: MapNode, dslText: string): string[] | { error: string } {
  const scopes: Scope[] = [];
  const scopeRegex = /scope\s+"([^"]+)"\s*\{([^}]*)\}/g;
  let match;
  
  while ((match = scopeRegex.exec(dslText)) !== null) {
      const name = match[1];
      const bodyText = match[2];

      const rootMatch = /root\s*=\s*"([^"]+)"/.exec(bodyText);
      const depthMatch = /depth\s*=\s*(-?\d+)/.exec(bodyText);
      const modeMatch = /mode\s*=\s*"([^"]+)"/.exec(bodyText);
      const includeMatch = /include\s*=\s*\[(.*?)\]/.exec(bodyText);

      const include = includeMatch
          ? includeMatch[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean)
          : [];

      if (!rootMatch) return { error: `invalid scope [${name}]: missing root` };
      const depthNum = depthMatch ? parseInt(depthMatch[1], 10) : 1;
      if (depthNum <= 0 && depthNum !== -1) return { error: `invalid depth in [${name}]: ${depthNum}` };
      const mode = (modeMatch ? modeMatch[1].toLowerCase() : "all");
      if (mode !== 'all' && mode !== 'pick') {
        return { error: `invalid mode in [${name}]: ${mode}` };
      }

      scopes.push({
          name,
          root: rootMatch[1],
          depth: depthNum,
          mode: mode as "all" | "pick",
          include
      });
  }

  if (dslText.trim() && scopes.length === 0) {
      return { error: 'Syntax Error: Could not parse any valid scopes.' };
  }

  const treeNodes = new Map<string, MapNode>();
  function traverse(node: MapNode) {
      treeNodes.set(node.id, node);
      if (node.children) {
          node.children.forEach(traverse);
      }
  }
  traverse(tree);

  // Validate rules
  for (const scope of scopes) {
      if (!treeNodes.has(scope.root)) {
          return { error: `Node [${scope.root}] not found` };
      }
      for (const inc of scope.include) {
          if (!inc.startsWith('@') && !treeNodes.has(inc)) {
              return { error: `Node [${inc}] not found` };
          }
      }
  }

  const selectedIds = new Set<string>();
  const executedScopes = new Set<string>();

  function runScope(scopeName: string) {
      if (executedScopes.has(scopeName)) return;
      executedScopes.add(scopeName);

      const scope = scopes.find(s => s.name === scopeName);
      if (!scope) return;

      const rootNode = treeNodes.get(scope.root);
      if (!rootNode) return;

      function hasIncludedDescendant(node: MapNode, includeIds: string[]): boolean {
          if (includeIds.includes(node.id)) return true;
          if (node.children) {
              return node.children.some((c) => hasIncludedDescendant(c, includeIds));
          }
          return false;
      }

      const includeNodeIds = scope.include.filter(i => !i.startsWith('@'));

      function collect(node: MapNode, currentDepth: number) {
          if (scope!.depth !== -1 && currentDepth > scope!.depth) return;

          selectedIds.add(node.id);

          if (node.children) {
              node.children.forEach((child) => {
                  if (scope!.mode === 'all') {
                      collect(child, currentDepth + 1);
                  } else if (scope!.mode === 'pick') {
                      if (includeNodeIds.includes(child.id) || hasIncludedDescendant(child, includeNodeIds)) {
                          collect(child, currentDepth + 1);
                      }
                  }
              });
          }
      }

      collect(rootNode, 1);

      scope.include.forEach(inc => {
          if (inc.startsWith('@')) {
              const dep = inc.substring(1);
              if (scopes.some(s => s.name === dep)) {
                  runScope(dep);
              }
          }
      });
  }

  scopes.forEach(s => runScope(s.name));

  return Array.from(selectedIds);
}
