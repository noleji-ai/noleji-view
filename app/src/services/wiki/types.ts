export interface WikiPage {
  id: string;
  title: string;
  type: 'entity' | 'concept' | 'source-summary' | 'overview' | 'index' | 'log';
  content: string;
  frontmatter: {
    title: string;
    type: string;
    tags: string[];
    sources: string[];
    created: string;
    updated: string;
    related: string[];
  };
}

export interface WikiResult {
  pages: WikiPage[];
  indexContent: string;
  logContent: string;
  overviewContent: string;
  stats: {
    entityCount: number;
    conceptCount: number;
    sourceCount: number;
    totalPages: number;
    processingTime: number;
  };
}

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'tool' | 'organization' | 'framework' | 'service' | 'other';
  description: string;
  sourceFile: string;
}

export interface ExtractedConcept {
  name: string;
  definition: string;
  relatedEntities: string[];
  relatedConcepts: string[];
  sourceFile: string;
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  concepts: ExtractedConcept[];
  summary: string;
  keyTakeaways: string[];
}

export interface FileItem {
  id: string;
  name: string;
  type: 'md' | 'html';
}
