# Graphlit Platform Documentation (Consolidated)

## 1. Overview & Core Concepts

Graphlit is a cloud-native, API-first platform for building "Knowledge Copilots". It provides **Knowledge ETL (Extract, Transform, Load) and Retrieval-Augmented Generation (RAG) as a service** for unstructured data.

**Key Features:**

*   **API Access:** Accessed via GraphQL API or native SDKs (Python, Node.js, .NET).
*   **ETL for LLMs:** Automates ingestion, extraction (including OCR, vector embeddings), and enrichment of unstructured data from various sources. It builds a knowledge graph of entities (people, organizations, places, topics) and relationships found in the content.
*   **Knowledge Retrieval (RAG-as-a-Service):** Provides the infrastructure for RAG, abstracting away the complexities of integrating vector databases (like Pinecone, Qdrant), embedding models (like OpenAI ada-002), and LLMs. Compared to DIY approaches with tools like LangChain or LlamaIndex, Graphlit aims for faster setup (minutes vs. weeks).
*   **Knowledge Copilots:** Enables building applications where the primary value comes from the knowledge extracted from complex user data (Word docs, PDFs, videos, emails, Slack messages, images, CAD, etc.), not just the data itself.
*   **Developer Focus:** Designed for developers building vertical AI applications (legal, sales, entertainment, healthcare, etc.) by simplifying complex data workflows.

**Graphlit Differentiators:**

*   **Not just an OpenAI wrapper:** LLM-agnostic, integrating with various providers. Leverages deep experience in scalable media/data platforms.
*   **Not just a DIY toolkit:** A managed, cloud-native service providing secure storage, feeds, workflows, data modeling, multi-tenancy, and usage tracking.
*   **Not just 'Chat with PDF':** Supports a wide variety of multimedia data and file types. Provides richer context (knowledge graph entities, relationships, metadata) for higher-quality RAG.

**Core Concepts:**

*   **Content:** The central entity representing ingested data (Files, Pages, Text, Posts, Messages, Emails, Events).
*   **Feeds:** Automated ingestion pipelines from various sources (Cloud Storage, RSS, Web, Messaging, Email, etc.).
*   **Workflows:** Configurable multi-stage pipelines (Ingestion, Indexing, Preparation, Extraction, Enrichment, Actions) applied to Content during processing.
*   **Knowledge Graph:** Stores Content, metadata, and extracted entities (Observables like Person, Place, Org) based on Schema.org, linked via Observations. Enables GraphRAG.
*   **Conversations:** The core RAG interface for chatting with Content, storing history and citations.
*   **Specifications:** Reusable configurations defining the LLM, system prompt, parameters, and strategies (RAG, history, tool calling) for Conversations, Summarization, etc.
*   **Collections:** Logical groupings for Content, usable in filtering.
*   **Summarization:** Using LLMs to generate summaries (paragraphs, bullets, headlines, questions, chapters) of Content.
*   **Publishing:** Repurposing Content summaries into new formats (Text, Markdown, HTML, Audio) using LLMs.
*   **Alerts:** Periodic, scheduled Publishing focused on *new* Content, with notifications (e.g., Slack).
*   **Multi-Tenancy:** Built-in support via a JWT claim (`x-graphlit-owner-id`) to partition data within a project.

---

## 2. Authentication & Setup

### 2.1. API Endpoint

Your project-specific GraphQL API endpoint can be found on your Project Settings page in the Graphlit Portal. Note that the URL may differ based on the cloud region where your project is provisioned.

### 2.2. Authentication

Graphlit uses JWT (JSON Web Tokens) for authentication. You need your Organization ID, Environment ID, and JWT Secret (found in the Project Settings page) to generate tokens. Tokens can represent an Admin/Member role for the whole project or be scoped to a specific tenant using the `x-graphlit-owner-id` claim (UUID format).

### 2.3. CLI Configuration

The Graphlit CLI (`g` command) requires initial configuration.

*   **Configure:** Set up organization, environment, and secret.
    ```bash
    g configure
    ```
    *(The CLI will prompt for Organization ID, Environment ID, and JWT Secret.)*
*   **Login:** Generate a 4-hour JWT.
    ```bash
    g login
    ```
*   **Logout:** Clear the active JWT.
    ```bash
    g logout
    ```
    *(Configuration is typically stored in `~/.graphlit/defaults.json` or equivalent.)*

### 2.4. Multi-Tenancy

