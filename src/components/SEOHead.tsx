import { useEffect } from "react";

type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
};

export function SEOHead({ title, description, canonical }: SEOProps) {
  useEffect(() => {
    if (title) document.title = title + " | CommonSphere";
  }, [title]);

  useEffect(() => {
    if (!description) return;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [description]);

  useEffect(() => {
    if (!canonical) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [canonical]);

  return null;
}

export function getPageSEO(pathname: string): SEOProps {
  const map: Record<string, SEOProps> = {
    "/": { title: "Home", description: "CommonSphere — civic data platform" },
    "/us-states": { title: "US States" },
    "/global-cities": { title: "Cities" },
    "/international-community": { title: "Countries" },
    "/global": { title: "Economies" },
    "/public-policy": { title: "Policy Hub" },
    "/congress": { title: "Congress" },
    "/polls": { title: "Policy Positions" },
    "/research-notes": { title: "Research Notes" },
    "/quiz": { title: "Quizzes" },
    "/political-ideologies": { title: "Political Library" },
    "/shop-and-memberships": { title: "Memberships" },
  };
  return map[pathname] ?? { title: "CommonSphere" };
}
