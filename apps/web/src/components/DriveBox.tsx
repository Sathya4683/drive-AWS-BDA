import { useQuery } from "@tanstack/react-query";
import { getFolders } from "../api/folders";
import { getFiles } from "../api/files";
import { useAuthStore } from "../store/authStore";
import { FolderTree } from "./FolderTree";
import { DriveActions } from "./DriveActions";

export function DriveBox() {
  const token = useAuthStore((s) => s.token);

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
    enabled: !!token,
  });

  const filesQuery = useQuery({
    queryKey: ["files"],
    queryFn: getFiles,
    enabled: !!token,
  });

  if (foldersQuery.isLoading || filesQuery.isLoading) {
    return (
      <>
        <div className="box-title">drive</div>
        <div className="muted">Loading…</div>
      </>
    );
  }

  if (foldersQuery.isError || filesQuery.isError) {
    return (
      <>
        <div className="box-title">drive</div>
        <div className="error">Failed to load</div>
        <button
          onClick={() => {
            foldersQuery.refetch();
            filesQuery.refetch();
          }}
        >
          Retry
        </button>
      </>
    );
  }

  const folders = foldersQuery.data ?? [];
  const files = filesQuery.data ?? [];

  return (
    <>
      <div className="box-title">drive</div>
      <FolderTree folders={folders} files={files} />
      <DriveActions folders={folders} />
    </>
  );
}