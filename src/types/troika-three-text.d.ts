declare module 'troika-three-text' {
  import * as THREE from 'three';

  export class Text extends THREE.Mesh {
    text: string;
    fontSize: number;
    color: string | number;
    maxWidth: number;
    lineHeight: number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY: 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom' | number;
    font?: string;
    outlineWidth: number;
    outlineColor: string | number;
    outlineOpacity: number;
    strokeWidth: number;
    strokeColor: string | number;
    fillOpacity: number;
    sync(): void;
    dispose(): void;
  }
}
