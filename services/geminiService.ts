import { GoogleGenAI } from "@google/genai";
import { FormData, GeneratedCode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVbaScript = async (data: FormData): Promise<GeneratedCode> => {
  const mappingString = data.mappings
    .map(m => `- Copy Column "${m.sourceColumn}" from Source to Cell "${m.targetCell}" on Template`)
    .join('\n');

  const prompt = `
    Act as a Senior Excel VBA Developer. Write a robust, modular VBA macro based on the following specifications:

    **Configuration:**
    - Source Sheet Name: "${data.sourceSheetName}"
    - Template Sheet Name: "${data.templateSheetName}"
    - PDF Save Path: "${data.savePath}" (Note: Ensure code handles trailing backslash logic)
    - Data Start Row: ${data.startRow}
    - Filename Source: Column "${data.filenameColumn}" (from Source Sheet)
    
    **Data Mappings:**
    ${mappingString}

    **Requirements:**
    1. Use 'Option Explicit'.
    2. Define variables clearly at the top.
    3. Loop from Start Row until the last populated row in the Source Sheet.
    4. Inside the loop, clear previous data in the template (optional but good practice) and map the new data.
    5. Use 'ExportAsFixedFormat' Type:=xlTypePDF to save the Template Sheet.
    6. Implement robust Error Handling (On Error GoTo ErrorHandler). Log errors to the Immediate Window or a message box if a specific row fails, but try to continue or exit gracefully.
    7. heavily comment the code so a junior developer can understand the mappings.
    8. Add a simple message box at the end confirming completion.

    **Output Format:**
    Return the response as a JSON object with two keys:
    1. "code": The full VBA code string.
    2. "explanation": A brief, professional explanation (Markdown supported) of how the client should install and run this macro.
    
    Do not use markdown formatting like \`\`\`json in the response, just return the raw JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeneratedCode;
  } catch (error) {
    console.error("Error generating VBA:", error);
    throw new Error("Failed to generate VBA code. Please check your API key and try again.");
  }
};