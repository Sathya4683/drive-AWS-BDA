import { useState } from "react";
import type { Folder, FileItem } from "shared-types";
import { FolderItem } from "./FolderItem";
import { FileItemView } from "./FileItem";

type Props = {
  folders: Folder[];
  files: FileItem[];
};

export function FolderTree({ folders, files }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filesByFolder = new Map<string, FileItem[]>();
  const unfiled: FileItem[] = [];
  for (const file of files) {
    if (file.folderId === null) {
      unfiled.push(file);
    } else {
      const list = filesByFolder.get(file.folderId) ?? [];
      list.push(file);
      filesByFolder.set(file.folderId, list);
    }
  }

  return (
    <div className="tree">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          isExpanded={expanded.has(folder.id)}
          onToggle={() => toggle(folder.id)}
          files={filesByFolder.get(folder.id) ?? []}
          allFolders={folders}
        />
      ))}
      {unfiled.length > 0 && (
        <div className="unfiled">
          <div className="row">
            <span className="muted">(no folder)</span>
          </div>
          <div className="tree-files">
            {unfiled.map((file) => (
              <FileItemView key={file.id} file={file} folders={folders} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}