import type {
  Folder,
  FileItem,
  FolderNameBody,
  SuccessResponse,
} from "shared-types";
import { api } from "./client";

export const getFolders = async (): Promise<Folder[]> => {
  const { data } = await api.get<Folder[]>("/folders");
  return data;
};

export const createFolder = async (
  body: FolderNameBody,
): Promise<Folder> => {
  const { data } = await api.post<Folder>("/folders", body);
  return data;
};

export const renameFolder = async (
  id: string,
  body: FolderNameBody,
): Promise<SuccessResponse> => {
  const { data } = await api.patch<SuccessResponse>(
    `/folders/${id}`,
    body,
  );
  return data;
};

export const deleteFolder = async (id: string): Promise<SuccessResponse> => {
  const { data } = await api.delete<SuccessResponse>(`/folders/${id}`);
  return data;
};

export const getFolderFiles = async (id: string): Promise<FileItem[]> => {
  const { data } = await api.get<FileItem[]>(`/folders/${id}/files`);
  return data;
};