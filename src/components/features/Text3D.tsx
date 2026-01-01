/**
 * 3D Text Component using Troika Three Text
 * Provides high-quality SDF-based text rendering in 3D scenes
 */

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text as TroikaText } from 'troika-three-text';
import * as THREE from 'three';

interface Text3DProps {
  text: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  color?: string;
  fontSize?: number;
  maxWidth?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  anchorX?: 'left' | 'center' | 'right' | number;
  anchorY?: 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom' | number;
  font?: string;
  outlineWidth?: number;
  outlineColor?: string;
  strokeWidth?: number;
  strokeColor?: string;
  fillOpacity?: number;
  outlineOpacity?: number;
  billboard?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

/**
 * Text3D Component - Renders crisp 3D text using SDF rendering
 * Perfect for UI labels, game text, and in-scene information
 */
export const Text3D: React.FC<Text3DProps> = ({
  text,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = '#ffffff',
  fontSize = 0.5,
  maxWidth = Infinity,
  lineHeight = 1.2,
  textAlign = 'center',
  anchorX = 'center',
  anchorY = 'middle',
  font,
  outlineWidth = 0,
  outlineColor = '#000000',
  strokeWidth = 0,
  strokeColor = '#000000',
  fillOpacity = 1,
  outlineOpacity = 1,
  billboard = false,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const textRef = useRef<TroikaText>();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!textRef.current) {
      textRef.current = new TroikaText();
    }

    const textObj = textRef.current;

    // Set text properties
    textObj.text = text;
    textObj.fontSize = fontSize;
    textObj.color = color;
    textObj.maxWidth = maxWidth;
    textObj.lineHeight = lineHeight;
    textObj.textAlign = textAlign;
    textObj.anchorX = anchorX;
    textObj.anchorY = anchorY;
    
    if (font) {
      textObj.font = font;
    }

    // Outline/stroke properties
    if (outlineWidth > 0) {
      textObj.outlineWidth = outlineWidth;
      textObj.outlineColor = outlineColor;
      textObj.outlineOpacity = outlineOpacity;
    }

    if (strokeWidth > 0) {
      textObj.strokeWidth = strokeWidth;
      textObj.strokeColor = strokeColor;
    }

    textObj.fillOpacity = fillOpacity;

    // Sync to update the geometry
    textObj.sync();

    if (groupRef.current) {
      groupRef.current.clear();
      groupRef.current.add(textObj);
    }

    return () => {
      if (textRef.current) {
        textRef.current.dispose();
      }
    };
  }, [
    text,
    fontSize,
    color,
    maxWidth,
    lineHeight,
    textAlign,
    anchorX,
    anchorY,
    font,
    outlineWidth,
    outlineColor,
    strokeWidth,
    strokeColor,
    fillOpacity,
    outlineOpacity,
  ]);

  // Billboard effect - always face camera
  useFrame(({ camera }) => {
    if (billboard && groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const scaleArray = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scaleArray}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
};

/**
 * FloatingText Component - Text with floating animation
 */
export const FloatingText: React.FC<Text3DProps & { floatSpeed?: number; floatDistance?: number }> = ({
  floatSpeed = 1,
  floatDistance = 0.2,
  position = [0, 0, 0],
  ...props
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * floatSpeed;
      groupRef.current.position.y = position[1] + Math.sin(t) * floatDistance;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Text3D {...props} position={[0, 0, 0]} />
    </group>
  );
};

/**
 * GameScoreText Component - Styled text for game scores
 */
export const GameScoreText: React.FC<{
  score: number;
  position?: [number, number, number];
  color?: string;
}> = ({ score, position = [0, 2, 0], color = '#FFD700' }) => {
  return (
    <Text3D
      text={`Score: ${score}`}
      position={position}
      color={color}
      fontSize={0.8}
      outlineWidth={0.05}
      outlineColor="#000000"
      billboard
    />
  );
};

/**
 * GameMessageText Component - Large centered message text
 */
export const GameMessageText: React.FC<{
  message: string;
  position?: [number, number, number];
  visible?: boolean;
}> = ({ message, position = [0, 0, 5], visible = true }) => {
  if (!visible) return null;

  return (
    <FloatingText
      text={message}
      position={position}
      color="#FFFFFF"
      fontSize={1.5}
      outlineWidth={0.08}
      outlineColor="#000000"
      floatSpeed={0.5}
      floatDistance={0.1}
      billboard
    />
  );
};

export default Text3D;
