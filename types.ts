
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  type: 'generation' | 'edit';
  aspectRatio?: AspectRatio;
}

export interface AppState {
  prompt: string;
  selectedStyle: string;
  selectedRatio: AspectRatio;
  isGenerating: boolean;
  currentImage: string | null;
  history: GeneratedImage[];
  error: string | null;
  isEditing: boolean;
}

export const STYLES = [
  { id: 'none', label: 'Default', prompt: '' },
  { id: 'photorealistic', label: 'Photorealistic', prompt: 'high resolution, photorealistic, 8k, detailed textures, cinematic lighting' },
  { id: 'cartoonish', label: 'Cartoonish', prompt: 'cartoon style, vibrant colors, expressive characters, 2d animation aesthetic' },
  { id: 'watercolor', label: 'Watercolor', prompt: 'watercolor painting style, soft edges, bleeding colors, artistic brushstrokes, textured paper' },
  { id: 'pixel-art', label: 'Pixel Art', prompt: 'pixel art style, 8-bit, blocky, retro game aesthetic, limited color palette' },
];
