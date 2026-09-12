import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import type {
  HealthResponse,
  SignupResponse,
  LoginResponse,
  VerifyResponse,
  MeUser,
  Folder,
  FileItem,
  DownloadResponse,
  SuccessResponse,
  ErrorResponse,
  FileDeleteResponse,
} from "shared-types";
import { UPLOAD_FILE_FIELD, UPLOAD_FOLDER_ID_FIELD } from "shared-types";

const prisma = new PrismaClient();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET ?? "super-secret";

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
  } as HealthResponse);
});

app.post("/auth/signup", async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUser) {
    return res.status(409).json({
      message: "Username already exists",
    } as ErrorResponse);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  return res.status(201).json({
    id: user.id,
    username: user.username,
  } as SignupResponse);
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials",
    } as ErrorResponse);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Invalid credentials",
    } as ErrorResponse);
  }

  const token = jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  return res.json({
    token,
  } as LoginResponse);
});

//
interface AuthenticatedRequest extends express.Request {
  // without this, in the below authMiddleWare function
  // ts cries that property userId doesn't exist on AuthenticatedRequest
  userId?: string;
}

// attaching userId to the req object
// essentially promoting a value from deep within the JWT payload
// and attaching it directly to req for convenience
function authMiddleware(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized",
    } as ErrorResponse);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    req.userId = payload.userId;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid token",
    } as ErrorResponse);
  }
}

app.post("/auth/verify", authMiddleware, async (_req, res) => {
  return res.json({
    valid: true,
  } as VerifyResponse);
});

// using the JWT payload attached to req.userID, find user Details
app.get("/auth/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    } as ErrorResponse);
  }

  return res.json(user as unknown as MeUser);
});

// Simulating folders thru DB, not S3.. since S3 doesn't really have folders
app.post("/folders", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { name } = req.body;

  const folder = await prisma.folder.create({
    data: {
      name,
      userId: req.userId!,
    },
  });

  return res.status(201).json(folder as unknown as Folder);
});

// return folders based on the descending order of creation time
// also just for simplicity, only supporting top level folders (folders
// can't have folders within - not modelled in the schema.prisma)

// A folder hierarchy could be simulated on the frontend using
// file key prefixes (similar to how S3 represents folders).
app.get("/folders", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const folders = await prisma.folder.findMany({
    where: {
      userId: req.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(folders as unknown as Folder[]);
});

// renaming folder name
app.patch(
  "/folders/:folderId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const { name } = req.body;
    const folderId = req.params.folderId as string;
    const folder = await prisma.folder.updateMany({
      where: {
        id: folderId,
        userId: req.userId,
      },
      data: {
        name,
      },
    });

    if (folder.count === 0) {
      return res.status(404).json({
        message: "Folder not found",
      } as ErrorResponse);
    }

    return res.json({
      success: true,
    } as SuccessResponse);
  },
);

app.delete(
  "/folders/:folderId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const folderId = req.params.folderId as string;

    const result = await prisma.folder.deleteMany({
      where: {
        id: folderId,
        userId: req.userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Folder not found",
      } as ErrorResponse);
    }

    return res.json({
      success: true,
    } as SuccessResponse);
  },
);

// No need to query S3 here, file metadata and folder associations
// are stored in the database.
app.get(
  "/folders/:folderId/files",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const folderId = req.params.folderId as string;

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: req.userId,
      },
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found",
      } as ErrorResponse);
    }

    const files = await prisma.file.findMany({
      where: {
        folderId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(files as unknown as FileItem[]);
  },
);

const upload = multer({
  storage: multer.memoryStorage(),
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// attached the file to req.file
// multipart-formatdata requst
app.post(
  "/files/upload",
  authMiddleware,
  upload.single(UPLOAD_FILE_FIELD),
  async (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      } as ErrorResponse);
    }

    const folderId = req.body[UPLOAD_FOLDER_ID_FIELD] as string;

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: req.userId,
      },
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found",
      } as ErrorResponse);
    }

    // allows users to send files with same names (since Date.now())
    const key = `users/${req.userId}/${Date.now()}-${req.file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.FILES_BUCKET_NAME!,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        s3Key: key,
        userId: req.userId!,
        folderId,
      },
    });

    return res.status(201).json(file as unknown as FileItem);
  },
);

app.get("/files", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const files = await prisma.file.findMany({
    where: {
      userId: req.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(files as unknown as FileItem[]);
});

app.get(
  "/files/:fileId/download",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const fileId = req.params.fileId as string;

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: req.userId,
      },
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      } as ErrorResponse);
    }

    if (!file.s3Key) {
      return res.status(500).json({
        message: "File is missing S3 key",
      } as ErrorResponse);
    }
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.FILES_BUCKET_NAME!,
        Key: file.s3Key,
      }),
      {
        expiresIn: 3600,
      },
    );

    return res.json({
      url,
    } as DownloadResponse);
  },
);

app.patch(
  "/files/:fileId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const { name } = req.body;
    const fileId = req.params.fileId as string;

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: req.userId,
      },
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      } as ErrorResponse);
    }

    const updatedFile = await prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        name,
      },
    });

    return res.json(updatedFile as unknown as FileItem);
  },
);

app.patch(
  "/files/:fileId/move",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const fileId = req.params.fileId as string;
    const { folderId } = req.body;

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: req.userId,
      },
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      } as ErrorResponse);
    }

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: req.userId,
      },
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found",
      } as ErrorResponse);
    }

    const updatedFile = await prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        folderId,
      },
    });

    return res.json(updatedFile as unknown as FileItem);
  },
);

app.delete(
  "/files/:fileId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const fileId = req.params.fileId as string;

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: req.userId,
      },
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      } as ErrorResponse);
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.FILES_BUCKET_NAME!,
        Key: file.s3Key!,
      }),
    );

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    return res.json({
      message: "File deleted",
    } as FileDeleteResponse);
  },
);

app.listen(3000, () => {
  console.log("API running on port 3000");
});