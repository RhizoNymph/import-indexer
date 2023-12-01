import { Graph, GraphID } from "../types/graph";
import { Node, NodeID, NodeProps, NodeType } from "../types/node";
import { Edge } from "../types/edge";
import { Group, GroupID } from "../types/group";
import { ImportStructure, isImportStructure } from "../types/common";

export function collapseImports(graph: Graph): Graph {
  const newNodes = graph.nodes.map(node => {
    if (node.isImport) {
      node.collapsed = true;
    }
    return node;
  });

  return { ...graph, nodes: newNodes };
}

export function collapseAllButRoot(graph: Graph): Graph {
  const newNodes = graph.nodes.map(node => {
    if (node.depth !== 0) {
      return node.toggleCollapse();
    }
    return node;
  });

  if (newNodes) {
    return { ...graph, nodes: newNodes };
  }
}

var nodes: Node<any>[] = [];
var links: Edge[] = [];
export function fromImportStructure(importStructure: ImportStructure, parentId: NodeID = 'root', depth: number = 0): Graph {
  // Create a root node when parentId is 'root'
  if (parentId === 'root') {
    const rootNode = new Node('root', 'root', 'graph', 'group', 0, NodeType.Directory, false, {});
    nodes.push(rootNode);
    depth = 1; // Start depth from 1 for the first layer of nodes
  }

  for (const key in importStructure) {
    const label = key; // Label is the directory/file/import name for the current node
    const group = parentId !== 'root' ? parentId : undefined; // Set the group of the node to the prefix of all previous node ids in the branch up to root
    const nodeId = group ? `${group}.${label}` : label;
    
    let nodeType: NodeType;
    if (key.endsWith('.rs')) {
      nodeType = NodeType.File;
    } else {
      nodeType = NodeType.Directory;
    }

    const node = new Node(nodeId, label, 'graph', group, depth, nodeType, false, {});
    nodes.push(node);

    // Create an edge from root to each node with depth one
    if (depth === 1) {
      const edge: Edge = { source: 'root', target: nodeId };
      links.push(edge);
    }

    if (parentId !== 'root') {
      const edge: Edge = { source: parentId, target: nodeId };
      links.push(edge);
    }

    if (typeof importStructure[key] === 'object' && !Array.isArray(importStructure[key])) {
      const subGraph = fromImportStructure(importStructure[key] as ImportStructure, nodeId, depth + 1);
      nodes.push(...subGraph.nodes);
      links.push(...subGraph.links);
    } else if (Array.isArray(importStructure[key])) {
      const imports = importStructure[key] as string[];
      imports.forEach((importName, index) => {
        const label = importName;
        const importGroup = 'import';
        const importId = `${importGroup}.${label}`; // Import id is "import." prepended to the label
    
        // Check if a node with the same id already exists
        const existingNode = nodes.find(node => node.id === importId);
        
        if (!existingNode) {
          // If it doesn't exist, create a new node
          const importNode = new Node(importId, label, 'graph', importGroup, depth + 1, NodeType.Import, false, {});
          nodes.push(importNode);
        }
    
        // Create an edge from the import to the node that came before it
        const edge: Edge = { source: nodeId, target: importId };
        links.push(edge);
      });
    }
  }
  const graph = { id: 'graph', nodes: nodes, links: links, groups: [] }
  
  nodes = [];
  links = [];

  return graph;
}