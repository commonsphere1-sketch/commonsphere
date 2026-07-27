import { useEffect } from "react";

type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
};

export function SEOHead({ title, description }: SEOProps) {
  useEffect(() => {
    if (title) document.title = title + " | CommonSphere";
  }, [title]);
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
