import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Folder, FileItem } from "shared-types";
import {
  downloadFile,
  renameFile,
  moveFile,
  deleteFile,
} from "../api/files";
import { getErrorMessage } from "../api/client";

type Props = {
  file: FileItem;
  folders: Folder[];
};

export function FileItemView({ file, folders }: Props) {
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: ({ name }: { name: string }) =>
      renameFile(file.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ folderId }: { folderId: string }) =>
      moveFile(file.id, { folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFile(file.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const handleRename = () => {
    const next = window.prompt("New file name", file.name);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === file.name) return;
    renameMutation.mutate(
      { name: trimmed },
      { onError: (err) => window.alert(getErrorMessage(err)) },
    );
  };

  const handleMove = () => {
    if (folders.length === 0) {
      window.alert("No folders to move to. Create a folder first.");
      return;
    }
    const list = folders.map((f) => f.name).join("\n");
    const next = window.prompt(
      `Move to which folder? Type the folder name:\n\n${list}`,
    );
    if (next === null) return;
    const target = folders.find((f) => f.name === next.trim());
    if (!target) {
      window.alert(`Folder "${next}" not found.`);
      return;
    }
    if (target.id === file.folderId) {
      window.alert("File is already in that folder.");
      return;
    }
    moveMutation.mutate(
      { folderId: target.id },
      { onError: (err) => window.alert(getErrorMessage(err)) },
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    deleteMutation.mutate(undefined, {
      onError: (err) => window.alert(getErrorMessage(err)),
    });
  };

  const handleDownload = async () => {
    try {
      const { url } = await downloadFile(file.id);
      window.open(url, "_blank");
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  };

  return (
    <div className="row file-row">
      <button className="link-button file-name" onClick={handleDownload}>
        {file.name}
      </button>
      <span className="row-actions">
        <button className="link-button" onClick={handleRename}>
          rename
        </button>
        <button className="link-button" onClick={handleMove}>
          move
        </button>
        <button className="link-button" onClick={handleDelete}>
          delete
        </button>
      </span>
    </div>
  );
}