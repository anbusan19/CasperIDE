
import { GoogleGenAI } from "@google/genai";

export const generateChatResponse = async (
  message: string, 
  contextCode: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key is missing. Please check your environment configuration.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Coding tasks should use gemini-3-pro-preview
    const model = 'gemini-3-pro-preview';
    
    const systemInstruction = `You are Caspier AI, an intelligent coding assistant embedded in a Casper Network IDE. 
    You are an expert in Rust (no_std), WebAssembly (WASM), Casper Smart Contracts, and the casper-js-sdk.
    Your personality is helpful, concise, and technical.
    
    The user may provide context from multiple files in the workspace.
    
    Current Code Context:
    \`\`\`
    ${contextCode}
    \`\`\`
    
    When answering questions, prioritize the context of the code provided above if relevant.
    If the user mentions a specific file (e.g., @main.rs), use the provided context for that file.
    If asked to find errors, check the provided code carefully for logical and syntax errors (specifically Rust borrowing/ownership).
    If the user asks to generate code, provide it in clean markdown blocks.
    Do not use unnecessary conversational filler. Be direct and efficient like a senior engineer.`;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error processing your request. Please try again.";
  }
};