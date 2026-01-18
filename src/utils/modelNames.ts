/**
 * Strip feature-specific suffixes from model names for display purposes
 * @param modelName - The original model name from the API
 * @returns Cleaned model name for UI display
 */
export const cleanModelName = (modelName: string): string => {
  // Define suffixes to strip
  const suffixesToRemove = [
    '_text_to_raw_mesh',
    '_text_to_textured_mesh', 
    '_image_to_raw_mesh',
    '_image_to_textured_mesh',
    '_text_mesh_painting',
    '_image_mesh_painting',
    '_mesh_segmentation',
    '_part_completion',
    '_auto_rigging', 
    '_text_mesh_editing', 
    '_image_mesh_editing'
  ];

  let cleanedName = modelName;
  
  // Remove matching suffixes
  for (const suffix of suffixesToRemove) {
    if (cleanedName.endsWith(suffix)) {
      cleanedName = cleanedName.slice(0, -suffix.length);
      break; // Only remove one suffix
    }
  }
  
  return cleanedName;
};

