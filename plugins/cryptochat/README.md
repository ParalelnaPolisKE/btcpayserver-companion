# CryptoChat Plugin

AI-powered chat interface with RAG (Retrieval-Augmented Generation) for querying BTCPayServer data using natural language.

## Features

- 🤖 **Natural Language Queries**: Ask questions about your BTCPayServer data in plain English
- 🔍 **Vector Search**: Uses embeddings and vector similarity search for accurate information retrieval
- 📊 **Data Ingestion**: Automatically indexes invoices, payments, and store data
- 💬 **ChatGPT-style Interface**: Familiar conversational UI with message history
- 🔐 **Local Settings**: API keys and configuration stored locally in the browser
- 🏠 **Local AI Support**: Use Ollama for completely local, private AI processing
- 🎭 **Mock Mode**: Works without any AI provider using simulated responses

## Installation

The CryptoChat plugin is included as a built-in plugin in BTCPayServer Companion. It will be automatically available in your plugins list.

## Configuration

### Choose Your AI Provider

CryptoChat supports multiple AI providers:

#### Option 1: OpenAI (Cloud-based)

1. Navigate to the CryptoChat plugin settings
2. Select "OpenAI (Cloud)" as the provider
3. Enter your OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))
4. Select your preferred model (GPT-3.5 Turbo or GPT-4)
5. Adjust temperature and max tokens as needed
6. Click "Test" to verify connection
7. Click "Save Settings"

#### Option 2: Ollama (Local AI)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama2` (or `mistral`, `codellama`, etc.)
3. Start Ollama server: `ollama serve`
4. In CryptoChat settings:
   - Select "Ollama (Local)" as the provider
   - Set server URL (default: `http://localhost:11434`)
   - Enter model name (e.g., `llama2`, `mistral`)
   - Click "Test" to verify connection
   - Click "Save Settings"

**Benefits of Ollama:**
- 🔒 Complete privacy - all processing happens locally
- 💰 No API costs
- 🚀 Fast responses with no network latency
- 🎯 Choose from various open-source models

#### Option 3: Mock Mode (No AI)

The plugin works in mock mode without any AI provider, providing simulated responses based on pattern matching. This is useful for testing and development.

## Usage

### Indexing Data

1. Open the CryptoChat plugin
2. Click the "Index Data" button to import your BTCPayServer invoices
3. Wait for the indexing process to complete
4. The system will confirm when data is successfully indexed

### Asking Questions

You can ask questions like:
- "Show me recent invoices"
- "What's my total revenue this month?"
- "Find invoices from customer john@example.com"
- "How many paid invoices do I have?"
- "Analyze payment trends"
- "Show invoice status distribution"

### Understanding Responses

- **Sources**: Each response may include source references showing which documents were used
- **Mock Mode Badge**: Indicates when running without OpenAI API key
- **System Messages**: Green messages indicate successful operations

## Technical Details

### Architecture

The plugin uses a RAG (Retrieval-Augmented Generation) architecture:

1. **Vector Database**: Uses `idb-vector` for local IndexedDB-based vector storage
2. **Embeddings**: OpenAI's text-embedding-ada-002 model (or mock embeddings in development)
3. **Search**: Vector similarity search to find relevant documents
4. **Generation**: OpenAI Chat API for generating contextual responses

### Data Flow

1. BTCPayServer data → Data Ingestion Service
2. Text documents → Embedding generation
3. Embeddings → Vector database storage
4. User query → Query embedding → Vector search
5. Retrieved documents + Query → LLM → Response

### File Structure

```
plugins/cryptochat/
├── manifest.json           # Plugin metadata
├── index.tsx              # Main plugin component
├── components/            # UI components
│   ├── CryptoChatPanel.tsx
│   └── CryptoChatSettings.tsx
├── hooks/                 # React hooks
│   └── useCryptoChat.ts
├── services/             # Core services
│   ├── vector-service.ts
│   ├── data-ingestion.ts
│   └── chat-service.ts
└── utils/                # Utilities
    └── store.ts          # Local storage management
```

## Development

### Running in Development

```bash
# Install dependencies
bun install

# Add required packages
bun add idb-vector openai

# Run the app
bun dev
```

### Testing Mock Mode

To test without an OpenAI API key:
1. Leave the API key field empty in settings
2. Index some sample data
3. Ask questions to see mock responses

### Extending the Plugin

To add new data types for indexing:

1. Update `data-ingestion.ts` to handle new data types
2. Add new document types to the `Document` interface
3. Update the vector service if needed
4. Test with both real and mock data

## Troubleshooting

### "Failed to initialize chat system"
- Check browser console for errors
- Ensure IndexedDB is supported and not blocked
- Try clearing browser data and refreshing

### "Failed to generate embedding"
- Verify OpenAI API key is valid
- Check network connectivity
- API key may have insufficient credits

### "No relevant data found"
- Ensure data has been indexed using "Index Data" button
- Check that invoices are available in BTCPayServer
- Try re-indexing the data

## License

This plugin is part of BTCPayServer Companion and follows the same license terms.