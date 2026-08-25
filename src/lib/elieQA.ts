export interface QANode {
  id: string;
  question: string;
  answer: string;
  followUps: string[];
}

export const QA_TREE: Record<string, QANode> = {
  "design-process": {
    id: "design-process",
    question: "Tell me about your design process.",
    answer: "[Placeholder — Sara's real answer goes here.]",
    followUps: ["design-thinking", "product-strategy", "new-projects"],
  },
  "design-thinking": {
    id: "design-thinking",
    question: "What does design thinking mean to you?",
    answer: "[Placeholder — Sara's real answer goes here.]",
    followUps: ["design-process", "product-strategy", "new-projects"],
  },
  "product-strategy": {
    id: "product-strategy",
    question: "How do you approach product strategy?",
    answer: "[Placeholder — Sara's real answer goes here.]",
    followUps: ["design-process", "design-thinking", "new-projects"],
  },
  "new-projects": {
    id: "new-projects",
    question: "How do you approach new projects? Where do you start?",
    answer: "[Placeholder — Sara's real answer goes here.]",
    followUps: ["design-process", "design-thinking", "product-strategy"],
  },
};

export const ROOT_QUESTIONS = [
  "design-process",
  "design-thinking",
  "product-strategy",
  "new-projects",
];
