import { getColors } from "react-native-image-colors";

export const getColorFromImage = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await getColors(imageUrl, {
      fallback: '#6366f1',
      cache: true,
      key: imageUrl,
    });
    return colors.platform === 'ios' ? colors.primary : colors.dominant;
  } catch (error) {
    console.error('Error extracting color:', error);
    return '#6366f1'; // fallback color
  }
};