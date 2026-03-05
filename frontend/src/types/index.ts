export interface Node {
  id: string;
  campaign_id: string;
  name: string;
  type: string;
  description: string | null;
  properties: Record<string, string>;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface NodeCreate {
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, string>;
  tags?: string[];
}

export interface NodeUpdate {
  name?: string;
  type?: string;
  description?: string;
  properties?: Record<string, string>;
  tags?: string[];
}

export interface Edge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  type: string;
  weight: number;
  properties: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface EdgeWithNames {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_node_name: string;
  target_node_name: string;
  type: string;
  weight: number;
  properties: Record<string, string>;
}

export interface EdgeCreate {
  source_node_id: string;
  target_node_id: string;
  type: string;
  weight?: number;
  properties?: Record<string, string>;
}

export interface EdgeUpdate {
  type?: string;
  weight?: number;
  properties?: Record<string, string>;
}

export interface NodeFilters {
  type?: string;
  search?: string;
  tags?: string[];
  is_archived?: boolean;
}
