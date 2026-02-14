
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const processImage = async (
  prompt: string,
  aspectRatio: AspectRatio = "1:1",
  base64Image?: string,
  mimeType?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (base64Image && mimeType) {
    contents.parts.push({
      inlineData: {
        data: base64Image.split(',')[1] || base64Image,
        mimeType: mimeType
      }
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from AI model.");
    }

    let resultImageUrl = '';
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        resultImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultImageUrl) {
       if (response.text) {
         throw new Error(`AI returned text instead of image: ${response.text}`);
       }
       throw new Error("No image data found in the AI response.");
    }

    return resultImageUrl;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process image request.");
  }
};
