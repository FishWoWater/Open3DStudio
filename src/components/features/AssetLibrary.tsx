/**
 * Asset Library Component
 * Browse, preview, and manage 3D assets
 * Uses existing dependencies - no additional packages needed
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stage } from '@react-three/drei';
import { indexedDBStorage, StoredAsset } from '../../services/indexedDBStorage';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface AssetLibraryProps {
  projectId?: string;
  onAssetSelect?: (asset: StoredAsset) => void;
}

const AssetPreview: React.FC<{ asset: StoredAsset }> = ({ asset }) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();

    // Convert ArrayBuffer to Blob URL
    const blob = new Blob([asset.data], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);

    loader.load(
      url,
      (gltf) => {
        setModel(gltf.scene);
        URL.revokeObjectURL(url);
      },
      undefined,
      (error) => {
        console.error('Failed to load model:', error);
        URL.revokeObjectURL(url);
      }
    );

    return () => {
      if (model) {
        model.traverse((child) => {
          if ((child as THREE.Mesh).geometry) {
            (child as THREE.Mesh).geometry.dispose();
          }
          if ((child as THREE.Mesh).material) {
            const meshMaterial = (child as THREE.Mesh).material;
            const materials: THREE.Material[] = Array.isArray(meshMaterial)
              ? meshMaterial
              : [meshMaterial];
            materials.forEach((material) => material.dispose());
          }
        });
      }
    };
  }, [asset.data]);

  return (
    <>
      {model && (
        <Stage
          intensity={0.5}
          environment="city"
          shadows={{
            type: 'contact',
            opacity: 0.4,
            blur: 1
          }}
          adjustCamera={1.5}
        >
          <primitive object={model} />
        </Stage>
      )}
    </>
  );
};

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  projectId,
  onAssetSelect
}) => {
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<StoredAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'glb' | 'gltf' | 'obj'>('all');
  const [stats, setStats] = useState({ assetCount: 0, totalSize: 0, projectCount: 0 });

  useEffect(() => {
    loadAssets();
    loadStats();
  }, [projectId, filter]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      let loadedAssets = await indexedDBStorage.getAllAssets(projectId);

      if (filter !== 'all') {
        loadedAssets = loadedAssets.filter(asset => asset.type === filter);
      }

      setAssets(loadedAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const storageStats = await indexedDBStorage.getStorageStats();
    setStats(storageStats);
  };

  const handleAssetClick = (asset: StoredAsset) => {
    setSelectedAsset(asset);
    onAssetSelect?.(asset);
  };

  const handleDelete = async (asset: StoredAsset) => {
    if (confirm(`Delete ${asset.name}?`)) {
      await indexedDBStorage.deleteAsset(asset.id);
      loadAssets();
      loadStats();
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Container>
      <Header>
        <Title>3D Asset Library</Title>
        <Stats>
          <StatItem>
            <StatValue>{stats.assetCount}</StatValue>
            <StatLabel>Assets</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{formatBytes(stats.totalSize)}</StatValue>
            <StatLabel>Storage Used</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.projectCount}</StatValue>
            <StatLabel>Projects</StatLabel>
          </StatItem>
        </Stats>
      </Header>

      <Toolbar>
        <FilterGroup>
          <FilterLabel>Filter:</FilterLabel>
          <FilterButton
            $active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>
          <FilterButton
            $active={filter === 'glb'}
            onClick={() => setFilter('glb')}
          >
            GLB
          </FilterButton>
          <FilterButton
            $active={filter === 'gltf'}
            onClick={() => setFilter('gltf')}
          >
            GLTF
          </FilterButton>
        </FilterGroup>

        <ActionButton onClick={loadAssets}>
          🔄 Refresh
        </ActionButton>
      </Toolbar>

      <Content>
        <AssetGrid>
          {loading ? (
            <LoadingMessage>Loading assets...</LoadingMessage>
          ) : assets.length === 0 ? (
            <EmptyMessage>
              <EmptyIcon>📦</EmptyIcon>
              <EmptyText>No assets yet</EmptyText>
              <EmptySubtext>Generate some 3D assets to get started!</EmptySubtext>
            </EmptyMessage>
          ) : (
            assets.map((asset) => (
              <AssetCard
                key={asset.id}
                $selected={selectedAsset?.id === asset.id}
                onClick={() => handleAssetClick(asset)}
              >
                <AssetPreviewContainer>
                  <Canvas>
                    <PerspectiveCamera makeDefault position={[3, 3, 3]} />
                    <OrbitControls
                      enableZoom={false}
                      autoRotate
                      autoRotateSpeed={2}
                    />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={0.8} />
                    <AssetPreview asset={asset} />
                  </Canvas>
                </AssetPreviewContainer>

                <AssetInfo>
                  <AssetName>{asset.name}</AssetName>
                  <AssetMeta>
                    <MetaItem>
                      <MetaIcon>📄</MetaIcon>
                      {asset.type.toUpperCase()}
                    </MetaItem>
                    <MetaItem>
                      <MetaIcon>💾</MetaIcon>
                      {formatBytes(asset.metadata.size)}
                    </MetaItem>
                  </AssetMeta>
                  <AssetDate>
                    {formatDate(asset.metadata.createdAt)}
                  </AssetDate>
                </AssetInfo>

                <AssetActions>
                  <ActionIcon
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset);
                    }}
                  >
                    🗑️
                  </ActionIcon>
                </AssetActions>
              </AssetCard>
            ))
          )}
        </AssetGrid>

        {selectedAsset && (
          <DetailPanel>
            <DetailHeader>
              <DetailTitle>Asset Details</DetailTitle>
              <CloseButton onClick={() => setSelectedAsset(null)}>
                ✕
              </CloseButton>
            </DetailHeader>

            <DetailPreview>
              <Canvas>
                <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                <OrbitControls />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={0.8} />
                <AssetPreview asset={selectedAsset} />
              </Canvas>
            </DetailPreview>

            <DetailInfo>
              <InfoRow>
                <InfoLabel>Name:</InfoLabel>
                <InfoValue>{selectedAsset.name}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Type:</InfoLabel>
                <InfoValue>{selectedAsset.type.toUpperCase()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Size:</InfoLabel>
                <InfoValue>{formatBytes(selectedAsset.metadata.size)}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Created:</InfoLabel>
                <InfoValue>{formatDate(selectedAsset.metadata.createdAt)}</InfoValue>
              </InfoRow>
              {selectedAsset.metadata.tags && (
                <InfoRow>
                  <InfoLabel>Tags:</InfoLabel>
                  <TagList>
                    {selectedAsset.metadata.tags.map((tag, i) => (
                      <Tag key={i}>{tag}</Tag>
                    ))}
                  </TagList>
                </InfoRow>
              )}
            </DetailInfo>
          </DetailPanel>
        )}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
  color: white;
`;

const Header = styled.div`
  padding: 20px;
  background: #16213e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 16px 0;
  font-size: 24px;
`;

const Stats = styled.div`
  display: flex;
  gap: 24px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #4ecdc4;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Toolbar = styled.div`
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterLabel = styled.span`
  color: #aaa;
  margin-right: 8px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#4ecdc4' : 'transparent'};
  color: ${props => props.$active ? '#1a1a2e' : 'white'};
  border: 1px solid ${props => props.$active ? '#4ecdc4' : 'rgba(255, 255, 255, 0.2)'};
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? '#4ecdc4' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const ActionButton = styled.button`
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
  border: 1px solid #4ecdc4;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: rgba(78, 205, 196, 0.3);
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const AssetGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
  align-content: start;
`;

const LoadingMessage = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 16px;
`;

const EmptyMessage = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 20px;
  color: #aaa;
  margin-bottom: 8px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #666;
`;

const AssetCard = styled.div<{ $selected?: boolean }>`
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${props => props.$selected ? '#4ecdc4' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    border-color: ${props => props.$selected ? '#4ecdc4' : 'rgba(255, 255, 255, 0.3)'};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
`;

const AssetPreviewContainer = styled.div`
  width: 100%;
  height: 150px;
  background: rgba(0, 0, 0, 0.3);
`;

const AssetInfo = styled.div`
  padding: 12px;
`;

const AssetName = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AssetMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetaIcon = styled.span`
  font-size: 10px;
`;

const AssetDate = styled.div`
  font-size: 11px;
  color: #666;
`;

const AssetActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${AssetCard}:hover & {
    opacity: 1;
  }
`;

const ActionIcon = styled.button`
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 107, 107, 0.9);
    transform: scale(1.1);
  }
`;

const DetailPanel = styled.div`
  width: 400px;
  background: #16213e;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const DetailTitle = styled.h3`
  margin: 0;
  font-size: 18px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const DetailPreview = styled.div`
  height: 300px;
  background: rgba(0, 0, 0, 0.3);
`;

const DetailInfo = styled.div`
  padding: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
`;

const InfoLabel = styled.div`
  width: 80px;
  color: #aaa;
  font-size: 13px;
`;

const InfoValue = styled.div`
  flex: 1;
  font-size: 13px;
`;

const TagList = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
`;
