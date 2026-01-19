/**
 * Unified AI Service
 * Manages multiple AI providers (Gemini, Perplexity)
 */

// import { generateChatResponse as generateGeminiResponse } from './geminiService'; // REMOVED
import { generatePerplexityResponse, AIProvider } from './perplexityService';

// Force Perplexity provider
const getDefaultProvider = (): AIProvider => 'perplexity';

export type { AIProvider };

export const getAvailableProviders = (): { id: AIProvider; name: string; available: boolean }[] => {
    return [
        {
            id: 'perplexity',
            name: 'Perplexity',
            available: !!process.env.PERPLEXITY_API_KEY
        }
    ];
};

export const generateAIResponse = async (
    message: string,
    contextCode: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    provider?: AIProvider
): Promise<string> => {
    // Always use Perplexity
    console.log(`🤖 Using AI Provider: Perplexity`);
    return generatePerplexityResponse(message, contextCode, history);
};

export { getDefaultProvider };
