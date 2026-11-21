import { createContext, useContext } from "react";
import type { SiteContent } from "./site-content";

const SiteContentContext = createContext<SiteContent | null>(null);

export const SiteContentProvider = SiteContentContext.Provider;

export function useSiteContent() {
  const content = useContext(SiteContentContext);
  if (!content) throw new Error("Site content must be loaded from MongoDB before rendering.");
  return content;
}
