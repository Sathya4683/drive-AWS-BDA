==================
Drive (BDA lab)
==================

A small file storage app. Login, create folders, upload files, download, rename, move, delete.

AWS
===

- VPC with public + isolated subnets across 2 AZs, no NAT gateway
- RDS Postgres 17 on t3.micro, 20 GB, isolated subnets, no public access
- EC2 t3.micro with Amazon Linux 2023, runs the API server and hosts the built frontend
- S3 bucket (versioned) for uploaded files, presigned URLs for downloads
- S3 bucket provisioned for frontend static hosting

Stack
=====

Monorepo (Turborepo + pnpm)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Workspaces: ``apps/api``, ``apps/web``, ``apps/infra``, ``packages/shared-types``
- Turbo orchestrates ``build``, ``lint``, ``typecheck`` across the workspaces with task dependencies
- pnpm handles workspace deps and symlinks via the workspace protocol
- Shared types live in ``packages/shared-types`` and are imported by both apps, no duplication

Server (apps/api)
~~~~~~~~~~~~~~~~~

- Express + TypeScript
- Prisma ORM against Postgres
- JWT bearer auth with 7 day expiry, bcrypt hashed passwords
- multer for multipart upload, AWS SDK for S3 (``PutObject``, presigned ``GetObject``, ``DeleteObject``)
- CORS enabled so the frontend on a different origin can call it

Local dev
~~~~~~~~~

- docker-compose spins up Postgres and MinIO
- MinIO acts as a local S3 mock so the API runs without real AWS
- Same code works against MinIO and real S3, swap via env vars (``S3_ENDPOINT``, ``AWS_*``)

Frontend (apps/web)
~~~~~~~~~~~~~~~~~~~

- Vite + React 19 + TypeScript
- Single page, no router, two visual states (logged out / logged in)
- Zustand for the JWT, persisted to ``localStorage``
- TanStack Query for folders and files, query invalidation after every mutation
- Axios with bearer interceptor for API calls

Deployment
==========

- DriveStack (CDK) was used only to create the AWS resources
- After ``cdk deploy``, SSH into the EC2 instance
- Clone the repo on the EC2
- Run ``pnpm install`` and start the API server
- Build the frontend locally, upload ``dist/`` to the EC2
- Add the production ``.env`` with the live API URL manually