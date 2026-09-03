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
    answer: " Over the years, as a freelance designer, I have learned that no design lives in a vaccum. Therefore, I begin begin by  understanding: what am I tyring to solve, for who, and in what system? After I have scoped out the project, I begin ideating and testing, refining the design with each round to arrive at the best design solution possible.",
    followUps: ["design-thinking", "product-strategy", "new-projects"],
  },
  "design-thinking": {
    id: "design-thinking",
    question: "What does design thinking mean to you?",
    answer: "Design thinking means balance— balancing between user needs, business goals, and technical feasibility while crafting a joyful and memorable experience for users.",
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
