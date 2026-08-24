import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  CaseStudyFrontmatterSchema,
  ExplorationFrontmatterSchema,
  REQUIRED_CASE_STUDY_SECTIONS,
  type CaseStudyFrontmatter,
  type ExplorationFrontmatter,
} from "@/content/types";

const CASE_STUDY_DIR = path.join(process.cwd(), "src/content/case-studies");
const EXPLORATION_DIR = path.join(process.cwd(), "src/content/explorations");

// Files starting with "_" (like _TEMPLATE.mdx) are ignored — safe to leave
// the template sitting in the folder as a reference.
function readMdxFiles(dir: string) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
}

function assertUniqueSlugs(items: { frontmatter: { slug: string } }[], kind: string) {
  const seen = new Map<string, number>();
  for (const item of items) {
    seen.set(item.frontmatter.slug, (seen.get(item.frontmatter.slug) ?? 0) + 1);
  }
  const dupes = [...seen.entries()].filter(([, count]) => count > 1);
  if (dupes.length > 0) {
    throw new Error(
      `Duplicate ${kind} slug(s): ${dupes.map(([slug]) => slug).join(", ")}. ` +
        `Each slug must be unique — it becomes the page URL.`
    );
  }
}

export interface CaseStudy {
  frontmatter: CaseStudyFrontmatter;
  content: string;
}

export function getAllCaseStudies(): CaseStudy[] {
  const items = readMdxFiles(CASE_STUDY_DIR).map((file) => {
    const raw = fs.readFileSync(path.join(CASE_STUDY_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const result = CaseStudyFrontmatterSchema.safeParse(data);

    if (!result.success) {
      throw new Error(
        `Case study "${file}" has invalid frontmatter:\n` +
          result.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n")
      );
    }

    for (const section of REQUIRED_CASE_STUDY_SECTIONS) {
      if (!content.includes(`## ${section}`)) {
        throw new Error(
          `Case study "${file}" is missing the "## ${section}" section heading. ` +
            `Every case study needs all six: ${REQUIRED_CASE_STUDY_SECTIONS.join(", ")}.`
        );
      }
    }

    return { frontmatter: result.data, content };
  });

  assertUniqueSlugs(items, "case study");
  return items;
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return getAllCaseStudies().find((cs) => cs.frontmatter.slug === slug);
}

export interface Exploration {
  frontmatter: ExplorationFrontmatter;
  content: string;
}

export function getAllExplorations(): Exploration[] {
  const items = readMdxFiles(EXPLORATION_DIR).map((file) => {
    const raw = fs.readFileSync(path.join(EXPLORATION_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const result = ExplorationFrontmatterSchema.safeParse(data);

    if (!result.success) {
      throw new Error(
        `Exploration "${file}" has invalid frontmatter:\n` +
          result.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n")
      );
    }

    return { frontmatter: result.data, content };
  });

  assertUniqueSlugs(items, "exploration");
  return items;
}

export function getExplorationBySlug(slug: string): Exploration | undefined {
  return getAllExplorations().find((ex) => ex.frontmatter.slug === slug);
}
