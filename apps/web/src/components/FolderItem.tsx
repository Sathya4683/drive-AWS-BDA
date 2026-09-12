import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Folder, FileItem } from "shared-types";
import { renameFolder, deleteFolder } from "../api/folders";
import { getErrorMessage } from "../api/client";
import { FileItemView } from "./FileItem";

type Props = {
  folder: Folder;
  isExpanded: boolean;
  onToggle: () => void;
  files: FileItem[];
  allFolders: Folder[];
};

export function FolderItem({
  folder,
  isExpanded,
  onToggle,
  files,
  allFolders,
}: Props) {
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: ({ name }: { name: string }) =>
      renameFolder(folder.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder(folder.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const handleRename = () => {
    const next = window.prompt("New folder name", folder.name);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === folder.name) return;
    renameMutation.mutate(
      { name: trimmed },
      { onError: (err) => window.alert(getErrorMessage(err)) },
    );
  };

  const handleDelete = () => {
    const ok = window.confirm(
      `Delete folder "${folder.name}"?\n\nFiles in this folder will become unfiled.`,
    );
    if (!ok) return;
    deleteMutation.mutate(undefined, {
      onError: (err) => window.alert(getErrorMessage(err)),
    });
  };

  return (
    <div className="folder">
      <div className="row">
        <button className="link-button" onClick={onToggle}>
          {isExpanded ? "▼" : "▶"}
        </button>
        <span className="folder-name">{folder.name}</span>
        <span className="row-actions">
          <button className="link-button" onClick={handleRename}>
            rename
          </button>
          <button className="link-button" onClick={handleDelete}>
            delete
          </button>
        </span>
      </div>
      {isExpanded && files.length > 0 && (
        <div className="tree-files">
          {files.map((file) => (
            <FileItemView key={file.id} file={file} folders={allFolders} />
          ))}
        </div>
      )}
    </div>
  );
}