/**
 * Unified AI Service
 * Manages AI providers (ChainGPT Web3 LLM)
 */

import { generateChainGPTResponse, AIProvider } from './chainGPTService';

// ChainGPT provider
const getDefaultProvider = (): AIProvider => 'chaingpt';

export type { AIProvider };

export const getAvailableProviders = (): { id: AIProvider; name: string; available: boolean }[] => {
    return [
        {
            id: 'chaingpt',
            name: 'ChainGPT',
            available: !!process.env.CHAINGPT_API_KEY
        }
    ];
};

export const generateAIResponse = async (
    message: string,
    contextCode: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    provider?: AIProvider
): Promise<string> => {
    // Use ChainGPT Web3 LLM
    console.log(`🤖 Using AI Provider: ChainGPT`);
    return generateChainGPTResponse(message, contextCode, history);
};

export { getDefaultProvider };
