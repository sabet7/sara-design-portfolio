import { z } from "zod";

/**
 * Media paths in frontmatter are root-relative paths into /public, e.g.
 * "/media/case-studies/hakmigo/thumbnail.webp" — the actual file lives at
 * public/media/case-studies/hakmigo/thumbnail.webp in this same repo.
 */

/**
 * CASE STUDY — maps to the old "Design Projects" Webflow collection.
 *   Name              -> client        (who you built it for)
 *   Project title      -> projectTitle  (what it is)
 *   One line           -> oneLiner
 *   Featured Project?  -> featured
 *   Design type         -> designType    (drives the navbar filter)
 *   Project thumbnail/GIF/hero image -> thumbnailImage / gifImage / heroImage
 *   Role, Year, Status, Skills -> same names
 *   Section 2-7 (rich text) -> written directly in the MDX body as
 *     ## Overview / ## Discovery / ## Research / ## Process / ## Final Design / ## Reflection
 */
export const CaseStudyFrontmatterSchema = z.object({
  type: z.literal("case-study"),
  slug: z
    .string()
    .min(1, "slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase letters, numbers, and hyphens only (e.g. \"hakmigo\", \"work-order-system\")"),
  client: z.string().min(1, "client is required"),
  projectTitle: z.string().min(1, "projectTitle is required"),
  oneLiner: z.string().min(1, "oneLiner is required"),
  featured: z.boolean().default(false),
  designType: z.array(z.string()).min(1, "designType needs at least one tag for filtering"),
  role: z.array(z.string()).default([]),
  year: z.string().min(1, "year is required"),
  status: z.string().default("Complete"), // e.g. "In Progress" | "Concept" | "Complete"
  skills: z.array(z.string()).default([]),
  thumbnailImage: z.string().min(1, "thumbnailImage is required"),
  gifImage: z.string().optional(),
  heroImage: z.string().min(1, "heroImage is required"),
});

export type CaseStudyFrontmatter = z.infer<typeof CaseStudyFrontmatterSchema>;

export const REQUIRED_CASE_STUDY_SECTIONS = [
  "Overview",
  "Discovery",
  "Research",
  "Process",
  "Final Design",
  "Reflection",
] as const;

/**
 * DESIGN EXPLORATION — maps to the old "Design Explorations" Webflow
 * collection, plus role/skills/painPoints/solutions/learnings from your
 * verbal spec, which weren't in the old CMS.
 *   Name / Slug / Images -> name / slug / images
 *   Exploration Year / Type -> explorationYear / category
 *   Project Details, Summary (rich text) -> ## Summary / ## Project Details in the MDX body
 *   One liner / Main Project Image -> oneLiner / mainImage
 *   Client / Client Logo -> client / clientLogo (blank for personal work)
 *   Color / Video -> color / video
 */
export const ExplorationFrontmatterSchema = z.object({
  type: z.literal("design-exploration"),
  slug: z
    .string()
    .min(1, "slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "name is required"),
  oneLiner: z.string().min(1, "oneLiner is required"),
  explorationYear: z.string().min(1, "explorationYear is required"),
  category: z.string().min(1, "category is required"),
  client: z.string().optional(),
  clientLogo: z.string().optional(),
  color: z.string().optional(),
  mainImage: z.string().min(1, "mainImage is required"),
  video: z.string().url().optional(),
  images: z.array(z.string()).default([]),
  role: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  collaborators: z.string().optional(),
  painPoints: z.array(z.string()).default([]),
  solutions: z.array(z.string()).default([]),
  learnings: z.array(z.string()).default([]),
});

export type ExplorationFrontmatter = z.infer<typeof ExplorationFrontmatterSchema>;
