import { NodeID } from "./node";

export type GroupID = string;

export interface Group {
  id: GroupID;
  nodes: NodeID[];
}
