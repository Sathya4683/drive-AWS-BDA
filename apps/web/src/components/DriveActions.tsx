import { useRef } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Folder } from "shared-types";
import { createFolder } from "../api/folders";
import { uploadFile } from "../api/files";
import { getErrorMessage } from "../api/client";

type Props = {
  folders: Folder[];
};

export function DriveActions({ folders }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => createFolder({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId: string }) =>
      uploadFile(file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const handleNewFolder = () => {
    const name = window.prompt("Folder name");
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { name: trimmed },
      { onError: (err) => window.alert(getErrorMessage(err)) },
    );
  };

  const handleUploadClick = () => {
    if (folders.length === 0) {
      window.alert("Create a folder first.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const list = folders.map((f) => f.name).join("\n");
    const target = window.prompt(
      `Upload "${file.name}" to which folder? Type the folder name:\n\n${list}`,
    );
    if (target === null) {
      e.target.value = "";
      return;
    }
    const folder = folders.find((f) => f.name === target.trim());
    if (!folder) {
      window.alert(`Folder "${target}" not found.`);
      e.target.value = "";
      return;
    }
    uploadMutation.mutate(
      { file, folderId: folder.id },
      {
        onError: (err) => window.alert(getErrorMessage(err)),
        onSettled: () => {
          e.target.value = "";
        },
      },
    );
  };

  return (
    <div className="drive-actions">
      <button className="link-button" onClick={handleNewFolder}>
        + New Folder
      </button>
      <button className="link-button" onClick={handleUploadClick}>
        + Upload File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}