
import { GoogleGenAI } from "@google/genai";
import { Preference, DAILY_QUOTA } from "../types";

const getUsage = () => {
  const today = new Date().toDateString();
  const saved = localStorage.getItem('ai_usage_stats');
  if (saved) {
    const stats = JSON.parse(saved);
    if (stats.date === today) return stats.count;
  }
  return 0;
};

const incrementUsage = () => {
  const today = new Date().toDateString();
  const currentCount = getUsage();
  const newStats = { date: today, count: currentCount + 1 };
  localStorage.setItem('ai_usage_stats', JSON.stringify(newStats));
  window.dispatchEvent(new CustomEvent('ai_usage_updated', { detail: newStats.count }));
};

const getAIInstance = () => {
  const userKey = localStorage.getItem('user_api_key');
  const apiKey = userKey || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Initializes a new chat session with a helpful assistant persona.
 */
export const createChatSession = () => {
  const ai = getAIInstance();
  if (!ai) return null;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a friendly and knowledgeable AI assistant specifically for developer students. You can help with code, explain concepts, or just chat about general topics. Be clear, encouraging, and use markdown for formatting code snippets.',
    },
  });
};

export const explainCode = async (
  code: string, 
  selectedPrefs: Preference[], 
  language: string = 'javascript'
): Promise<string> => {
  const userKey = localStorage.getItem('user_api_key');
  const ai = getAIInstance();
  
  if (!ai) {
    return "No API Key found. Please add your Google API key in the settings (top right).";
  }

  if (!userKey) {
    return "Please provide your own Google API key in the settings (top right) to use this app.";
  }

  const instructions = selectedPrefs.map(p => p.instruction).join(" ");
  
  const systemInstruction = `
    You are an expert coding mentor for developer students. 
    Your goal is to help students understand complex code snippets.
    
    Current Tone/Preferences: ${instructions || 'Be helpful and clear.'}
    
    Format your response using Markdown. Use code blocks for any code examples.
    Focus on WHY the code works, not just WHAT it does.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      config: {
        systemInstruction,
      },
    });

    if (response.text) {
      incrementUsage();
    }

    return response.text || "I'm sorry, I couldn't generate an explanation for this code.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI.";
  }
};

export const defineWord = async (word: string): Promise<string> => {
  const userKey = localStorage.getItem('user_api_key');
  const ai = getAIInstance();
  
  if (!ai) return "No API Key found.";
  if (!userKey) return "Please provide your own Google API key in the settings (top right) to use this app.";

  const systemInstruction = `
    You are a professional coding dictionary for students. 
    Provide a highly structured, point-based breakdown of the given coding term.
    
    Structure your answer EXACTLY as follows using Markdown headers:
    ### 🏷️ Term: [Term Name]
    ### 📂 Category: [Category Name (e.g., Variable, Keyword, Operator, etc.)]
    ### 🎯 Purpose: [Brief explanation of its purpose]
    ### ⚙️ Property: [Specific properties, characteristics, or constraints]
    ### 📥 Parameters: [What input it takes, if any]
    ### 💎 Values/Returns: [The data type or value it represents or returns]
    
    ---
    
    ### ✨ Key Points
    - Point 1
    - Point 2
    - Point 3
    
    ### 💻 Usage Example
    \`\`\`javascript
    // A clear, simple example
    \`\`\`
    
    Rules:
    - If a field like "Parameters" isn't applicable, state "N/A".
    - Use simple, student-friendly language.
    - Keep each point punchy and informative.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Define the coding word: "${word}"`,
      config: { systemInstruction },
    });

    if (response.text) incrementUsage();
    return response.text || "Could not find a definition.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error fetching definition.";
  }
};
