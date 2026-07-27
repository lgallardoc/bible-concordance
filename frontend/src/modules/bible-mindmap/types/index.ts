export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  strongsReferences: string[];
}

export interface StrongsNumber {
  code: string; // G25, H430, etc
  lemma: string;
  transliteration: string;
  definition: string;
  concordanceCount: number;
}

export interface VerseWord {
  verseId: string;
  word: string;
  strongCode: string;
}

export interface ConcordanceEntry {
  verseId: string;
  reference: string; // "1 Juan 4:9"
  text: string;
  strongCode: string;
}

export interface MindMapNode {
  id: string;
  type: 'verse' | 'strongs' | 'concordance';
  data: {
    label: string;
    code?: string; // Para strongs
    strongCode?: string;
    reference?: string; // Para concordancia
    excerpt?: string;
    count?: number; // Para strongs
    definition?: string; // Para strongs
    isExpanded?: boolean;
  };
  position: { x: number; y: number };
  style?: any;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface MindMapGraphData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface SelectedNodeData {
  id: string;
  type: 'verse' | 'strongs' | 'concordance';
  data: any;
}
