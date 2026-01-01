/**
 * Physics Wrapper Component using @react-three/rapier
 * Provides physics simulation for 3D objects with collision detection
 */

import React, { ReactNode, Suspense } from 'react';
import { Physics, RigidBody, CuboidCollider, BallCollider, CapsuleCollider } from '@react-three/rapier';
import type { RigidBodyProps, RapierRigidBody } from '@react-three/rapier';

/**
 * Physics world configuration
 * @property gravity - [x, y, z] gravity forces in m/s². Default: [0, -9.81, 0] (Earth gravity)
 * @property debug - Enable visual debug rendering of physics bodies
 * @property timestep - Physics timestep. Use number for fixed timestep or 'vary' for variable
 * @property interpolate - Interpolate physics state between frames for smoother rendering
 * @property paused - Pause physics simulation
 */
export interface PhysicsConfig {
  gravity: [number, number, number];
  debug?: boolean;
  timestep?: number | 'vary';
  interpolate?: boolean;
  paused?: boolean;
}

/**
 * Default physics configuration
 */
export const defaultPhysicsConfig: PhysicsConfig = {
  gravity: [0, -9.81, 0],
  debug: false,
  timestep: 1 / 60,
  interpolate: true,
  paused: false
};

/**
 * Game-oriented physics config with adjusted gravity
 */
export const gamePhysicsConfig: PhysicsConfig = {
  gravity: [0, -20, 0], // Higher gravity for more responsive gameplay
  debug: false,
  timestep: 1 / 60,
  interpolate: true,
  paused: false
};

/**
 * Zero gravity config for space games
 */
export const zeroGravityConfig: PhysicsConfig = {
  gravity: [0, 0, 0],
  debug: false,
  timestep: 1 / 60,
  interpolate: true,
  paused: false
};

interface PhysicsWorldProps {
  children: ReactNode;
  config?: PhysicsConfig;
}

/**
 * Physics World Wrapper
 * Wrap your 3D scene with this to enable physics simulation
 */
export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({ 
  children, 
  config = defaultPhysicsConfig 
}) => {
  return (
    <Suspense fallback={null}>
      <Physics
        gravity={config.gravity}
        debug={config.debug}
        timeStep={config.timestep}
        interpolate={config.interpolate}
        paused={config.paused}
      >
        {children}
      </Physics>
    </Suspense>
  );
};

/**
 * Collider dimension arguments for different collider types
 */
export interface ColliderArgs {
  /** Cuboid dimensions: [halfWidth, halfHeight, halfDepth] */
  cuboid?: [number, number, number];
  /** Ball radius */
  ball?: [number];
  /** Capsule dimensions: [halfHeight, radius] */
  capsule?: [number, number];
}

interface DynamicBodyProps {
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  mass?: number;
  restitution?: number;
  friction?: number;
  colliderType?: 'cuboid' | 'ball' | 'capsule' | 'auto';
  /** Custom collider dimensions. If not provided, uses default sizes */
  colliderArgs?: ColliderArgs;
  onCollision?: (event: unknown) => void;
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
}

/**
 * Dynamic Physics Body
 * Objects that move and respond to forces
 */
export const DynamicBody: React.FC<DynamicBodyProps> = ({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  mass = 1,
  restitution = 0.3,
  friction = 0.5,
  colliderType = 'auto',
  colliderArgs,
  onCollision,
  rigidBodyRef
}) => {
  // Default collider sizes
  const cuboidSize = colliderArgs?.cuboid ?? [0.5, 0.5, 0.5];
  const ballRadius = colliderArgs?.ball ?? [0.5];
  const capsuleSize = colliderArgs?.capsule ?? [0.25, 0.5];

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      rotation={rotation}
      mass={mass}
      restitution={restitution}
      friction={friction}
      colliders={colliderType === 'auto' ? 'hull' : false}
      onCollisionEnter={onCollision}
    >
      {colliderType === 'cuboid' && <CuboidCollider args={cuboidSize} />}
      {colliderType === 'ball' && <BallCollider args={ballRadius} />}
      {colliderType === 'capsule' && <CapsuleCollider args={capsuleSize} />}
      {children}
    </RigidBody>
  );
};

interface StaticBodyProps {
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  restitution?: number;
  friction?: number;
  colliderType?: 'cuboid' | 'auto';
  /** Custom collider dimensions for cuboid: [halfWidth, halfHeight, halfDepth] */
  colliderArgs?: [number, number, number];
}

/**
 * Static Physics Body
 * Objects that don't move but can be collided with (floors, walls, etc.)
 */
export const StaticBody: React.FC<StaticBodyProps> = ({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  restitution = 0.1,
  friction = 0.8,
  colliderType = 'auto',
  colliderArgs = [5, 0.5, 5]
}) => {
  return (
    <RigidBody
      type="fixed"
      position={position}
      rotation={rotation}
      restitution={restitution}
      friction={friction}
      colliders={colliderType === 'auto' ? 'hull' : false}
    >
      {colliderType === 'cuboid' && <CuboidCollider args={colliderArgs} />}
      {children}
    </RigidBody>
  );
};

interface KinematicBodyProps {
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
}

/**
 * Kinematic Physics Body
 * Objects that move programmatically but still collide with others
 * Useful for player controllers and moving platforms
 */
export const KinematicBody: React.FC<KinematicBodyProps> = ({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  rigidBodyRef
}) => {
  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={position}
      rotation={rotation}
      colliders="hull"
    >
      {children}
    </RigidBody>
  );
};

interface GroundPlaneProps {
  size?: [number, number];
  position?: [number, number, number];
  color?: string;
  visible?: boolean;
}

/**
 * Ground Plane with Physics
 * A simple floor that objects can stand on
 */
export const GroundPlane: React.FC<GroundPlaneProps> = ({
  size = [100, 100],
  position = [0, 0, 0],
  color = '#3a3a3a',
  visible = true
}) => {
  return (
    <RigidBody type="fixed" position={position} friction={0.8} restitution={0.1}>
      <CuboidCollider args={[size[0] / 2, 0.1, size[1] / 2]} />
      {visible && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={size} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </RigidBody>
  );
};

/**
 * Example: Physics Demo Scene
 * Shows how to use the physics components together
 */
export const PhysicsDemoScene: React.FC = () => {
  return (
    <PhysicsWorld config={{ ...defaultPhysicsConfig, debug: false }}>
      {/* Ground */}
      <GroundPlane size={[20, 20]} position={[0, -1, 0]} />
      
      {/* Falling box */}
      <DynamicBody position={[0, 5, 0]} colliderType="cuboid" restitution={0.5}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      </DynamicBody>
      
      {/* Falling sphere */}
      <DynamicBody position={[1, 8, 0]} colliderType="ball" restitution={0.8}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </DynamicBody>
      
      {/* Static obstacle */}
      <StaticBody position={[0, 0, 0]} colliderType="cuboid">
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3, 0.5, 3]} />
          <meshStandardMaterial color="#95a5a6" />
        </mesh>
      </StaticBody>
    </PhysicsWorld>
  );
};

// Export all components and types
export { Physics, RigidBody, CuboidCollider, BallCollider, CapsuleCollider };
export type { RigidBodyProps, RapierRigidBody };
