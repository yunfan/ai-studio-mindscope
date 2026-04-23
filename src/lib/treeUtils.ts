export interface HighlightConfig {
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
  orientation: 'horizontal' | 'vertical';
}

export interface MapNode {
  id: string;
  title: string;
  notes: string;
  children?: MapNode[];
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function updateNodeInTree(
  tree: MapNode,
  nodeId: string,
  updater: (node: MapNode) => MapNode | null
): MapNode | null {
  if (tree.id === nodeId) {
    return updater({ ...tree });
  }

  if (tree.children) {
    const newChildren = tree.children
      .map(child => updateNodeInTree(child, nodeId, updater))
      .filter((child): child is MapNode => child !== null);
    
    // Check if children array actually changed
    // For simplicity, just return new tree
    return {
      ...tree,
      children: newChildren.length > 0 ? newChildren : undefined
    };
  }

  return tree;
}

export function addNodeToTree(
  tree: MapNode,
  parentId: string,
  newNode: MapNode
): MapNode {
  if (tree.id === parentId) {
    return {
      ...tree,
      children: [...(tree.children || []), newNode]
    };
  }

  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map(child => addNodeToTree(child, parentId, newNode))
    };
  }

  return tree;
}

export function addSiblingToTree(
  tree: MapNode,
  siblingId: string,
  newNode: MapNode
): MapNode {
  // Edge case: cannot add sibling to root
  if (tree.id === siblingId) return tree;

  if (tree.children) {
    const idx = tree.children.findIndex(c => c.id === siblingId);
    if (idx !== -1) {
      const newChildren = [...tree.children];
      newChildren.splice(idx + 1, 0, newNode);
      return {
        ...tree,
        children: newChildren
      };
    }

    return {
      ...tree,
      children: tree.children.map(child => addSiblingToTree(child, siblingId, newNode))
    };
  }

  return tree;
}

export function deleteNodeFromTree(tree: MapNode, nodeId: string): MapNode | null {
  if (tree.id === nodeId) return null; // Root deletion usually not allowed, handled higher up

  if (tree.children) {
    const filtered = tree.children.filter(c => c.id !== nodeId);
    if (filtered.length !== tree.children.length) {
      return {
        ...tree,
        children: filtered.length > 0 ? filtered : undefined
      };
    }
    
    const newChildren = tree.children
        .map(c => deleteNodeFromTree(c, nodeId))
        .filter((c): c is MapNode => c !== null);

    return {
      ...tree,
      children: newChildren.length > 0 ? newChildren : undefined
    };
  }
  return tree;
}
