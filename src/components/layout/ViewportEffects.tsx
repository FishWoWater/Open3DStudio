/**
 * Post-Processing Effects Component
 * Adds professional visual effects to the 3D viewport using @react-three/postprocessing
 */

import React, { useMemo } from 'react';
import { 
  EffectComposer, 
  Bloom, 
  Vignette,
  ToneMapping
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

/**
 * Post-processing effects configuration
 */
export interface PostProcessingConfig {
  enabled: boolean;
  bloom: {
    enabled: boolean;
    intensity: number;
    luminanceThreshold: number;
    luminanceSmoothing: number;
  };
  vignette: {
    enabled: boolean;
    offset: number;
    darkness: number;
  };
  toneMapping: {
    enabled: boolean;
    mode: ToneMappingMode;
  };
}

/**
 * Default post-processing configuration
 */
export const defaultPostProcessingConfig: PostProcessingConfig = {
  enabled: true,
  bloom: {
    enabled: true,
    intensity: 0.5,
    luminanceThreshold: 0.6,
    luminanceSmoothing: 0.5
  },
  vignette: {
    enabled: true,
    offset: 0.3,
    darkness: 0.5
  },
  toneMapping: {
    enabled: true,
    mode: ToneMappingMode.ACES_FILMIC
  }
};

/**
 * Minimal configuration for better performance
 */
export const minimalPostProcessingConfig: PostProcessingConfig = {
  enabled: true,
  bloom: {
    enabled: true,
    intensity: 0.3,
    luminanceThreshold: 0.8,
    luminanceSmoothing: 0.9
  },
  vignette: {
    enabled: true,
    offset: 0.4,
    darkness: 0.3
  },
  toneMapping: {
    enabled: true,
    mode: ToneMappingMode.ACES_FILMIC
  }
};

/**
 * Cinematic configuration for high-quality renders
 */
export const cinematicPostProcessingConfig: PostProcessingConfig = {
  enabled: true,
  bloom: {
    enabled: true,
    intensity: 0.8,
    luminanceThreshold: 0.4,
    luminanceSmoothing: 0.3
  },
  vignette: {
    enabled: true,
    offset: 0.2,
    darkness: 0.7
  },
  toneMapping: {
    enabled: true,
    mode: ToneMappingMode.ACES_FILMIC
  }
};

interface ViewportEffectsProps {
  config?: PostProcessingConfig;
}

/**
 * Bloom Only Effect - for simpler scenes
 */
export const BloomEffect: React.FC<{ config: PostProcessingConfig['bloom'] }> = ({ config }) => {
  if (!config.enabled) return null;
  
  return (
    <EffectComposer>
      <Bloom
        intensity={config.intensity}
        luminanceThreshold={config.luminanceThreshold}
        luminanceSmoothing={config.luminanceSmoothing}
        blendFunction={BlendFunction.ADD}
      />
    </EffectComposer>
  );
};

/**
 * Full Viewport Effects with all effects enabled
 * Use this when you want bloom and vignette together
 */
export const FullViewportEffects: React.FC<{ config: PostProcessingConfig }> = ({ config }) => {
  return (
    <EffectComposer>
      <Bloom
        intensity={config.bloom.intensity}
        luminanceThreshold={config.bloom.luminanceThreshold}
        luminanceSmoothing={config.bloom.luminanceSmoothing}
        blendFunction={BlendFunction.ADD}
      />
      <Vignette
        offset={config.vignette.offset}
        darkness={config.vignette.darkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <ToneMapping mode={config.toneMapping.mode} />
    </EffectComposer>
  );
};

/**
 * Viewport Post-Processing Effects Component
 * Add this inside your Canvas component to enable visual effects
 * Renders different effect combinations based on configuration
 */
export const ViewportEffects: React.FC<ViewportEffectsProps> = ({ 
  config = defaultPostProcessingConfig 
}) => {
  if (!config.enabled) {
    return null;
  }

  // All effects enabled - use full composer
  if (config.bloom.enabled && config.vignette.enabled && config.toneMapping.enabled) {
    return <FullViewportEffects config={config} />;
  }

  // Only bloom enabled
  if (config.bloom.enabled && !config.vignette.enabled) {
    return <BloomEffect config={config.bloom} />;
  }

  // Only vignette enabled
  if (config.vignette.enabled && !config.bloom.enabled) {
    return (
      <EffectComposer>
        <Vignette
          offset={config.vignette.offset}
          darkness={config.vignette.darkness}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  // Bloom and vignette, no tone mapping
  if (config.bloom.enabled && config.vignette.enabled) {
    return (
      <EffectComposer>
        <Bloom
          intensity={config.bloom.intensity}
          luminanceThreshold={config.bloom.luminanceThreshold}
          luminanceSmoothing={config.bloom.luminanceSmoothing}
          blendFunction={BlendFunction.ADD}
        />
        <Vignette
          offset={config.vignette.offset}
          darkness={config.vignette.darkness}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  return null;
};

/**
 * Hook to create post-processing config from simple presets
 */
export const usePostProcessingPreset = (preset: 'default' | 'minimal' | 'cinematic' | 'disabled'): PostProcessingConfig => {
  return useMemo(() => {
    switch (preset) {
      case 'minimal':
        return minimalPostProcessingConfig;
      case 'cinematic':
        return cinematicPostProcessingConfig;
      case 'disabled':
        return { ...defaultPostProcessingConfig, enabled: false };
      case 'default':
      default:
        return defaultPostProcessingConfig;
    }
  }, [preset]);
};

export default ViewportEffects;
