/**
 * The resources explorer as a tab of the Dashboard's explorer: the list of
 * commodities beside one at a glance, and the commodity's full window when it
 * is asked for. Loaded only when the tab is opened, so the Dashboard does not
 * carry the price and producer files.
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { RESOURCES, type ResourceSummary } from "../data/resourceList";
import { ResourceExplorer } from "./ResourceExplorer";
import { ResourceModal } from "./ResourceModal";

export default function ResourceExplorerTab({ action }: { action?: { label: string; onClick: () => void } }) {
  const [open, setOpen] = useState<ResourceSummary | null>(null);
  return (
    <>
      <ResourceExplorer resources={RESOURCES} onOpen={setOpen} embedded action={action} />
      {open && createPortal(<ResourceModal resource={open} onClose={() => setOpen(null)} />, document.body)}
    </>
  );
}
