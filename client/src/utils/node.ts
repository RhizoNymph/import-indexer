import { Graph } from '../types/graph';
import { Node, NodeID, ParentNode } from '../types/node';
import { interpolateWarm } from 'd3-scale-chromatic';
import { scaleSequential } from 'd3-scale';
import * as d3 from 'd3';

export function getNodeById(graph: Graph, id: NodeID) {
  return graph.nodes.find(node => node.id === id);
}

function gatherDescendantsForParent(graph: Graph, parentId: NodeID): Node<any>[] {
  const descendants: Node<any>[] = [];

  const nodeMap: { [id: string]: Node<any> } = {};
  graph.nodes.forEach(node => (nodeMap[node.id] = node));

  const parent = nodeMap[parentId] as ParentNode;

  if ('children' in parent.data) {
    for (const childId of parent.data.children) {
      const child = nodeMap[childId];
      descendants.push(child);
      const childDescendants = gatherDescendantsForParent(graph, childId);
      childDescendants.forEach(descendant => descendants.push(descendant));
    }
  }

  return descendants;
}

export function toggleDescendantsForParent(graph: Graph, parentId: NodeID): Graph {
  const descendants = gatherDescendantsForParent(graph, parentId);

  const newNodes = graph.nodes.map(node => {
    if (descendants.includes(node)) {
      node.toggleCollapse();
      return node;
    }
    return node;
  });

  return { ...graph, nodes: newNodes };
}

export function gatherChildrenForParent(graph: Graph, parentId: NodeID): Node<any>[] {
  const children: Node<any>[] = [];

  const parent = getNodeById(graph, parentId) as ParentNode;

  if ('children' in parent.data) {
    for (const childId of parent.data.children) {
      const child = getNodeById(graph, childId);
      children.push(child);
    }
  }

  return children;
}

export function toggleChildrenForParent(graph: Graph, parentId: NodeID): Graph {
  const nodeMap: { [id: string]: Node<any> } = {};
  graph.nodes.forEach(node => (nodeMap[node.id] = node));

  const parent = nodeMap[parentId] as ParentNode;
  const immediateChildren: Node<any>[] = [];

  if ('children' in parent.data) {
    for (const childId of parent.data.children) {
      const child = nodeMap[childId];
      immediateChildren.push(child);
    }
  }

  const newNodes = graph.nodes.map(node => {
    if (immediateChildren.includes(node)) {
      node.toggleCollapse();
      return node;
    }
    return node;
  });

  return { ...graph, nodes: newNodes };
}