Use the `x-graphlit-owner-id` (UUID format) claim in your JWT to scope API calls to a specific tenant (your application's user or organization).

*   Content ingested *without* an owner ID (project-scoped) is visible (read-only) to all tenants.
*   Content ingested *with* an owner ID is only visible to that tenant (and project admins).
*   Tenants cannot modify or delete project-scoped content.

---

## 3. Content Management

`Content` represents any ingested data item in Graphlit.

**Content Types:** File, Page, Text, Post, Message, Email, Event.

### 3.1. Ingestion

*   **Direct Ingestion (GraphQL):**
    *   `ingestUri`: Ingest files or web pages from a URL.
        ```graphql
        mutation IngestUri($uri: URL!, $workflow: EntityReferenceInput) {
          ingestUri(uri: $uri, workflow: $workflow) {
            id
            name
            state
            # ... other fields
          }
        }
        ```
    *   `ingestText`: Ingest plain text, Markdown, or HTML.
        ```graphql
        mutation IngestText($name: String!, $textType: TextType!, $text: String!, $workflow: EntityReferenceInput) {
          ingestText(name: $name, textType: $textType, text: $text, workflow: $workflow) {
            id
            name
            state
            # ... other fields
          }
        }
        ```
*   **Bulk Ingestion:** Use [Feeds](#4-feeds).
*   **Ingestion with Workflow:** Pass a `workflow` reference (ID) during ingestion to apply custom processing.

*   **Direct Ingestion (CLI):**
    ```bash
    # Ingest from URL (File or Web Page)
    g create --type content --wait
    # (CLI prompts for URI and optional workflow ID)

    # Ingest Text
    g create --type content --wait
    # (Press Enter at URI prompt, CLI asks for name, text type, text)
    ```

### 3.2. Content States

Content progresses through states during workflow processing:
`CREATED` -> `INGESTED` -> `INDEXED` -> `PREPARED` -> `EXTRACTED` -> `ENRICHED` -> `FINISHED` (Success) or `ERRORED` (Failure).

### 3.3. CRUD Operations

*   **Get Content (GraphQL):**
    ```graphql
    query GetContent($id: ID!) {
      content(id: $id) {
        id
        name
        state
        type
        fileType
        mimeType
        uri
        text # Extracted text (formatted)
        markdown # Markdown version (if available via workflow)
        textUri # Link to raw extracted text JSON
        transcriptUri # Link to audio/video transcript JSON
        document { title author pageCount }
        # ... other metadata fields
      }
    }
    ```
*   **Get Content (CLI):**
    ```bash
    # Get full JSON
    g get --type content --id "{guid}"

    # Get specific fields (e.g., extracted text)
    g get --type content --id "{guid}" --fields "{ text }"
    ```
*   **Delete Content (GraphQL):** (Hard delete)
    ```graphql
    mutation DeleteContent($id: ID!) {
      deleteContent(id: $id) { id state }
    }
    mutation DeleteContents($ids: [ID!]!) {
      deleteContents(ids: $ids) { id state }
    }
    mutation DeleteAllContents { # Use with caution!
      deleteAllContents { id state }
    }
    ```
*   **Delete Content (CLI):**
    ```bash
    g delete --type content --id "{guid}"
    g clear --type content # Deletes ALL content in scope (project/tenant) - Use with caution!
    ```

### 3.4. Querying & Filtering Content

Use the `contents` GraphQL query with a `filter` object.

*   **Basic Query (All Content):** Paginated, sorted by `originalDate` descending by default.
    ```graphql
    query QueryContents($filter: ContentFilter!) {
      contents(filter: $filter) {
        results {
          id
          name
          originalDate
          # ... other fields
        }
        # Can also request 'facets' here
      }
    }
    # Variables
    # { "filter": { "offset": 0, "limit": 100 } }
    ```
*   **Filtering Options (within `filter` object):**
    *   `name`: Filter by content name (string match).
    *   `search`: Text search query string. Combine with `searchType`:
        *   `VECTOR` (Default): Semantic search using embeddings.
        *   `HYBRID`: Combines vector and keyword search.
        *   `KEYWORD`: Traditional keyword search.
    *   `types`: Filter by content type (e.g., `["FILE", "PAGE"]`).
    *   `fileTypes`: Filter by file category (e.g., `["DOCUMENT", "AUDIO"]`).
    *   `fileSizeRange`: Filter files by size in bytes (`{ "from": 1000000, "to": 5000000 }`).
    *   `dateRange`, `creationDateRange`: Filter by `originalDate` or `creationDate` (`{ "from": "YYYY-MM-DDTHH:MM:SSZ", "to": "..." }`).
    *   `feeds`: Filter by source feed ID(s) (`[{ "id": "..." }]`).
    *   `collections`: Filter by collection ID(s) (`[{ "id": "..." }]`).
    *   `contents`: Filter by similarity to other content ID(s) (`[{ "id": "..." }]`). Uses text and/or image embeddings. Max 10.
    *   `observations`: Filter by observed entities (`[{ "type": "PERSON", "observable": { "id": "..." } }]`). Can filter by multiple entities (AND logic).
*   **Faceting:** Count results grouped by properties (`CONTENT_TYPE`, `FILE_TYPE`, `ORIGINAL_DATE`, etc.). Add a `facets` argument alongside `filter`. Not supported with `VECTOR` or `HYBRID` search.
    ```graphql
     query QueryContents($filter: ContentFilter!, $facets: [ContentFacetInput]) {
       contents(filter: $filter, facets: $facets) {
         results { id name }
         facets { facet type value count range { from to } observable { ... } }
       }
     }
     # Variables example for facets
     # { ..., "facets": [{ "facet": "FILE_TYPE" }, { "facet": "ORIGINAL_DATE", "timeInterval": "MONTH" }] }
     # Set filter limit: 0 to get only facet counts
    ```

*   **Querying Content (CLI):**
    ```bash
    # Query all (first 100)
    g query --type content

    # Search by text (Vector default)
    g query --type content --search "Your query text"
    g query --type content --search "Your query text" --search-type Hybrid

    # Filter example (Audio files)
    g query --type content --file-types AUDIO
    ```
    *(Refer to CLI Content Filtering docs for more filter arguments)*

---

## 4. Feeds (Automated Ingestion)

Feeds automate ingestion from various sources.

### 4.1. Supported Feed Types

*   **Web/RSS:** `RSS`, `WEB` (single page or site crawl via sitemap/links), `WEB_SEARCH` (via search engine results - *not detailed in source*).
*   **Social/Community:** `REDDIT`, `YOUTUBE`.
*   **Messaging:** `SLACK`, `MICROSOFT_TEAMS`, `DISCORD`.
*   **Productivity/Storage:**
    *   `NOTION` (Pages or Databases)
    *   User Storage: `SHAREPOINT`, `ONEDRIVE`, `GOOGLE_DRIVE` (Requires OAuth refresh tokens)
    *   Cloud Storage: `S3_BLOB`, `AZURE_BLOB`, `AZURE_FILE`, `GOOGLE_BLOB`
*   **Email:** `GOOGLE_EMAIL`, `MICROSOFT_EMAIL` (Requires OAuth refresh tokens)
*   **Issue Tracking:** `LINEAR`, `JIRA`, `GITHUB_ISSUES`

### 4.2. Feed Configuration

*   **Scheduling:** `ONCE` or `REPEAT` (with `repeatInterval`, e.g., "PT5M").
*   **Content Filtering:** Use `workflow` to filter file types, etc.
*   **Source-Specific Params:** Credentials (API keys, tokens), URIs, folder/channel IDs, crawl depth, recursive flags, include attachments flags, etc.
*   **Workflow Assignment:** Assign a specific `workflow` ID to process content ingested by the feed.

### 4.3. Management (GraphQL)

*   **Create Feed:** Example for RSS Podcast feed (includes auto-transcription).
    ```graphql
    mutation CreateFeed($feed: FeedInput!) {
      createFeed(feed: $feed) { id name state type }
    }
    # Variables (Podcast Feed)
    # {
    #   "feed": {
    #     "name": "My AI Podcast Feed",
    #     "type": "RSS",
    #     "rss": { "uri": "https://feeds.example.com/podcast.rss" },
    #     "schedulePolicy": { "recurrenceType": "REPEAT", "repeatInterval": "PT1H" },
    #     "workflow": { "id": "optional-workflow-id" }
    #   }
    # }
    ```
    *(See specific documentation sections for variables for S3, Azure Blob, Azure File, Google Mail, Outlook Mail, GitHub Issues, Notion, Teams, Google Drive, etc.)*
*   **Enable/Disable Feed:** Pause/resume recurring feeds.
    ```graphql
    mutation EnableFeed($id: ID!) { enableFeed(id: $id) { id state } }
    mutation DisableFeed($id: ID!) { disableFeed(id: $id) { id state } }
    ```
*   **Delete Feed:** **WARNING:** Deleting a feed also deletes all associated Content. Disable is usually preferred.
    ```graphql
    mutation DeleteFeed($id: ID!) { deleteFeed(id: $id) { id state } }
    mutation DeleteFeeds($ids: [ID!]!) { deleteFeeds(ids: $ids) { id state } }
    mutation DeleteAllFeeds { deleteAllFeeds { id state } } # Use with caution!
    ```
*   **Get/Query Feeds:**
    ```graphql
    query GetFeed($id: ID!) { feed(id: $id) { id name state type schedulePolicy { recurrenceType repeatInterval } # ... other fields } }
    query QueryFeeds($filter: FeedFilter!) { feeds(filter: $filter) { results { id name state type # ... } } }
    # Filter by: name, types, states
    ```

### 4.4. Management (CLI)

*   **Create Feed:** Interactive prompts for type, parameters, scheduling, workflow.
    ```bash
    g create --type feed
    ```
    *(CLI prompts based on selected feed type)*
*   **Enable/Disable Feed:**
    ```bash
    g enable --type feed --id "{guid}"
    g disable --type feed --id "{guid}"
    ```
*   **Delete Feed:** (Includes warning about content deletion)
    ```bash
    g delete --type feed --id "{guid}"
    g clear --type feed # Deletes ALL feeds and their content - Use with extreme caution!
    ```
*   **Get/Query Feeds:**
    ```bash
    g get --type feed --id "{guid}"
    g query --type feed
    ```

---

## 5. Workflows (Content Processing Pipeline)

Workflows define how content is processed upon ingestion. Key for controlling costs and enabling features.

### 5.1. Workflow Stages

1.  **Ingestion:** Filtering content at the source (e.g., only ingest PDFs).
    *   Config: `contentTypeFilter`, `fileTypeFilter`, `urlFilter`, `fileNameFilter`, `pathFilter`.
2.  **Indexing:** Extracting technical metadata (file size, page count, duration) and links.
    *   Config: `linkExtractionTypes`.
3.  **Preparation:** Getting content ready for ML/AI processing.
    *   **Text Extraction:** From documents, web pages (Default: Azure AI Document Intelligence - incurs cost). Can specify OCR strategy.
    *   **Transcription:** From audio/video (Default: Deepgram - incurs cost). Can specify model, language.
    *   **Image Embeddings:** Generate CLIP embeddings for visual search (Requires opt-in).
    *   **Renditions:** Generate thumbnails, previews (Requires opt-in).
4.  **Extraction:** Populating the Knowledge Graph (Requires opt-in, incurs cost).
    *   **Text Entities:** Using Azure Text Analytics or LLMs (configured via `connector`).
        *   `AZURE_COGNITIVE_SERVICES_TEXT`: Specify `confidenceThreshold`, `enablePII`, `extractedTypes`.
        *   `MODEL_TEXT`: Uses an `EXTRACTION` type LLM [Specification](#62-specifications).
    *   **Image Analysis:** Using Azure Vision or OpenAI Vision (configured via `connector`).
        *   `AZURE_COGNITIVE_SERVICES_IMAGE`: Specify `confidenceThreshold`. Extracts labels, OCR text.
        *   `OPEN_AI_IMAGE`: Specify `detailLevel`. Extracts labels, OCR text, descriptions.
5.  **Enrichment:** Augmenting data (Requires opt-in).
    *   **Link Crawling:** Ingest linked content (`link` config: `enableCrawling`, filters, `maximumLinks`).
    *   **Entity Enrichment:** (Conceptual - API details for external API enrichment not shown in source).
6.  **Actions:** Triggering external systems via webhooks.
    *   Config: `WEB_HOOK` connector with `uri`.
    *   Events: `CONTENT_INGESTED`, `CONTENT_FINISHED`, `CONTENT_ERRORED`.

### 5.2. Management (GraphQL)

*   **Create/Update Workflow:** Define stages and their configurations.
    ```graphql
    mutation CreateWorkflow($workflow: WorkflowInput!) {
      createWorkflow(workflow: $workflow) {
        id name state
        # Include stage configs like 'extraction', 'enrichment', etc.
      }
    }
    mutation UpdateWorkflow($workflow: WorkflowUpdateInput!) {
       # Note: Update overwrites, doesn't merge. Provide all desired fields.
      updateWorkflow(workflow: $workflow) { id name state }
    }
    ```
    *Example: Workflow for Text Entity Extraction (Azure)*
    ```graphql
    # Variables for CreateWorkflow
    # {
    #   "workflow": {
    #     "name": "Azure Entity Extraction Workflow",
    #     "extraction": {
    #       "jobs": [{
    #         "connector": {
    #           "type": "AZURE_COGNITIVE_SERVICES_TEXT",
    #           "azureText": { "confidenceThreshold": 0.8, "enablePII": false },
    #           "extractedTypes": ["PERSON", "ORGANIZATION", "PLACE"]
    #         }
    #       }]
    #     }
    #   }
    # }
    ```
    *Example: Workflow for Link Crawling*
    ```graphql
    # Variables for CreateWorkflow
    # {
    #   "workflow": {
    #     "name": "Web Crawling Workflow",
    #     "enrichment": {
    #       "link": {
    #         "enableCrawling": true,
    #         "allowedLinks": ["WEB"], # Only crawl web links
    #         "allowContentDomain": false, # Crawl outside original domain
    #         "maximumLinks": 10
    #       }
    #     }
    #   }
    # }
    ```
*   **Delete Workflow:** (Cannot delete if used by a feed or as project default)
    ```graphql
    mutation DeleteWorkflow($id: ID!) { deleteWorkflow(id: $id) { id state } }
    ```
*   **Get/Query Workflows:**
    ```graphql
    query GetWorkflow($id: ID!) { workflow(id: $id) { id name state # ... stage configs } }
    query QueryWorkflows($filter: WorkflowFilter!) { workflows(filter: $filter) { results { id name state } } }
    ```

### 5.3. Management (CLI)

*   **Create/Update/Delete/Get/Query Workflow:**
    ```bash
    g create --type workflow # Interactive prompts for stages/config
    g update --type workflow --id "{guid}" # Interactive
    g delete --type workflow --id "{guid}"
    g get --type workflow --id "{guid}"
    g query --type workflow
    ```

---

## 6. Conversations & RAG

Graphlit provides RAG capabilities through the `Conversation` entity.

### 6.1. Conversation Flow

1.  **Start:** Either implicitly by calling `promptConversation` without an ID, or explicitly via `createConversation`.
2.  **Prompt:** Use `promptConversation` with a user `prompt` and optionally an existing conversation `id`.
3.  **RAG Process:**
    *   Graphlit filters content based on the conversation's `filter` (or uses all content if no filter).
    *   It performs semantic search using the user prompt (and potentially conversation history).
    *   Relevant content chunks (text, transcript segments) are retrieved.
    *   (Optional: GraphRAG enhancement using knowledge graph links - configuration not detailed).
    *   Context (system prompt, history, retrieved chunks) is formatted for the LLM defined in the [Specification](#62-specifications).
    *   (Optional: Tool calling - If spec has tools and webhook, Graphlit calls webhook, inserts response into context).
    *   LLM generates completion.
4.  **Response:** `promptConversation` returns the LLM's message, token usage, time, (optional) citations, and updated message count. New `USER` and `ASSISTANT` messages are added to the history.
5.  **Continue:** Repeat step 2 with the same conversation `id`.

### 6.2. Specifications

Reusable configurations for LLM interactions (Conversations, Summarization, Publishing, Alerts).

*   **Purpose:** Define LLM provider, model, parameters, system prompt, RAG strategies.
*   **Providers & Models:**
    *   **OpenAI:** (`serviceType: OPEN_AI`) Models like `GPT4_O`, `GPT4_TURBO_128K_1106`, `GPT35_TURBO_16K_0613`. Supports `CUSTOM` model name with own API key.
    *   **Azure OpenAI:** (`serviceType: AZURE_OPEN_AI`) Requires deployment name, endpoint, key. Models `GPT4`, `GPT4_32K`, `GPT35_TURBO`, `GPT35_TURBO_16K`.
    *   **Anthropic:** (`serviceType: ANTHROPIC`) Models like `CLAUDE_3_5_SONNET`, `CLAUDE_3_OPUS`, `CLAUDE_3_HAIKU`. Supports `CUSTOM` model name with own API key.
    *   **Mistral:** (`serviceType: MISTRAL`) Models `MIXTRAL_8X7B_INSTRUCT`, `MISTRAL_LARGE`, `MISTRAL_MEDIUM`, `MISTRAL_SMALL`. Supports `CUSTOM` model name with own API key.
    *   **Groq:** (`serviceType: GROQ`) Models `LLAMA3_8B`, `LLAMA3_70B`, `MIXTRAL_8X7B`, `GEMMA_7B`. Requires own API key.
    *   **Deepseek:** (`serviceType: DEEPSEEK`) Models `DEEPSEEK_CHAT`, `DEEPSEEK_CODER`. Supports `CUSTOM` model name with own API key.
    *   **Replicate:** (`serviceType: REPLICATE`) Models like `LLAMA_2_70B_CHAT`. Supports `CUSTOM` versioned model name with own API key. (*Note: Source mentioned limited conversation support*).
*   **Common Parameters:**
    *   `systemPrompt`: Instructions for the LLM persona/task.
    *   `temperature`: (0-2) Controls randomness.
    *   `probability`: (0-1, nucleus sampling) Alternative to temperature.
    *   `completionTokenLimit`: Max tokens in LLM response.
*   **Strategy Configuration (`strategy` object):**
    *   `embedCitations`: Boolean, if true, LLM response includes citations `[0]`, `[1]...` linked to source content chunks.
    *   `conversationStrategy`: Controls history (`WINDOWED`, `SUMMARIZED`).
    *   `promptStrategy`: Controls prompt enhancement (`REWRITE`, `STEP_BACK`).
    *   `retrievalStrategy`: Controls context retrieval (`searchType`, `contentLimit`, `chunkLimit`).
    *   `rerankingStrategy`: Reorders retrieved chunks (`MODEL` - using LLM, `RECIPROCAL`).
    *   `graphStrategy`: Enables GraphRAG (`ENTITY_CONTEXT`, `RELATIONSHIP_CONTEXT`). Configuration details lacking.
*   **Tool Calling:** Define `tools` (list of function definitions following OpenAI schema) and a `toolWebhook` URI. Graphlit calls the webhook when the LLM requests a tool.
*   **Specification Types:** `COMPLETION` (for conversations, etc.), `EXTRACTION` (for LLM-based entity extraction workflow).

*   **Management (GraphQL):**
    ```graphql
    mutation CreateSpecification($specification: SpecificationInput!) {
      createSpecification(specification: $specification) { id name state type serviceType }
    }
    # Variables Example (OpenAI GPT-4o with Citations)
    # {
    #   "specification": {
    #     "name": "GPT-4o Researcher with Citations",
    #     "type": "COMPLETION",
    #     "serviceType": "OPEN_AI",
    #     "systemPrompt": "You are a helpful research assistant...",
    #     "openAI": { "model": "GPT4_O", "temperature": 0.1 },
    #     "strategy": { "embedCitations": true }
    #   }
    # }
    mutation UpdateSpecification($specification: SpecificationUpdateInput!) {
      updateSpecification(specification: $specification) { id name state }
    }
    mutation DeleteSpecification($id: ID!) { deleteSpecification(id: $id) { id state } }
    query GetSpecification($id: ID!) { specification(id: $id) { id name state systemPrompt # ... provider params, strategy } }
    query QuerySpecifications($filter: SpecificationFilter!) { specifications(filter: $filter) { results { id name state } } }
    ```
*   **Management (CLI):**
    ```bash
    g create --type specification # Interactive prompts
    g update --type specification --id "{guid}" # Interactive
    g delete --type specification --id "{guid}"
    g get --type specification --id "{guid}"
    g query --type specification
    ```

### 6.3. Conversation Management (GraphQL)

*   **Create Conversation:** Explicitly create before prompting, useful for setting filters or specs.
    ```graphql
    mutation CreateConversation($conversation: ConversationInput!) {
      createConversation(conversation: $conversation) { id name state type }
    }
    # Variables (Filter on Audio Files, using a specific Spec)
    # {
    #   "conversation": {
    #     "name": "Podcast Q&A",
    #     "filter": { "types": ["FILE"], "fileTypes": ["AUDIO"] },
    #     "specification": { "id": "spec-id-for-podcast-qa" }
    #   }
    # }
    ```
*   **Prompt Conversation:** Start or continue a conversation. Returns LLM response.
    ```graphql
    mutation PromptConversation($prompt: String!, $id: ID) { # id is optional for first prompt
      promptConversation(prompt: $prompt, id: $id) {
        conversation { id }
        message { # The ASSISTANT's response
          role
          message
          tokens
          completionTime
          citations { content { id } index text startTime endTime pageNumber } # If spec enabled citations
        }
        messageCount
      }
    }
    ```
*   **Manage History/State:**
    ```graphql
    mutation UndoConversation($id: ID!) { undoConversation(id: $id) { id state } } # Removes last USER/ASSISTANT pair
    mutation ClearConversation($id: ID!) { clearConversation(id: $id) { id state } } # Removes all messages
    mutation CloseConversation($id: ID!) { closeConversation(id: $id) { id state } } # Makes immutable
    mutation OpenConversation($id: ID!) { openConversation(id: $id) { id state } } # Reverts Close
    mutation UpdateConversation($conversation: ConversationUpdateInput!) { # e.g., rename
      updateConversation(conversation: $conversation) { id name state }
    }
    ```
*   **Delete Conversation:**
    ```graphql
    mutation DeleteConversation($id: ID!) { deleteConversation(id: $id) { id state } }
    mutation DeleteConversations($ids: [ID!]!) { deleteConversations(ids: $ids) { id state } }
    mutation DeleteAllConversations { deleteAllConversations { id state } } # Use with caution!
    ```
*   **Get/Query Conversations:**
    ```graphql
    query GetConversation($id: ID!) { conversation(id: $id) { id name state creationDate messages { role message timestamp } # Can fetch history } }
    query QueryConversations($filter: ConversationFilter!) { conversations(filter: $filter) { results { id name state } } }
    # Filter by: name, states
    ```

### 6.4. Conversation Management (CLI)

*   **Create/Prompt:**
    ```bash
    g create --type conversation # Interactive prompts for name, spec, filter
    g prompt --type conversation # Asks if new or existing, takes prompt, shows response
    ```
*   **Delete/Clear:**
    ```bash
    g delete --type conversation --id "{guid}"
    g clear --type conversation # Deletes ALL conversations in scope - Use with caution!
    ```
*   **Get/Query:**
    ```bash
    g get --type conversation --id "{guid}" # Shows formatted history
    g query --type conversation
    g query --type conversation --search "text in conversation" # Search within history
    ```

---

## 7. Knowledge Graph

Graphlit automatically builds a knowledge graph based on Schema.org types.

### 7.1. Core Components

*   **Observables:** Entities extracted from content (e.g., Person, Organization, Place, Event, Product, Software, Repo, Label, Category). Managed via specific API endpoints (e.g., `createPerson`, `queryPersons`).
*   **Observations:** Links between a piece of Content and an Observable, representing an instance where the entity was found. Includes context like confidence, time range, page number, or bounding box.

### 7.2. Entity Extraction (Populating the Graph)

*   Done via the `extraction` stage in [Workflows](#51-workflow-stages).
*   Uses ML models (Azure Text/Vision, OpenAI Vision) or LLMs.
*   Creates Observable nodes (if they don't exist) and Observation edges.

### 7.3. Managing Observables (Example: Organization)

*(Similar CRUD/Query patterns exist for Person, Place, Product, Event, Software, Repo, Label, Category)*

*   **Create Organization (GraphQL):**
    ```graphql
    mutation CreateOrganization($organization: OrganizationInput!) {
      createOrganization(organization: $organization) { id name }
    }
    # Variables: { "organization": { "name": "Example Inc.", "uri": "https://example.com" } }
    ```
*   **Update Organization (GraphQL):**
    ```graphql
    mutation UpdateOrganization($organization: OrganizationUpdateInput!) {
      updateOrganization(organization: $organization) { id name }
    }
    # Variables: { "organization": { "id": "org-id", "name": "New Name", "description": "..." } }
    ```
*   **Delete Organization (GraphQL):**
    ```graphql
    mutation DeleteOrganization($id: ID!) { deleteOrganization(id: $id) { id state } }
    mutation DeleteOrganizations($ids: [ID!]!) { deleteOrganizations(ids: $ids) { id state } }
    ```
*   **Get/Query Organization (GraphQL):**
    ```graphql
    query GetOrganization($id: ID!) { organization(id: $id) { id name description uri } }
    query QueryOrganizations($filter: OrganizationFilter!) { organizations(filter: $filter) { results { id name } } }
    # Filter by: name
    ```

*   **Managing Observables (CLI):**
    ```bash
    g create --type organization # Interactive
    g update --type organization --id "{guid}" # Interactive
    g delete --type organization --id "{guid}"
    g get --type organization --id "{guid}"
    g query --type organization
    ```

### 7.4. Managing Observations

*   **Create Observation (GraphQL):** Manually link an entity to content.
    ```graphql
    mutation CreateObservation($observation: ObservationInput!) {
      createObservation(observation: $observation) { id }
    }
    # Variables Example (Label "Sentiment" over time range in audio content)
    # {
    #   "observation": {
    #     "type": "LABEL",
    #     "observable": { "name": "Sentiment" }, # Creates Label if needed
    #     "content": { "id": "content-id" },
    #     "occurrences": [
    #       { "type": "TIME", "startTime": "PT1M", "endTime": "PT1M30S", "confidence": 0.9 }
    #     ]
    #   }
    # }
    ```
*   **Update/Delete/Get Observation (GraphQL):**
    ```graphql
    mutation UpdateObservation($observation: ObservationUpdateInput!) { updateObservation(observation: $observation) { id } }
    mutation DeleteObservation($id: ID!) { deleteObservation(id: $id) { id state } }
    query GetObservation($id: ID!) { observation(id: $id) { id type observable { id name } content { id } occurrences { ... } } }
    ```

---

## 8. Content Repurposing

Leverage ingested content and LLMs to create new insights or formats.

### 8.1. Summarization

*   **Purpose:** Generate summaries of one or more content items.
*   **Methods:**
    *   Built-in types: `SUMMARY` (paragraphs), `BULLETS`, `HEADLINES`, `QUESTIONS`, `CHAPTERS` (for audio/video).
    *   Custom: Provide your own `prompt`.
*   **Configuration:** Uses an LLM [Specification](#62-specifications) (defaults to Azure OpenAI GPT-3.5 Turbo 16k).
*   **Input:** Can summarize a single `content` ID or use a `filter` to summarize multiple contents.
*   **GraphQL Mutation:**
    ```graphql
    mutation SummarizeContents($types: [SummarizationType!], $prompt: String, $content: EntityReferenceInput, $filter: ContentFilter, $specification: EntityReferenceInput) {
      summarizeContents(types: $types, prompt: $prompt, content: $content, filter: $filter, specification: $specification) {
        content { id }
        type # The summarization type requested
        prompt # The custom prompt used, if any
        items { text tokens summarizationTime startTime endTime chapter } # Array of results
      }
    }
    # Variables (Summarize audio file as chapters and questions)
    # {
    #   "content": { "id": "audio-content-id" },
    #   "types": ["CHAPTERS", "QUESTIONS"]
    # }
    ```
*   **CLI Command:**
    ```bash
    # Summarize single content ID using default types
    g summarize --type content --id "{guid}"

    # Summarize filtered content (e.g., audio) with specific types
    g summarize --type content --file-types AUDIO --summarization-types CHAPTERS QUESTIONS

    # Use custom prompt
    g summarize --type content --id "{guid}" --prompt "Extract key decisions made."
    ```

### 8.2. Publishing

*   **Purpose:** Create new Content by summarizing multiple source Contents and applying a publishing prompt. Useful for blog posts, reports, AI-generated audio.
*   **Process:**
    1.  Filter source Content.
    2.  Summarize each source Content item (optional custom `summaryPrompt`).
    3.  Feed all summaries into a final `publishPrompt` using an LLM ([Specification](#62-specifications)).
    4.  Generate output as Text, Markdown, HTML, or MP3 Audio (via ElevenLabs).
    5.  Ingest the output as new Content.
*   **GraphQL Mutation:**
    ```graphql
    mutation PublishContents($connector: ContentPublishingConnectorInput!, $publishPrompt: String!, $summaryPrompt: String, $filter: ContentFilter, $specification: EntityReferenceInput, $summarySpecification: EntityReferenceInput, $workflow: EntityReferenceInput, $name: String) {
      publishContents(connector: $connector, publishPrompt: $publishPrompt, summaryPrompt: $summaryPrompt, filter: $filter, specification: $specification, summarySpecification: $summarySpecification, workflow: $workflow, name: $name) {
        # Returns the newly created Content object
        id
        name
        state
        uri
        # ...
      }
    }
    # Variables (Publish Markdown blog post from Page content)
    # {
    #   "filter": { "types": ["PAGE"] },
    #   "publishPrompt": "Combine the summaries into an engaging blog post...",
    #   "connector": { "type": "DOCUMENT", "format": "MARKDOWN" },
    #   "specification": { "id": "llm-spec-for-blogging" },
    #   "name": "AI Generated Blog Post"
    # }
    ```
    *(Also `publishConversation` mutation exists - see Conversation Management)*
*   **CLI Command:**
    ```bash
    # Publish blog post (Markdown) from Page content
    g publish --type content --content-types Page --publish-prompt "Create blog post..." --format MARKDOWN --output-type DOCUMENT --specification-id "{spec-guid}"
    ```

### 8.3. Semantic Alerts

*   **Purpose:** Scheduled, periodic Publishing focused only on *new* Content matching a filter since the last run. Sends notifications.
*   **Process:** Similar to Publishing, but runs on a `schedulePolicy` and uses an `integration` for notifications.
*   **Configuration:**
    *   `filter`: Defines the content scope.
    *   `schedulePolicy`: `REPEAT` with `repeatInterval`.
    *   `summaryPrompt` (optional), `publishPrompt` (required).
    *   `summarySpecification` (optional), `publishSpecification` (required).
    *   `publishing`: Output format (`TEXT`, `AUDIO`). For Audio, requires `elevenLabs` config (model, voice ID, optional API key).
    *   `integration`: Destination (`SLACK`, `WEB_HOOK`). Requires credentials (Slack token/channel, webhook URI).
*   **Management (GraphQL):**
    ```graphql
    mutation CreateAlert($alert: AlertInput!) { createAlert(alert: $alert) { id name state type } }
    # Variables (Slack Text Alert for new Emails every 5 mins)
    # {
    #   "alert": {
    #     "name": "Email Summary to Slack",
    #     "type": "PROMPT", # Required type for alerts
    #     "filter": { "types": ["EMAIL"] },
    #     "schedulePolicy": { "recurrenceType": "REPEAT", "repeatInterval": "PT5M" },
    #     "publishPrompt": "Summarize new emails for Slack...",
    #     "publishSpecification": { "id": "llm-spec-for-slack" },
    #     "publishing": { "type": "TEXT", "format": "MARKDOWN" },
    #     "integration": {
    #       "type": "SLACK",
    #       "slack": { "token": "xoxb-...", "channel": "my-notifications" }
    #     }
    #   }
    # }
    mutation EnableAlert($id: ID!) { enableAlert(id: $id) { id state } }
    mutation DisableAlert($id: ID!) { disableAlert(id: $id) { id state } }
    mutation DeleteAlert($id: ID!) { deleteAlert(id: $id) { id state } }
    # ... DeleteAlerts, DeleteAllAlerts
    query GetAlert($id: ID!) { alert(id: $id) { id name state filter publishing integration schedulePolicy lastAlertDate } }
    query QueryAlerts($filter: AlertFilter!) { alerts(filter: $filter) { results { id name state } } }
    # Filter by: name, types, states
    ```
    *(CLI management for Alerts not explicitly shown in source document)*

---

## 9. GraphQL API Usage Guide (GraphQL 101)

Graphlit uses GraphQL for its API.

*   **Why GraphQL?** Efficiently fetch exactly the data needed, navigate graph relationships naturally, simplify complex/nested queries compared to REST.
*   **Queries:** Read data. Structure mirrors the desired JSON response. Use fields, arguments (for filtering via `filter` objects or IDs), aliases, operation names.
*   **Mutations:** Modify data (Create, Update, Delete). Structured like function calls with input arguments and return types.
*   **Advanced:**
    *   **Variables:** Pass dynamic values into queries/mutations (e.g., `$prompt: String!`).
    *   **Fragments:** Reusable sets of fields.
    *   **Directives:** Conditionally include/skip fields (`@include(if: $booleanVar)`, `@skip`).
*   **Error Handling:** Check the `errors` array in the response for syntax or execution errors. Use GraphQL IDEs (GraphiQL, Apollo Studio), check the schema, log requests/responses, test incrementally.
*   **Best Practices:** Request only needed fields, use aliases/fragments, batch requests if possible, use client-side caching (e.g., Apollo Client), consider optimistic UI for mutations, monitor performance.

---

## 10. Use Cases & Examples (Links)

*   **Chat Applications:**
    *   [Chat with PDF (App)](https://graphlit-samples-chat-pdf.streamlit.app/)
    *   [Chat with Azure Blob Files (App)](https://graphlit-samples-chat-azure-blob-feed.streamlit.app/)
    *   [Upload and Chat with Files with Citations (App)](https://graphlit-samples-chat-file-citations.streamlit.app/)
    *   [LLM Comparison (App)](https://graphlit-samples-chat-file-comparison.streamlit.app/)
*   **Summarization Applications:**
    *   [Summarize File (App)](https://graphlit-samples-summary-pdf.streamlit.app/)
    *   [Podcast Chapters (App)](https://graphlit-samples-summary-podcast-feed.streamlit.app/)
    *   [YouTube Video Chapters (App)](https://graphlit-samples-summary-youtube-feed.streamlit.app/)
    *   [Reddit Followup Questions (App)](https://graphlit-samples-summary-reddit-feed.streamlit.app/)
    *   [Website Summary (App)](https://graphlit-samples-summary-web-feed.streamlit.app/)
*   **Entity Extraction Applications:**
    *   [Extract People and Companies (App)](https://graphlit-samples-extract-pdf.streamlit.app/)
    *   [Chart Website Topics (App)](https://graphlit-samples-extract-website-topics.streamlit.app/)
*   **Publishing Applications:**
    *   [GitHub Issues Report (App)](https://graphlit-samples-publish-issues-feed.streamlit.app/)
*   **Code Samples (GitHub):**
    *   **Next.js:** [github.com/graphlit/graphlit-samples/tree/main/nextjs](https://github.com/graphlit/graphlit-samples/tree/main/nextjs)
        *   [Conversations (RAG)](https://docs.graphlit.dev/quickstart/next.js-applications/conversations-rag)
        *   [Text Extraction](https://docs.graphlit.dev/quickstart/next.js-applications/text-extraction)
    *   **File/Web Extraction (Python/Streamlit inferred from app links):**
        *   [Extract Text from File (Code)](https://github.com/graphlit/graphlit-samples/tree/main/nextjs/file-extraction) *(Note: Link points to Next.js, likely Python sample exists elsewhere)*
        *   [Extract Text from Webpages (Code)](https://github.com/graphlit/graphlit-samples/tree/main/nextjs/web-extraction) *(Note: Link points to Next.js, likely Python sample exists elsewhere)*