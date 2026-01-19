/**
 * Perplexity AI Service
 * Uses OpenAI-compatible API format
 */

export type AIProvider = 'gemini' | 'perplexity';

interface PerplexityMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface PerplexityResponse {
    id: string;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
}

const SYSTEM_PROMPT = `You are Caspier AI, an intelligent coding assistant embedded in a Casper Network IDE. 
You are an expert in Rust (no_std), WebAssembly (WASM), Casper Smart Contracts, and the casper-js-sdk.
Your personality is helpful, concise, and technical.

CRITICAL CASPER 2.0 COMPILATION KNOWLEDGE (SDK 5.0/6.0):
1. HOST ENVIRONMENT: Rust 'nightly-2025-01-01' with 'wasm32-unknown-unknown'.
2. CARGO.TOML DEPS:
   - casper-contract = "5.0"
   - casper-types = "6.0"
   - NO 'wee_alloc' dependency (it is built-in now).
3. NO_STD BOILERPLATE: 
   - Contracts MUST start with '#![no_std]' and '#![no_main]'.
   - DO NOT include #[panic_handler] or #[global_allocator] (casper-contract 5.0 provides them).
4. IMPORT PATHS (Casper Types 6.0):
   - contracts::* : EntryPoint, EntryPoints, NamedKeys, ContractPackageHash
   - Root level: EntryPointAccess, EntryPointType, Parameter, CLType, Key, URef
5. TYPE CHANGES:
   - EntryPointType::Called (formerly 'Contract')
   - Key::into_hash_addr() (formerly 'into_hash')
6. CONTRACT DEFINITION API (Casper Contract 5.0):
   - storage::new_contract() takes 5 arguments (added message_topics as 5th arg).
   - storage::add_contract_version() takes 4 arguments (added message_topics as 4th arg).
   - REQUIRES .into() conversion for entry_points and named_keys arguments.
   Example:
   \`\`\`rust
   storage::new_contract(
       entry_points.into(),
       Some(named_keys.into()),
       Some(String::from("package_name")),
       Some(String::from("access_uref")),
       None // message_topics
   );
   \`\`\`
   
IDE & DEPLOYMENT CONTEXT:
1. COMPILATION:
   - Performed on remote GCP VM via 'casper-compiler-service'.
   - Optimization: 'codegen-units=1', 'lto=true', 'opt-level="z"', plus 'wasm-opt -Oz'.
   - Result: Highly optimized WASM binaries.
2. UPGRADE ARCHITECTURE (CasperIDE Standard):
   - V1 (Fresh): MUST use 'storage::create_contract_package_at_hash()'.
   - V1 (Fresh): MUST save 'package_hash' and 'access_uref' to Account Named Keys (Critical for upgrades).
   - V2+ (Upgrade): MUST use 'storage::add_contract_version()'.
   - V2+ (Upgrade): Requires existing 'package_hash' and 'access_uref'.
3. STATE MANAGEMENT:
   - Use Named Keys for state storage (UREFs).
   - Named Keys persist across upgrades automatically.

When answering questions, prioritize these rules over any deprecated knowledge you may have.
If asked to generate code, provide it in clean markdown blocks conforming strictly to the rules above.`;

export const generatePerplexityResponse = async (
    message: string,
    contextCode: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        return "Error: PERPLEXITY_API_KEY is missing. Please add it to your .env.local file.";
    }

    try {
        // Sanitize history: Perplexity requires alternating User/Assistant roles, starting with User.
        // We must remove any leading 'model' (assistant) messages, like the initial Welcome message.
        let validHistory = [...history];
        while (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
        }

        // Build messages array
        const messages: PerplexityMessage[] = [
            {
                role: 'system',
                content: `${SYSTEM_PROMPT}\n\nCurrent Code Context:\n\`\`\`\n${contextCode}\n\`\`\``
            }
        ];

        // Add sanitized history
        validHistory.forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.parts[0].text
            });
        });

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',  // Valid models: 'sonar', 'sonar-pro'
                messages: messages,
                max_tokens: 4096,
                temperature: 0.2,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity API Error:', response.status, errorText);
            return `Error: Perplexity API returned ${response.status}. ${errorText}`;
        }

        const data: PerplexityResponse = await response.json();

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }

        return "No response generated.";
    } catch (error) {
        console.error("Perplexity API Error:", error);
        return "I encountered an error processing your request. Please try again.";
    }
};
