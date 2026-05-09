# Comprehensive Diagram & Architecture Tools Research (May 2026)

---

## 1. DIAGRAMMING TOOLS COMPARISON

### Excalidraw (Open Source, Hand-Drawn Style)
- **GitHub**: https://github.com/excalidraw/excalidraw -- **121k+ stars**
- **License**: MIT
- **Key Features**:
  - Hand-drawn visual style, frictionless UX
  - Real-time collaboration with end-to-end encryption (no sign-up required)
  - Library system for reusable components
  - Exportable to PNG, SVG, clipboard
  - Embeddable React component
  - Official MCP server for AI integration (Claude, ChatGPT, VS Code, Goose)
  - Obsidian plugin available
  - Self-hostable
- **Best For**: Quick sketches, architecture discussions, collaborative whiteboarding, team workshops
- **2026 Trend**: "Excalidraw + MCP has become the default AI canvas for engineers"

### Draw.io / diagrams.net (Free, Feature-Complete)
- **Website**: https://www.drawio.com / https://app.diagrams.net
- **GitHub**: https://github.com/jgraph/drawio -- ~850 stars (main repo); desktop app at jgraph/drawio-desktop
- **License**: Apache-2.0
- **Key Features**:
  - Most feature-complete free technical diagramming tool
  - Extensive shape libraries: BPMN, flowcharts, UML, ERD, network topology, org charts
  - Layers, containers, advanced connectors, custom shape libraries
  - Official Atlassian/Confluence plugin
  - VS Code extension (hediet/vscode-drawio -- 9.4k stars)
  - Stores files as XML; supports .drawio and .svg formats
  - Runs entirely in browser, no data sent to server
  - Cloud architecture icons for AWS, Azure, GCP
- **Best For**: Formal technical documentation, architecture diagrams, network diagrams, UML
- **Note**: PlantUML import was deprecated end of 2025; Mermaid integration still supported

### Mermaid.js (Code-as-Diagram Standard)
- **GitHub**: https://github.com/mermaid-js/mermaid -- **87.8k+ stars**, 8.9k forks
- **License**: MIT
- **Website**: https://mermaid.js.org
- **Supported Diagram Types**:
  - Flowcharts, Sequence diagrams, Class diagrams, State diagrams
  - Entity-Relationship diagrams, Gantt charts, Pie charts
  - Git graphs, Requirement diagrams, User Journey maps
  - Mindmaps, Timeline, Sankey, XY Charts
  - Wardley Maps (beta), Quadrant charts, Block diagrams
- **Key Features**:
  - Markdown-inspired text definitions rendered as diagrams
  - Git-diffable, PR-reviewable
  - LLMs write Mermaid syntax natively
  - Native rendering: GitHub, GitLab, Bitbucket Cloud, Notion, Obsidian, Confluence, Linear, Discord, MkDocs, Docusaurus, Jupyter
- **Funding**: Mermaid Chart raised $7.5M seed from Sequoia, Microsoft M12, Open Core Ventures (March 2024)
- **Best For**: Documentation-embedded diagrams, README files, developer workflows

### D2 (Modern Text-to-Diagram)
- **GitHub**: https://github.com/terrastruct/d2 -- **23.6k stars**
- **License**: MPL-2.0
- **Website**: https://d2lang.com
- **Key Features**:
  - Modern diagram scripting language with best-in-class output aesthetics
  - Multiple layout engines: dagre (default), ELK, TALA (novel, for software architecture)
  - Only text-to-diagram language that produces animated diagrams
  - SVG, PNG, PDF exports
  - Official themes for styling
  - Autoformatter, syntax highlighting, error recovery parser
  - Playground: play.d2lang.com
  - D2 Studio IDE, Obsidian plugin, VS Code extension
- **Best For**: When diagrams need to look polished with minimal hand-tweaking; software architecture
- **vs Mermaid**: D2 looks nicer out of the box; Mermaid has far more LLM familiarity and platform integrations

