import { UPLOAD_FILE_FIELD, UPLOAD_FOLDER_ID_FIELD } from "shared-types";
import type {
  FileItem,
  DownloadResponse,
  FileNameBody,
  FileMoveBody,
  FileDeleteResponse,
} from "shared-types";
import { api } from "./client";

export const getFiles = async (): Promise<FileItem[]> => {
  const { data } = await api.get<FileItem[]>("/files");
  return data;
};

export const uploadFile = async (
  file: File,
  folderId: string,
): Promise<FileItem> => {
  const formData = new FormData();
  formData.append(UPLOAD_FILE_FIELD, file);
  formData.append(UPLOAD_FOLDER_ID_FIELD, folderId);
  const { data } = await api.post<FileItem>("/files/upload", formData);
  return data;
};

export const downloadFile = async (
  id: string,
): Promise<DownloadResponse> => {
  const { data } = await api.get<DownloadResponse>(
    `/files/${id}/download`,
  );
  return data;
};

export const renameFile = async (
  id: string,
  body: FileNameBody,
): Promise<FileItem> => {
  const { data } = await api.patch<FileItem>(`/files/${id}`, body);
  return data;
};

export const moveFile = async (
  id: string,
  body: FileMoveBody,
): Promise<FileItem> => {
  const { data } = await api.patch<FileItem>(`/files/${id}/move`, body);
  return data;
};

export const deleteFile = async (
  id: string,
): Promise<FileDeleteResponse> => {
  const { data } = await api.delete<FileDeleteResponse>(`/files/${id}`);
  return data;
};