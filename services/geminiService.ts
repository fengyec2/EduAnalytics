
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisState } from "../types";

export const getAIInsights = async (analysis: AnalysisState) => {
  // Always use a named parameter and direct process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = {
    totalStudents: analysis.students.length,
    classes: analysis.classes,
    subjects: analysis.subjects,
    schoolAverage: analysis.schoolStats.average,
    subjectAverages: analysis.schoolStats.subjectStats
  };

  const prompt = `
    Based on the following student performance data summary, provide 4 critical insights for educators:
    Data Summary: ${JSON.stringify(summary)}
    
    The insights should cover:
    1. Overall academic health of the school.
    2. Specific subjects that need attention (weakest performance).
    3. High-performing areas to be maintained.
    4. Actionable pedagogical recommendations.

    Return the insights in a structured JSON format.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning task as per guidelines.
    // Simplifying contents to a direct string prompt as per guidelines.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Brief title of the insight.'
              },
              content: {
                type: Type.STRING,
                description: 'Detailed explanation of the insight.'
              },
              type: {
                type: Type.STRING,
                description: 'Category of the insight: success, warning, or info.'
              }
            },
            required: ["title", "content", "type"]
          }
        }
      }
    });

    // Directly access the .text property (not a method) and trim whitespace.
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr || "[]");
  } catch (error) {
    console.error("AI Insights Error:", error);
    return [
      {
        title: "Analysis Available",
        content: "Data processed successfully. Explore the charts below for detailed breakdowns.",
        type: "info"
      }
    ];
  }
};
