
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

    CRITICAL COMPILATION RULES (Must Follow for Code Generation):
    1. HOST ENVIRONMENT: The remote compiler uses Rust 'nightly-2024-10-01' with 'wasm32-unknown-unknown'.
    2. DEPENDENCIES: 
       - casper-contract = "3.0.0"
       - casper-types = "3.0.0"
       - wee_alloc = "0.4.5"
    3. NO_STD REQUIRED: Contracts MUST start with '#![no_std]' and '#![no_main]'.
    4. ALLOCATOR REQUIRED: You MUST include the global allocator:
       \`\`\`rust
       extern crate alloc;
       #[global_allocator]
       static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
       \`\`\`
    5. PANIC HANDLER REQUIRED: You MUST include a panic handler:
       \`\`\`rust
       use core::panic::PanicInfo;
       #[panic_handler]
       fn panic(_info: &PanicInfo) -> ! { loop {} }
       \`\`\`
    6. IMPORTS: Use 'casper_types' (NOT 'casper_types_v2') and 'casper_contract'.
    
    Current Code Context:
    \`\`\`
    ${contextCode}
    \`\`\`
    
    When answering questions, prioritize the context of the code provided above if relevant.
    If the user mentions a specific file (e.g., @main.rs), use the provided context for that file.
    If asked to find errors, check the provided code carefully for logical and syntax errors (specifically Rust borrowing/ownership).
    If the user asks to generate code, provide it in clean markdown blocks conforming to the CRITICAL COMPILATION RULES above.
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