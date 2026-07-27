import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Plus,
  CalendarBlank,
  Database,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const collections = [
  {
    name: "G7 Nations",
    entities: 7,
    lastUpdated: "2024-11-15",
    description: "Economic and political metrics for G7 member states.",
    image: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_3.png",
    imageAlt: "data flow abstract pattern",
  },
  {
    name: "BRICS Analysis",
    entities: 5,
    lastUpdated: "2024-10-28",
    description: "Comparative data for BRICS emerging economies.",
    image: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_4.png",
    imageAlt: "team comparing data on screen",
  },
  {
    name: "US State Trends",
    entities: 12,
    lastUpdated: "2024-11-02",
    description: "State-level approval ratings and economic indicators.",
    image: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_5.png",
    imageAlt: "person organizing data board",
  },
  {
    name: "Climate Leaders",
    entities: 9,
    lastUpdated: "2024-09-19",
    description: "Environmental policy and sustainability metrics.",
    image: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_2.png",
    imageAlt: "analytical metric abstract texture",
  },
];

export function CollectionsGrid() {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="collections-heading" className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FolderOpen size={22} weight="fill" className="text-secondary" />
          <h2
            id="collections-heading"
            className="text-lg font-semibold font-sans text-foreground"
          >
            My Collections
          </h2>
        </div>
        <Button
          onClick={() => navigate("/dashboard/collections")}
          className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4 flex items-center gap-2"
          aria-label="Create new collection"
        >
          <Plus size={18} weight="bold" />
          New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((col) => (
          <article
            key={col.name}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/dashboard/collections")}
            onKeyDown={(e) =>
              e.key === "Enter" && navigate("/dashboard/collections")
            }
            className="bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Collection: ${col.name}`}
          >
            <div className="h-32 overflow-hidden">
              <img
                src={col.image}
                alt={col.imageAlt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold font-sans text-foreground mb-1">
                {col.name}
              </h3>
              <p className="text-xs text-muted-foreground font-sans mb-3 line-clamp-2">
                {col.description}
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Database
                    size={13}
                    weight="fill"
                    className="text-secondary"
                  />
                  {col.entities} entities
                </span>
                <span className="flex items-center gap-1">
                  <CalendarBlank
                    size={13}
                    weight="fill"
                    className="text-secondary"
                  />
                  {col.lastUpdated}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
