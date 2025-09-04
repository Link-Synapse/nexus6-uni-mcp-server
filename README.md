# Unified MCP Server

A comprehensive Model Context Protocol (MCP) server that combines Airtable, GitHub, and real-time multi-AI chat coordination for collaborative research and documentation projects.

## Overview

This server enables seamless collaboration between multiple AI models (Claude, GPT, etc.) with shared access to:
- **Airtable**: Structured data storage and project organization
- **GitHub**: Version control and code repository management  
- **Real-time Chat**: Multi-AI conversation coordination with role-based assignments
- **Local Storage**: Optional local-first data storage with Airtable sync

Perfect for research projects, knowledge base development, and collaborative AI workflows that require persistent state and structured documentation.

## Features

### Core MCP Functionality
- ✅ **Airtable Integration**: Full CRUD operations on bases, tables, and records
- 🔄 **GitHub Integration**: Repository management, issues, pull requests
- 💬 **Multi-AI Chat**: Real-time coordination between multiple AI models
- 📊 **Admin Dashboard**: Web-based UI for managing LLMs, APIs, and configurations

### Advanced Capabilities
- 🔄 **Local-first Storage**: SQLite/PostgreSQL with optional Airtable sync
- 🎯 **Role-based AI Assignment**: Assign specific tasks to specific AI models
- 📝 **Document Standards**: Built-in support for structured documentation workflows
- 🔌 **Extensible API System**: Easy integration of new AI services and APIs
- 📈 **Project Tracking**: Comprehensive logging and project state management

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin UI      │    │  Chat Interface  │    │  Local Storage  │
│  (React/Vue)    │    │   (WebSocket)    │    │   (SQLite/PG)   │
└─────────┬───────┘    └────────┬─────────┘    └─────────┬───────┘
          │                     │                        │
          └─────────────────────┼────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Unified MCP Core    │
                    │   (Node.js/TypeScript)│
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────▼────┐           ┌─────▼─────┐         ┌─────▼─────┐
    │Airtable │           │  GitHub   │         │ AI APIs   │
    │   MCP   │           │    MCP    │         │ (Claude,  │
    │ Module  │           │  Module   │         │ GPT, etc) │
    └─────────┘           └───────────┘         └───────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Airtable API key
- GitHub personal access token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/unified-mcp-server.git
   cd unified-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp config/example.env .env
   # Edit .env with your API keys
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Access interfaces**
   - Admin UI: `http://localhost:3000/admin`
   - Chat Interface: `http://localhost:3000/chat`

## Configuration

### Environment Variables
```env
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key

# GitHub Configuration  
GITHUB_TOKEN=your_github_token

# AI Service APIs
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Storage Configuration
DATABASE_TYPE=sqlite # or postgresql
DATABASE_URL=./data/unified-mcp.db
ENABLE_AIRTABLE_SYNC=true
```

### MCP Client Configuration
Add to your Claude Desktop config (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "unified": {
      "command": "node",
      "args": ["./dist/server.js"],
      "cwd": "/path/to/unified-mcp-server"
    }
  }
}
```

## Usage

### Multi-AI Research Workflow

1. **Project Setup**
   - Create project in Airtable via Admin UI
   - Initialize GitHub repository
   - Define AI roles and responsibilities

2. **Collaborative Research**
   - Start multi-AI chat session
   - Assign research tasks by role
   - Documents auto-tracked in Airtable
   - Code/analysis stored in GitHub

3. **Documentation Pipeline**
   - Draft → Ready → Approved workflow
   - Automatic version control
   - Knowledge base integration ready

### Role-Based AI Assignment Example
```javascript
// Assign Claude to research analysis
assignRole("claude", "research_analysis", {
  focus: "data_validation",
  output_format: "structured_markdown"
});

// Assign GPT to code generation  
assignRole("gpt", "code_generation", {
  focus: "rapid_prototyping",
  output_format: "working_code"
});
```

## Project Structure

```
unified-mcp-server/
├── src/
│   ├── airtable/          # Airtable MCP integration
│   ├── github/            # GitHub MCP integration
│   ├── chat/              # Multi-AI chat coordination
│   ├── unified/           # Core server logic
│   ├── storage/           # Local database management
│   ├── api/               # REST API endpoints
│   └── web/               # Admin UI and chat interface
├── docs/                  # Project documentation
├── config/                # Configuration templates
├── tests/                 # Test suites
└── examples/              # Usage examples
```

## Development

### Building from Source
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Adding New AI Services
```typescript
// src/ai/providers/newai.ts
export class NewAIProvider implements AIProvider {
  async sendMessage(message: string): Promise<string> {
    // Implementation
  }
}
```

## API Reference

### Airtable Operations
- `listBases()` - Get all accessible bases
- `listTables(baseId)` - Get tables in a base
- `listRecords(baseId, tableId)` - Get records from table
- `createRecord(baseId, tableId, fields)` - Create new record

### GitHub Operations  
- `listRepos()` - Get accessible repositories
- `getFile(repo, path)` - Read file content
- `createFile(repo, path, content)` - Create new file
- `createIssue(repo, title, body)` - Create issue

### Chat Operations
- `startSession(participants)` - Start multi-AI chat
- `sendMessage(sessionId, sender, content)` - Send message
- `assignRole(aiId, role, config)` - Assign AI role

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: `/docs` directory

## Roadmap

- [ ] Core MCP server integration (Airtable + GitHub)
- [ ] Local database implementation
- [ ] Multi-AI chat coordination
- [ ] Admin web interface
- [ ] Real-time WebSocket chat interface
- [ ] Plugin system for additional AI services
- [ ] Advanced project templates
- [ ] Knowledge base RAG integration
- [ ] Automated documentation generation

## Docs
- [MCP Code Review](./docs/mcp_code_review.md)
