import { Node } from './node';
import { Edge } from './edge';
import { Group } from './group';

export type GraphID = string;

export interface Graph {
  id: GraphID;
  nodes: Node<any>[];
  links: Edge[];
  groups: Group[];
}

