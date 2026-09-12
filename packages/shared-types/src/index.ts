export type Folder = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
};

export type FileItem = {
  id: string;
  name: string;
  s3Key: string | null;
  size: number | null;
  mimeType: string | null;
  userId: string;
  folderId: string | null;
  createdAt: string;
};

export type MeUser = {
  id: string;
  username: string;
  createdAt: string;
};

export type LoginResponse = { token: string };
export type VerifyResponse = { valid: true };
export type SignupResponse = { id: string; username: string };

export type ErrorResponse = { message: string };
export type SuccessResponse = { success: true };
export type DownloadResponse = { url: string };
export type HealthResponse = { status: "ok" };
export type FileDeleteResponse = { message: string };

export type CredentialsBody = { username: string; password: string };
export type FolderNameBody = { name: string };
export type FileNameBody = { name: string };
export type FileMoveBody = { folderId: string };

export const UPLOAD_FILE_FIELD = "file" as const;
export const UPLOAD_FOLDER_ID_FIELD = "folderId" as const;