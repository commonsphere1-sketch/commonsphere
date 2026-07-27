import React, { useState } from "react";
import { useQuery, useMutation } from "@animaapp/playground-react-sdk";
import {
  FolderOpen,
  Plus,
  MagnifyingGlass,
  Database,
  CalendarBlank,
  Trash,
  Spinner,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COVER_IMAGES = [
  "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_3.png",
  "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_4.png",
  "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_5.png",
  "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_2.png",
  "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_1.png",
];

export function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const {
    data: collections,
    isPending,
    error,
  } = useQuery("Collection", { orderBy: { createdAt: "desc" } });

  const { create, remove, isPending: isMutating } = useMutation("Collection");

  const filtered = (collections ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await create({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        entities: 0,
        lastUpdated: new Date(),
        image: COVER_IMAGES[Math.floor(Math.random() * COVER_IMAGES.length)],
      });
      setNewName("");
      setNewDesc("");
      setShowNew(false);
    } catch (err) {
      console.error("Failed to create collection:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FolderOpen size={28} weight="fill" className="text-secondary" />
            <div>
              <h1 className="text-2xl font-bold font-sans text-foreground">
                My Collections
              </h1>
              <p className="text-muted-foreground text-sm font-sans">
                Manage your saved data collections
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNew(true)}
            className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4 flex items-center gap-2"
          >
            <Plus size={18} weight="bold" />
            New Collection
          </Button>
        </div>

        {showNew && (
          <div className="bg-card border border-border rounded-lg p-5 mb-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name…"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm flex-1"
                aria-label="New collection name"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)…"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm flex-1"
                aria-label="New collection description"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={isMutating || !newName.trim()}
                className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4"
              >
                {isMutating ? (
                  <Spinner size={15} className="animate-spin mr-1" />
                ) : null}
                Create
              </Button>
              <Button
                onClick={() => setShowNew(false)}
                className="bg-muted text-muted-foreground hover:bg-border text-sm font-normal h-9 px-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="relative mb-6 max-w-sm mx-auto">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections…"
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-full"
            aria-label="Search collections"
          />
        </div>

        {isPending && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Spinner size={22} className="animate-spin" />
            <span className="text-sm font-sans">Loading collections…</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive text-sm font-sans">
            Error loading collections: {error.message}
          </div>
        )}

        {!isPending && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((col) => (
                <article
                  key={col.id}
                  className="bg-card border border-border rounded-lg overflow-hidden group"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={col.image ?? COVER_IMAGES[0]}
                      alt={col.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold font-sans text-foreground">
                        {col.name}
                      </h3>
                      <button
                        onClick={() => handleDelete(col.id)}
                        disabled={isMutating}
                        className="text-muted-foreground hover:text-destructive transition-colors duration-150 shrink-0 p-1 disabled:opacity-40"
                        aria-label={`Delete ${col.name}`}
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans mb-3 line-clamp-2">
                      {col.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Database size={13} weight="fill" className="text-secondary" />
                        {col.entities} entities
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarBlank size={13} weight="fill" className="text-secondary" />
                        {new Date(col.lastUpdated).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-sans">
                <FolderOpen
                  size={48}
                  weight="thin"
                  className="mx-auto mb-3 text-muted-foreground"
                />
                <p className="text-sm">No collections found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
