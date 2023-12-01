import { GraphID } from "./graph";
import { GroupID } from "./group";

export type NodeID = string;

export interface NodeProps {
  parents?: NodeID[];
  children?: NodeID[];
}

export enum NodeType {
  Directory = 'directory',
  File = 'file',
  Import = 'import'
}
  
export class Node<T extends NodeProps> {
  id: NodeID;
  name: string;
  type: NodeType;
  graph: GraphID;
  group: GroupID;
  depth: number;
  isImport: boolean;
  collapsed: boolean;
  data: T;

  constructor(id: NodeID, name: string, graph: GraphID, group: GroupID, depth: number, type: NodeType, collapsed: boolean, data: T) {
    this.id = id;
    this.name = name;
    this.graph = graph;
    this.group = group;
    this.depth = depth;
    this.type = type;
    this.collapsed = collapsed;
    this.data = data;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    return this;
  }
}
  
export type ChildNode = Node<{ parents: NodeID[] }>;
export type ParentNode = Node<{ children: NodeID[] }>;
export type CompositeNode = Node<{ parents: NodeID[], children: NodeID[] }>;