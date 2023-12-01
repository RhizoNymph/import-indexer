import { NodeID } from "./node";

export interface Edge {
    source: NodeID;
    target: NodeID;
  }
  
export interface WeightedEdge extends Edge {
  weight: number;
}