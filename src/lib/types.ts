export type Role = "admin" | "editor" | "committee";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administratör",
  editor: "Redaktör",
  committee: "Utskott",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Allt, inklusive konton och inställningar.",
  editor: "Allt innehåll: evenemang, nyheter, bilder, sidor, styrelse och dokument.",
  committee: "Det egna utskottets evenemang, nyheter, bilder och utskottssida.",
};

export interface Media {
  id: number;
  kind: "image" | "file";
  path_base: string;
  ext: string;
  variants: string;
  original_name: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  color: string | null;
  alt: string;
  uploaded_by: number | null;
  created_at: string;
}

/** Det som skickas till klienten om en bild – inga interna sökvägar. */
export interface ImageRef {
  id: number;
  src: string;
  srcSet: string;
  thumb: string;
  width: number;
  height: number;
  color: string;
  alt: string;
}

export interface Committee {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  tagline: string;
  description_md: string;
  logo_url: string | null;
  accent: string;
  email: string;
  instagram: string;
  kind: "styrelse" | "utskott" | "ovrigt";
  sort_order: number;
  visible: number;
  updated_at: string;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  post: string;
  role: Role;
  committee_id: number | null;
  password_hash: string;
  must_change_password: number;
  active: number;
  failed_logins: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
}

export type SessionUser = Pick<UserRow, "id" | "email" | "name" | "post" | "role" | "committee_id"> & {
  must_change_password: boolean;
  committee_name: string | null;
};

export interface BoardMember {
  id: number;
  post: string;
  name: string;
  email: string;
  bio: string;
  photo_media_id: number | null;
  committee_id: number | null;
  sort_order: number;
  photo: ImageRef | null;
}

export interface EventItem {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  starts_at: string;
  ends_at: string | null;
  all_day: number;
  location: string;
  location_url: string;
  committee_id: number | null;
  cover_media_id: number | null;
  signup_url: string;
  price: string;
  published: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  committee: Pick<Committee, "id" | "slug" | "name" | "short_name" | "logo_url" | "accent"> | null;
  cover: ImageRef | null;
  image_count: number;
}

export interface EventImage {
  id: number;
  event_id: number;
  caption: string;
  sort_order: number;
  image: ImageRef;
}

export interface NewsItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover_media_id: number | null;
  committee_id: number | null;
  published: number;
  pinned: number;
  published_at: string;
  author_id: number | null;
  author_name: string | null;
  author_post: string | null;
  created_at: string;
  updated_at: string;
  committee: Pick<Committee, "id" | "slug" | "name" | "short_name" | "logo_url" | "accent"> | null;
  cover: ImageRef | null;
}

export type DocumentCategory = "styrdokument" | "protokoll" | "grafiskt" | "ovrigt";

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, string> = {
  styrdokument: "Stadgar & reglemente",
  protokoll: "Protokoll",
  grafiskt: "Grafisk profil",
  ovrigt: "Övrigt",
};

export interface DocumentItem {
  id: number;
  title: string;
  category: DocumentCategory;
  description: string;
  media_id: number | null;
  url: string;
  doc_date: string | null;
  published: number;
  sort_order: number;
  created_at: string;
  file: { href: string; size: number; ext: string } | null;
}

export interface Page {
  slug: string;
  title: string;
  lead: string;
  body_md: string;
  updated_at: string;
  updated_by: number | null;
}

export interface Partner {
  id: number;
  name: string;
  url: string;
  description: string;
  logo_media_id: number | null;
  tier: "huvudpartner" | "partner";
  sort_order: number;
  active: number;
  logo: ImageRef | null;
}

export interface SiteSettings {
  contact_email: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  address: string;
  sektionsrum: string;
  org_number: string;
  tagline: string;
  hero_kicker: string;
  hero_text: string;
  announcement: string;
  announcement_url: string;
}
