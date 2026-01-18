---
name: Fix Advanced Parameters
overview: Add index signature to all API request type definitions to allow model-specific advanced parameters to be properly sent to the backend.
todos: []
---

# Fix Advanced Parameters Not Being Sent to Backend

## Problem

The AdvancedParameters component is used in all feature panels and the values are spread into API requests using `...advancedParams`. However, most request type interfaces in [`src/types/api.ts`](src/types/api.ts) lack the index signature `[key: string]: any;` that allows additional dynamic properties. This prevents model-specific advanced parameters from being properly typed and potentially sent to the backend.

Only `TextMeshEditingRequest` and `ImageMeshEditingRequest` currently have this index signature (lines 501, 530).

## Solution

Add the index signature `[key: string]: any;` with a comment to all request type definitions that support model-specific parameters.

## Request Types to Update

Update the following interfaces in [`src/types/api.ts`](src/types/api.ts):

1. **TextToMeshRequest** (line ~224)
2. **TextToTexturedMeshRequest** (line ~230)
3. **ImageToMeshRequest** (line ~238)
4. **ImageToTexturedMeshRequest** (line ~246)
5. **MeshPaintingRequest** (line ~258)
6. **PartCompletionRequest** (line ~271)
7. **MeshSegmentationRequest** (line ~280)
8. **AutoRiggingRequest** (line ~290)
9. **MeshRetopologyRequest** (line ~299)
10. **MeshUVUnwrappingRequest** (line ~320)

## Implementation

For each interface, add these two lines at the end (before the closing brace):

```typescript
// Model-specific parameters can be added dynamically
[key: string]: any;
```

This matches the pattern already used in `TextMeshEditingRequest` and `ImageMeshEditingRequest`.

## Verification

All feature panels already correctly spread advanced parameters:

- [`MeshGenerationPanel.tsx`](src/components/features/MeshGenerationPanel.tsx): Lines 433, 444, 482, 494
- [`MeshPaintingPanel.tsx`](src/components/features/MeshPaintingPanel.tsx): Lines 494, 531
- [`PartCompletionPanel.tsx`](src/components/features/PartCompletionPanel.tsx): Line 284
- [`AutoRiggingPanel.tsx`](src/components/features/AutoRiggingPanel.tsx): Line 335
- [`MeshRetopologyPanel.tsx`](src/components/features/MeshRetopologyPanel.tsx): Line 455
- [`MeshSegmentationPanel.tsx`](src/components/features/MeshSegmentationPanel.tsx): Line 359
- [`MeshUVUnwrappingPanel.tsx`](src/components/features/MeshUVUnwrappingPanel.tsx): Line 502

No changes needed to panel components - only type definitions need updating.