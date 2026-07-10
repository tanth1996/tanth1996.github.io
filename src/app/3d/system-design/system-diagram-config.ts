import * as THREE from 'three';

export default interface SystemDiagramConfig {
  nodes: DiagramNode[];
  connections: DiagramConnection[];
}

interface DiagramNode {
  id: string;
  name: string;
  geometryType: 'box' | 'cylinder' | 'sphere';
  position: THREE.Vector3;
  logoUrl: string;
  color: number;
  wireframeColor: number;
  size?: [number, number, number] | [number, number, number, number]; // dimensions
}

interface DiagramConnection {
  from: string;
  to: string;
  color: number;
  isBidirectional: boolean;
}