### tldraw (Infinite Canvas SDK)
- **GitHub**: https://github.com/tldraw/tldraw -- **40k+ stars**, 70k+ weekly npm installs
- **License**: tldraw license (free for dev; production requires license key); starter kits MIT
- **Website**: https://tldraw.dev
- **Key Features**:
  - Both a collaborative whiteboard AND an embeddable React component
  - Clean geometric shapes (vs Excalidraw's hand-drawn style)
  - Pressure-sensitive drawing, rich text, arrows, snapping
  - Image/video support, image export
  - Multiplayer collaboration
  - "Make Real" AI feature: turns sketches into working code/prototypes
  - SDK for building custom infinite canvas applications
- **Funding**: $10M Series A (Lux Ventures, Definition Capital)
- **Best For**: Developers building products with interactive diagrams/canvas as part of the application

### Lucidchart (Commercial)
- **Website**: https://www.lucidchart.com
- **Pricing**: Free tier available; Pro from ~$8-10/user/month
- **Key Features**:
  - Polished diagramming with massive shape libraries (AWS, Azure, GCP)
  - Data linking, advanced formatting, auto-layout
  - Real-time collaboration
  - Integrations: Google Workspace, Microsoft 365, Atlassian, Slack
- **Best For**: Enterprise teams needing detailed technical diagrams with collaboration

### Miro (Commercial)
- **Website**: https://miro.com
- **Pricing**: Free tier; Business plans from ~$8/user/month
- **Key Features**:
  - Versatile online whiteboard for brainstorming, project planning
  - Miro AI features for 2026
  - 200+ templates, voting, timer, sticky notes
  - Integrations: Jira, Confluence, Slack, Microsoft Teams
- **Best For**: Team collaboration, brainstorming, workshops, design thinking

### FigJam (Commercial, Figma's Whiteboard)
- **Website**: https://www.figma.com/figjam
- **Pricing**: $5/editor/month; free tier with 3 files
- **Key Features**:
  - Deep Figma integration
  - Stamps, stickers, emoji reactions
  - Widgets ecosystem
  - Audio chat built-in
- **Best For**: Design teams already using Figma

### Whimsical (Commercial)
- **Website**: https://whimsical.com
- **Pricing**: ~$10/month
- **Key Features**:
  - Flowcharts, wireframes, mind maps, sticky notes
  - Faster than Miro for technical diagramming
  - Clean, focused UI
  - AI features for diagram generation
- **Best For**: Product managers and engineers wanting flowcharts + wireframes in one tool

---

## 2. OPEN SOURCE TOOLS (GitHub)

| Tool | GitHub URL | Stars | License | Primary Use |
|------|-----------|-------|---------|-------------|
| **Excalidraw** | github.com/excalidraw/excalidraw | 121k+ | MIT | Collaborative hand-drawn whiteboard |
| **Mermaid.js** | github.com/mermaid-js/mermaid | 87.8k | MIT | Code-as-diagram for docs |
| **mingrammer/diagrams** | github.com/mingrammer/diagrams | 41.9k | MIT | Python cloud architecture diagrams |
| **tldraw** | github.com/tldraw/tldraw | 40k+ | tldraw license | Infinite canvas SDK |
| **React Flow (xyflow)** | github.com/xyflow/xyflow | 34.8k | MIT | Node-based UI builder |
| **D2** | github.com/terrastruct/d2 | 23.6k | MPL-2.0 | Modern text-to-diagram |
| **XState** | github.com/statelyai/xstate | 29.4k | MIT | State machines & statecharts |
| **PlantUML** | github.com/plantuml/plantuml | 13k | GPL-3.0 | Text-based UML diagrams |
| **Markmap** | github.com/markmap/markmap | 12.6k | MIT | Markdown to mind map |
| **bpmn-js** | github.com/bpmn-io/bpmn-js | 9.5k | Custom (bpmn.io) | BPMN 2.0 modeler |
| **Draw.io VS Code** | github.com/hediet/vscode-drawio | 9.4k | GPL-3.0 | Draw.io in VS Code |
| **Kroki** | github.com/yuzutech/kroki | 4.1k | MIT | Unified diagram rendering API |
| **Draw.io** | github.com/jgraph/drawio | ~850 | Apache-2.0 | General diagramming |

---

## 3. AI-POWERED DIAGRAM TOOLS

### Eraser.io / DiagramGPT
- **Website**: https://www.eraser.io/diagramgpt
- **Features**:
  - AI co-pilot for technical design and documentation
  - Generates diagrams from natural language prompts
  - 5 diagram types: flowcharts, ER diagrams, cloud architecture, sequence diagrams, BPMN
  - Can generate diagrams from private Git repositories
  - Leverages OpenAI models
- **Best For**: Engineers needing quick architecture/design diagrams from text descriptions

### Napkin.ai
- **Website**: https://www.napkin.ai
- **Features**:
  - Transforms existing text content into visuals (infographics, diagrams, mind maps, flowcharts, charts)
  - Free plan available
  - Great for blog graphics and presentations
- **Limitation**: Outputs static images; not editable as structured diagrams
- **Best For**: Marketing/content teams, blog visuals, presentation graphics

### Excalidraw + MCP (2026 Breakthrough)
- **GitHub**: https://github.com/excalidraw/excalidraw-mcp
- **Features**:
  - Official MCP server streaming hand-drawn diagrams
  - Works with Claude, ChatGPT, VS Code, Goose
  - 26 MCP tools: create, edit, export, import, clear canvas, get elements
  - Real-time canvas sync with AI agents
  - Vercel-hosted endpoint option (no local server needed)
- **2026 Status**: "The agent lives with your diagram" pattern is the biggest shift of 2026

### tldraw "Make Real"
- **Features**:
  - Sketch UI -> working prototype via AI
  - Turns drawings into functional code
- **Best For**: UI sketches that become working prototypes

### ChatGPT / Claude + Mermaid Auto-Generate
- Both LLMs write Mermaid syntax natively and reliably
- Mermaid has far more LLM familiarity than D2, PlantUML, or Graphviz
- Pattern: describe what you want -> LLM generates Mermaid code -> render anywhere
- Works especially well with Claude Code + Excalidraw MCP or direct Mermaid rendering

### Other AI Diagram Tools (2026)
- **Miro AI**: AI-powered sticky notes, summarization, diagram generation
- **Lucidchart AI**: Auto-generate diagrams from prompts
- **ConceptViz**: AI-powered science diagrams
- **InfraSketch**: AI architecture diagrams

---

## 4. CODE-AS-DIAGRAM COMPARISON

### Mermaid.js vs PlantUML vs D2 vs Graphviz

| Feature | Mermaid.js | PlantUML | D2 | Graphviz |
|---------|-----------|----------|-----|----------|
| **Stars** | 87.8k | 13k | 23.6k | N/A (AT&T) |
| **Language** | JavaScript | Java | Go | C |
| **Syntax Style** | Markdown-like | Custom DSL | Modern DSL | DOT language |
| **Learning Curve** | Low | Medium | Low-Medium | Medium |
| **Output Quality** | Good | Good | Best out-of-box | Basic |
| **Animation** | No | No | Yes | No |
| **Native GitHub** | Yes | No (needs server) | No | No |
| **Native Obsidian** | Yes | Via plugin | Via plugin | No |
| **LLM Familiarity** | Highest | Medium | Lower | Low |
| **Diagram Types** | 15+ | 20+ | General | Graph-focused |
| **Themes** | Yes | Yes | Yes (built-in) | Limited |
| **Live Editor** | mermaid.live | plantuml.com | play.d2lang.com | N/A |
| **License** | MIT | GPL-3.0 | MPL-2.0 | EPL |

### Diagrams (Python by mingrammer)
- **GitHub**: https://github.com/mingrammer/diagrams -- **41.9k stars**
- **License**: MIT
- **Features**:
  - Draw cloud architecture in Python code
  - Supports AWS, Azure, GCP, Kubernetes, Alibaba Cloud, Oracle Cloud
  - On-premises nodes, SaaS, programming frameworks
  - Version-control friendly
  - Requires Python 3.9+ and Graphviz
- **Important**: Does NOT control cloud resources or generate Terraform/CloudFormation
- **Best For**: Prototyping cloud system architecture diagrams as code

### Structurizr DSL (C4 Model)
- **Website**: https://structurizr.com / https://docs.structurizr.com/dsl
- **GitHub**: https://github.com/structurizr
- **Features**:
  - Created by Simon Brown, author of the C4 model
  - Model-based: single DSL defines consistent model -> multiple diagrams at different abstraction levels
  - Prebuilt themes for AWS, Azure, GCP, OCI, Kubernetes
  - Export to PlantUML, C4-PlantUML, Mermaid, DOT, Ilograph
  - MCP server for AI-assisted DSL validation and parsing
  - 2026: Python bindings, AI-assisted layout on roadmap
- **Best For**: Developer-heavy teams with code-first preferences, self-hosting, C4 model compliance

---

## 5. WORKFLOW BUILDERS

### React Flow (xyflow)
- **GitHub**: https://github.com/xyflow/xyflow -- **34.8k stars**
- **Website**: https://reactflow.dev (React) / https://svelteflow.dev (Svelte)
- **License**: MIT
- **Features**:
  - Highly customizable node-based UI library
  - Seamless zooming/panning, single/multi selection
  - Custom nodes with multiple handles, custom edges
  - Plugin components: Background, MiniMap, Controls
  - Fast rendering (only changed nodes re-render)
  - TypeScript, tested with Cypress
  - Also available as Svelte Flow
- **Best For**: Building custom flow editors, workflow builders, visual programming interfaces, data pipelines

### n8n (Workflow Automation)
- **GitHub**: https://github.com/n8n-io/n8n -- **50k+ stars**
- **Website**: https://n8n.io
- **License**: Fair-code (Sustainable Use License)
- **Features**:
  - 400+ integrations with code nodes
  - Native AI agent support: LLMs, vector stores, memory, RAG
  - Visual workflow editor
  - Self-hostable
- **Best For**: Business workflow automation, API orchestration, AI agent workflows

### Node-RED (IoT/Flow Programming)
- **GitHub**: https://github.com/node-red/node-red -- **20k+ stars**
- **Website**: https://nodered.org
- **License**: Apache-2.0
- **Features**:
  - Flow-based programming tool for IoT
  - 4,000+ community nodes
  - MQTT/HTTP/WebSocket nodes, function nodes, dashboard
  - Visual wiring of hardware, APIs, online services
- **Best For**: IoT, edge computing, hardware integration, data pipelines

### XState (State Machines)
- **GitHub**: https://github.com/statelyai/xstate -- **29.4k stars**
- **Website**: https://xstate.js.org / https://stately.ai
- **License**: MIT
- **Features**:
  - State machines, statecharts, and actors for complex logic
  - Visual state machine editor at stately.ai
  - Framework-agnostic (React, Vue, Svelte, Angular)
  - Stately Agent: create state-machine-powered LLM agents
  - TypeScript-first
- **Best For**: Complex UI state management, multi-step forms, authentication flows, game logic

---

## 6. SYSTEM ARCHITECTURE TOOLS

### C4 Model Ecosystem
- **Website**: https://c4model.com
- **Creator**: Simon Brown
- **Levels**: Context -> Containers -> Components -> Code

**Structurizr** (Reference Implementation)
- Code-first DSL approach
- Self-hostable (on-premises or cloud)
- Export to multiple formats
- Best for: developer-heavy teams, version-controlled architecture

**IcePanel**
- **Website**: https://icepanel.io
- Interactive, collaborative, drag-and-drop C4 diagrams
- Single shared object graph across all diagrams
- First-class entities reused across multiple views and zoom levels
- Pricing targets mid-market and enterprise
- Best for: larger organizations where architecture diagrams serve multiple audiences including non-engineers

### Cloud Architecture Diagram Tools

| Tool | Type | Key Feature |
|------|------|-------------|
| **mingrammer/diagrams** | Code (Python) | AWS/Azure/GCP/K8s icons, 41.9k stars |
| **Draw.io** | Visual editor | Free, extensive cloud icon libraries |
| **Cloudcraft** | Visual + live | AWS/Azure live infrastructure import |
| **Hava** | Auto-discovery | AWS/GCP/Azure auto-generated diagrams |
| **Hyperglance** | Auto-discovery | Multi-account, multi-region AWS/Azure/GCP |
| **Holori** | Auto-discovery | Diff diagrams (compare two points in time) |
| **Brainboard** | Visual + IaC | Drag-and-drop -> instant Terraform code |
| **CloudSkew** | Visual editor | Biggest cloud icon set |
| **Lucidchart** | Visual editor | Polished, massive shape libraries |

### Infrastructure as Code Visualization
- **Brainboard**: Visual diagram -> auto-generated Terraform
- **Holori**: Automated GCP/AWS/Azure visualization with diff feature
- **Hava**: Connects cloud accounts, auto-generates infrastructure diagrams
- **Hyperglance**: Real-time visualization of multi-cloud environments

---

## 7. MIND MAPPING TOOLS

### Markmap
- **GitHub**: https://github.com/markmap/markmap -- **12.6k stars**
- **Website**: https://markmap.js.org
- **License**: MIT
- **Features**:
  - Converts Markdown to interactive mind maps
  - MathJax and PrismJS (code highlighting) support
  - VS Code extension available (markmap/markmap-vscode)
  - Obsidian plugin (obsidian-mind-map)
  - MCP server available for AI integration
  - Zoom, expand/collapse nodes, export to PNG/JPG/SVG
- **Best For**: Developers who write in Markdown and want instant mind map visualization

### XMind
- **Website**: https://xmind.app
- **Type**: Commercial (free tier available)
- **Features**: Professional mind mapping, multiple structures (logic chart, org chart, tree, fishbone), export to PDF/PNG/SVG, presentation mode
- **Best For**: Professional mind mapping with polished output

### Obsidian Canvas
- **Built into**: Obsidian (free for personal use)
- **Features**:
  - Infinite canvas for arranging notes, images, PDFs, and other media
  - Links between cards connect to Obsidian notes
  - JSON-based .canvas format (open specification)
  - No diagramming shapes -- more of a spatial note arrangement tool
- **Best For**: Obsidian users who want spatial organization of notes and ideas

### Excalidraw (Obsidian Plugin)
- One of the most popular Obsidian plugins
- Full Excalidraw whiteboard inside Obsidian
- Hand-drawn diagrams linked to notes
- Script engine for automation

---

## 8. INTEGRATION ECOSYSTEM

### Native Mermaid Rendering (No Plugin Needed)
- **GitHub** (in Markdown files, issues, PRs, discussions)
- **GitLab**
- **Bitbucket Cloud**
- **Obsidian**
- **Notion**
- **Confluence** (via app)
- **Linear**
- **Discord**
- **MkDocs** (with mermaid plugin)
- **Docusaurus**
- **Jupyter Notebooks**
- **Datadog Notebooks**

### VS Code Extensions for Diagrams

| Extension | Marketplace ID | Purpose |
|-----------|---------------|---------|
| **Draw.io Integration** | hediet.vscode-drawio | Full Draw.io editor in VS Code |
| **Markdown Preview Mermaid** | bierner.markdown-mermaid | Mermaid in MD preview |
| **Mermaid Preview** | vstirbu.vscode-mermaid-preview | Standalone Mermaid previewer |
| **PlantUML** | jebbs.plantuml | PlantUML editing and preview |
| **D2** | terrastruct.d2 | D2 language support |
| **Markmap** | markmap.markmap-vscode | Markdown mind map preview |
| **Graphviz Interactive** | tintinweb.vscode-interactive-graphviz | Interactive DOT preview |
| **Draw.io + Mermaid** | nopeslide.vscode-drawio-plugin-mermaid | Mermaid inside Draw.io |

### Kroki: Unified Diagram API
- **GitHub**: https://github.com/yuzutech/kroki -- **4.1k stars**
- **Website**: https://kroki.io
- **License**: MIT
- **Supports**: BlockDiag, BPMN, C4, D2, DBML, Ditaa, Erd, Excalidraw, GraphViz, Mermaid, Nomnoml, Pikchr, PlantUML, Structurizr, SvgBob, UMLet, Vega, WaveDrom, WireViz, and more
- **Architecture**: Java web server (Vert.x) acting as unified gateway to diagram libraries in Haskell, Python, JS, Go, PHP, Java
- **Best For**: Self-hosted unified diagram rendering service; embedding diagrams in docs via API

### Diagram Converter Tools
- **Orriguii Diagram Converter**: Convert between Mermaid, Draw.io, and Excalidraw formats
- **HN thread**: https://news.ycombinator.com/item?id=45507077

---

## QUICK DECISION GUIDE

| If you need... | Use this |
|----------------|----------|
| Quick team sketches | **Excalidraw** |
| Formal architecture docs | **Draw.io** |
| Diagrams in code/docs | **Mermaid.js** |
| Beautiful text diagrams | **D2** |
| AI-generated diagrams | **Excalidraw + MCP** or **Eraser DiagramGPT** |
| Build custom flow editors | **React Flow** |
| Cloud architecture (code) | **mingrammer/diagrams** (Python) |
| C4 model (code-first) | **Structurizr DSL** |
| C4 model (visual/enterprise) | **IcePanel** |
| Workflow automation | **n8n** |
| IoT flows | **Node-RED** |
| State machines | **XState** |
| Mind maps from Markdown | **Markmap** |
| BPMN modeling | **bpmn-js** |
| Unified diagram rendering | **Kroki** |
| Enterprise diagramming | **Lucidchart** |
| Design team whiteboard | **FigJam** |
| Brainstorming/workshops | **Miro** |
| Infinite canvas SDK | **tldraw** |

---

## Sources

- [Best AI Diagram Tools 2026 - Nimbalyst](https://nimbalyst.com/blog/best-ai-diagram-tools-2026/)
- [Best Open-Source Diagramming Tools - ConceptViz](https://conceptviz.app/blog/best-open-source-diagramming-tools-guide)
- [10 Best Free Diagramming Tools 2026 - ConceptViz](https://conceptviz.app/blog/best-free-diagram-software-comparison-guide)
- [Mermaid vs Draw.io 2026 - MermaidEditor](https://mermaideditor.com/blog/mermaid-vs-drawio-2026)
- [Excalidraw vs Draw.io 2026 - Orriguii](https://diagram-converter.orriguii.com/blog/excalidraw-vs-drawio-2026)
- [History of Mermaid.js to 85K Stars - Taskade](https://www.taskade.com/blog/history-of-mermaid)
- [Mermaid.js Tutorial 2026 - Starmorph](https://blog.starmorph.com/blog/mermaid-js-tutorial)
- [D2 Diagram Language - BrightCoding](https://www.blog.brightcoding.dev/2026/03/09/d2-diagram-language-code-your-visuals-skip-the-drag-and-drop)
- [D2 GitHub Repository](https://github.com/terrastruct/d2)
- [D2 Documentation](https://d2lang.com/)
- [tldraw GitHub Repository](https://github.com/tldraw/tldraw)
- [tldraw SDK 4.0 Announcement](https://tldraw.dev/blog/tldraw-sdk-4-0)
- [tldraw Series A Announcement](https://tldraw.dev/blog/announcing-tldraw-series-a)
- [tldraw Review 2026 - MakerStack](https://makerstack.co/reviews/tldraw-review/)
- [Excalidraw 120K Stars Announcement](https://x.com/ossalternative/status/2039402496632762707)
- [Excalidraw MCP GitHub](https://github.com/excalidraw/excalidraw-mcp)
- [Eraser DiagramGPT](https://www.eraser.io/diagramgpt)
- [Napkin AI](https://www.napkin.ai/)
- [React Flow / xyflow GitHub](https://github.com/xyflow/xyflow)
- [React Flow Website](https://reactflow.dev/)
- [n8n vs Node-RED 2026 - PkgPulse](https://www.pkgpulse.com/guides/n8n-vs-automatisch-vs-node-red-workflow-automation-2026)
- [n8n vs Node-RED - HostAdvice](https://hostadvice.com/blog/ai/automation/n8n-vs-node-red/)
- [XState GitHub Repository](https://github.com/statelyai/xstate)
- [C4 Model Tools Comparison 2026 - Visual-C4](https://visual-c4.com/blog/c4-model-tools-comparison-2026)
- [IcePanel C4 Model](https://icepanel.io/c4-model)
- [Structurizr Website](https://structurizr.com/)
- [Top 9 C4 Model Tools - IcePanel](https://icepanel.io/blog/2025-08-28-top-9-tools-for-c4-model-diagrams)
- [Diagrams as Code 2.0 - Simon Brown](https://dev.to/simonbrown/diagrams-as-code-2-0-82k)
- [mingrammer/diagrams GitHub](https://github.com/mingrammer/diagrams)
- [Diagrams Documentation](https://diagrams.mingrammer.com/)
- [PlantUML GitHub Repository](https://github.com/plantuml/plantuml)
- [PlantUML vs Mermaid 2026](https://mermaideditor.com/blog/mermaid-vs-plantuml-2026)
- [Markmap GitHub Repository](https://github.com/markmap/markmap)
- [Markmap Website](https://markmap.js.org/)
- [bpmn-js GitHub Repository](https://github.com/bpmn-io/bpmn-js)
- [Kroki GitHub Repository](https://github.com/yuzutech/kroki)
- [Kroki Website](https://kroki.io/)
- [Draw.io VS Code Extension GitHub](https://github.com/hediet/vscode-drawio)
- [Cloud Infrastructure Visualization 2026 - Medium](https://medium.com/@lisaellingtonwrites/best-cloud-infrastructure-visualization-software-comparison-of-2026-1d9da521981c)
- [Best Software Architecture Tools 2026 - Catio](https://www.catio.tech/blog/software-architecture-tools)
- [Miro vs Lucidchart 2026](https://miro.com/compare/miro-vs-lucidchart/)
- [Lucidchart vs FigJam 2026 - SelectHub](https://www.selecthub.com/diagram-software/lucidchart-vs-figjam/)
- [Mermaid.js Guide 2026 - W3Resource](https://www.w3resource.com/javascript/mermaid-js-guide-to-create-diagrams-as-code.php)
- [Best Diagramming Tools for LLM Age - DEV](https://dev.to/akari_iku/analyzing-the-best-diagramming-tools-for-the-llm-age-based-on-token-efficiency-5891)
- [Convert Between Mermaid, Draw.io, Excalidraw - HN](https://news.ycombinator.com/item?id=45507077)
- [tldraw vs Excalidraw 2026 - ToolPick](https://www.toolpick.dev/blog/excalidraw-vs-tldraw-2026)
- [Top 10 Open Source Alternatives to Draw.io 2026](https://www.femaleswitch.com/startup-tools/tpost/top-open-source-alternatives-to-diagramsnet-drawio)
