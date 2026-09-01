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
    answer: "My design process begins with understanding who I am building for and in what circumstances. Over the years, as a freelance designer, I have learned that no design lives in a vaccum. It comes with constraints, goals, and objectives. After I have scoped out the project, I begin working to creating a workable prototype as soon as possible, iterating and implementing feedback to refine each iteration.",
    followUps: ["design-thinking", "product-strategy", "new-projects"],
  },
  "design-thinking": {
    id: "design-thinking",
    question: "What does design thinking mean to you?",
    answer: "Design thinking must always come from a place of empathy— understanding user needs and finding a way to address them effectively.",
    followUps: ["design-process", "product-strategy", "new-projects"],
  },
  "product-strategy": {
    id: "product-strategy",
    question: "How do you approach product strategy?",
    answer: "Product strategy is the connective tissue that links creative vision with business goals. An example of this in practice is clearly seen in work with Alterations by R.C. where I helped define the scope of the project and the product roadmap to ensure that the final product met both user needs and business objectives.",
    followUps: ["design-process", "design-thinking", "new-projects"],
  },
  "new-projects": {
    id: "new-projects",
    question: "How do you approach new projects? Where do you start?",
    answer: "When starting a new project, I like to start with research and discovery. I want to understand the problem space, the users, and the business goals. From there, I can start to ideate and prototype solutions, always keeping the user at the center of the process.",
    followUps: ["design-process", "design-thinking", "product-strategy"],
  },
};

export const ROOT_QUESTIONS = [
  "design-process",
  "design-thinking",
  "product-strategy",
  "new-projects",
];
