import OpenAI from "openai";
import { type AIProvider, getCryptoChatSettings } from "../utils/store";
import type { VectorService } from "./vector-service";

interface ChatResponse {
  content: string;
  sources?: Array<{
    type: string;
    id: string;
    excerpt: string;
  }>;
}

export class ChatService {
  private openai: OpenAI | null = null;
  private provider: AIProvider = "openai";

  constructor(private vectorService: VectorService) {
    this.initialize();
  }

  private initialize() {
    const settings = getCryptoChatSettings();
    this.provider = settings.provider || "openai";

    if (settings.provider === "openai" && settings.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: settings.openaiApiKey,
        dangerouslyAllowBrowser: true, // Required for browser usage
      });
    }
  }

  async chat(query: string, history: any[]): Promise<ChatResponse> {
    // Reinitialize in case settings changed
    this.initialize();

    // Search for relevant documents
    const relevantDocs = await this.vectorService.search(query, 5);

    // Build context from retrieved documents
    const context = this.buildContext(relevantDocs);

    // Generate response
    const response = await this.generateResponse(query, context, history);

    // Extract sources
    const sources = relevantDocs.map((doc) => ({
      type: doc.metadata.type,
      id: doc.metadata.entityId,
      excerpt: doc.content.substring(0, 200) + "...",
    }));

    return {
      content: response,
      sources: sources.length > 0 ? sources : undefined,
    };
  }

  private buildContext(documents: any[]): string {
    if (documents.length === 0) {
      return "No relevant data found in the knowledge base.";
    }

    const contextParts = ["Relevant information from BTCPayServer:"];

    documents.forEach((doc, index) => {
      contextParts.push(
        `\n[${index + 1}] ${doc.metadata.type.toUpperCase()} (ID: ${doc.metadata.entityId}):`,
      );
      contextParts.push(doc.content);
    });

    return contextParts.join("\n");
  }

  private async generateResponse(
    query: string,
    context: string,
    history: any[],
  ): Promise<string> {
    const settings = getCryptoChatSettings();

    if (settings.provider === "ollama") {
      return this.generateOllamaResponse(query, context, history);
    }

    if (!this.openai) {
      // Return mock response if no API key
      return this.generateMockResponse(query, context);
    }

    try {
      const systemPrompt = `You are CryptoChat, an AI assistant specialized in helping users query and analyze BTCPayServer data. 
You have access to invoices, payments, and store information from the user's BTCPayServer instance.

Use the provided context to answer questions accurately. If the context doesn't contain relevant information, say so clearly.
Format your responses in a clear, structured way using markdown when appropriate.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Context:\n${context}` },
      ];

      // Add conversation history
      history.slice(-5).forEach((msg) => {
        if (msg.role !== "system") {
          messages.push({ role: msg.role, content: msg.content });
        }
      });

      // Add current query
      messages.push({ role: "user", content: query });

      const completion = await this.openai.chat.completions.create({
        model: settings.openaiModel || "gpt-3.5-turbo",
        messages,
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 1000,
      });

      return (
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response."
      );
    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.generateMockResponse(query, context);
    }
  }

  private async generateOllamaResponse(
    query: string,
    context: string,
    history: any[],
  ): Promise<string> {
    const settings = getCryptoChatSettings();
    const ollamaUrl = settings.ollamaUrl || "http://localhost:11434";
    const model = settings.ollamaModel || "llama2";

    try {
      const systemPrompt = `You are CryptoChat, an AI assistant specialized in helping users query and analyze BTCPayServer data. 
You have access to invoices, payments, and store information from the user's BTCPayServer instance.

Use the provided context to answer questions accurately. If the context doesn't contain relevant information, say so clearly.
Format your responses in a clear, structured way using markdown when appropriate.

Context:
${context}`;

      // Build conversation history
      let prompt = systemPrompt + "\n\n";

      // Add recent history
      history.slice(-5).forEach((msg) => {
        if (msg.role === "user") {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === "assistant") {
          prompt += `Assistant: ${msg.content}\n`;
        }
      });

      // Add current query
      prompt += `User: ${query}\nAssistant:`;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature: settings.temperature || 0.7,
          options: {
            num_predict: settings.maxTokens || 1000,
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      return fullResponse || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error("Ollama API error:", error);
      // If Ollama fails, fall back to mock response
      return this.generateMockResponse(query, context);
    }
  }

  private generateMockResponse(query: string, context: string): string {
    // Parse context to extract relevant information
    const lines = context.split("\n");
    const hasData = !context.includes("No relevant data found");

    if (!hasData) {
      return `I don't have any relevant data to answer your question about "${query}". 

Please make sure to index your BTCPayServer data first by clicking the "Index Data" button. This will import all your invoices and payment information so I can help you analyze it.`;
    }

    // Extract invoice information from context
    const invoiceLines = lines.filter((line) => line.includes("Invoice ID:"));
    const amountLines = lines.filter((line) => line.includes("Amount:"));
    const statusLines = lines.filter((line) => line.includes("Status:"));

    // Generate a mock response based on the query
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("invoice") || lowerQuery.includes("payment")) {
      const invoiceCount = invoiceLines.length;
      if (invoiceCount > 0) {
        return `Based on your BTCPayServer data, I found ${invoiceCount} relevant invoice(s).

Here's a summary:
${invoiceLines.slice(0, 3).join("\n")}
${amountLines.slice(0, 3).join("\n")}
${statusLines.slice(0, 3).join("\n")}

${invoiceCount > 3 ? `\n...and ${invoiceCount - 3} more invoice(s).` : ""}

Would you like more specific information about any of these invoices?`;
      }
    }

    if (
      lowerQuery.includes("total") ||
      lowerQuery.includes("sum") ||
      lowerQuery.includes("revenue")
    ) {
      const amounts = amountLines.map((line) => {
        const match = line.match(/Amount: ([\d.]+)/);
        return match ? Number.parseFloat(match[1]) : 0;
      });
      const total = amounts.reduce((sum, amt) => sum + amt, 0);

      return `Based on the indexed invoices, here's what I found:

📊 **Revenue Summary**
- Total invoices analyzed: ${invoiceLines.length}
- Combined value: ${total.toFixed(2)} (currency may vary)

Note: This is based on the currently indexed data. Make sure all your invoices are indexed for accurate totals.`;
    }

    if (lowerQuery.includes("status")) {
      const statusCounts: Record<string, number> = {};
      statusLines.forEach((line) => {
        const match = line.match(/Status: (\w+)/);
        if (match) {
          statusCounts[match[1]] = (statusCounts[match[1]] || 0) + 1;
        }
      });

      return `📈 **Invoice Status Distribution**

${Object.entries(statusCounts)
  .map(([status, count]) => `- ${status}: ${count} invoice(s)`)
  .join("\n")}

Total invoices: ${invoiceLines.length}`;
    }

    // Default response
    return `I found relevant data in your BTCPayServer:

${lines.slice(0, 10).join("\n")}

This is a mock response. To get more intelligent answers, please configure your OpenAI API key in the CryptoChat settings.`;
  }
}
