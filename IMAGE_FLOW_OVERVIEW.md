# Photo Proof Application Image Flow

## High-Level Architecture

- **Frontend**: React/Vite app under `Photo_Proof_v1`, orchestrated from `App.tsx`, with API wrappers in `services/` and typed models in `types.ts`.
- **Backend**: FastAPI service under `photo_proof_api`, exposing both legacy `/api/projects` routes and modern `/v2/photos` & `/v2/upload` endpoints.
- **Database**: SQLite database `photo_proof.db` (configured via `app/core/config.py`) accessed through SQLAlchemy models in `app/db/models/`.
- **File Storage**: Local filesystem rooted at `photo_proof_api/uploads`; FastAPI mounts it at `/uploads`, making files available at `http://localhost:8000/uploads/...`.

## Database Entities for Images

- `Photo` (`app/db/models/photo.py`)
  - Core fields: `src`, `storage_path`, `width`, `height`, `file_size`, `mime_type`, `order_index`, `status`.
  - Relations: `project` (parent project), `folder` (optional), `uploaded_by_user`, `comments`, `favorites`, `selections`, `cart_items`.
- `Project` (`app/db/models/project.py`)
  - Maintains `photo_count`, `cover_photo_id`, `has_folders`, and links to `photos` & `folders`.
- `Folder` (`app/db/models/project.py`)
  - Holds `photo_count`, `cover_photo_id`, and an ordered list of `photos` for sub-albums.
- `UploadSession` & `UploadToken` (`app/db/models/upload.py`)
  - Track batch uploads, presigned tokens, destination `storage_path`, and optional `folder_id`.
- `CartItem` (`app/db/models/store.py`)
  - References `photo_id` to bind store purchases to specific images.

## Backend Image APIs

### Static Serving

- `create_app()` (FastAPI bootstrap) mounts `/uploads` to the local uploads directory, enabling direct HTTP access to stored files.

### Upload Lifecycle (`app/routers/upload.py` + `UploadService`)

1. `POST /v2/upload/presigned`
   - Request: `{ project_id, filename, content_type, file_size, folder_id? }`.
   - Response (`PresignedUploadResponse`): `{ upload_url: " /v2/upload/{token}", token, expires_at, method }`.
2. Client uploads file via `PUT /v2/upload/{token}` (multipart FormData with `file`).
3. `UploadService.complete_upload()` saves bytes through `LocalStorageService`, records `Photo`, updates `Project.photo_count`, sets default cover images, and syncs folder counts.
4. Batch helpers: `POST /v2/upload/session`, `PATCH /v2/upload/session/{id}`, `POST /v2/upload/batch/presigned`, `GET /v2/upload/batch/verify/{session_id}` (all maintain `UploadSession.upload_rules`).

### Retrieval & Management (`app/routers/photos.py`)

- `GET /v2/photos/{photo_id}` → returns `PhotoResponse` with full metadata, enforcing project access by user role.
- `GET /v2/photos/projects/{project_id}/photos`
  - Optional `folder_id` query filters by folder; results ordered by `order_index` then `created_at`.
  - Response shape: `{ photos: PhotoResponse[], total }` with fields: `id`, `project_id`, `folder_id`, `src`, `original_filename`, `width`, `height`, `file_size`, `mime_type`, `thumbnail_path`, `order_index`, `comment_count`, `status`, `uploaded_by`, timestamps.
- Mutations: `PATCH /v2/photos/{id}`, `DELETE /v2/photos/{id}`, `POST/DELETE /v2/photos/{id}/favorite`, `POST/DELETE /v2/photos/{id}/select`, plus list endpoints for favorites/selections.

### Project & Folder Metadata (`app/api/v1/projects.py`)

- `GET /api/projects`
  - Eager-loads `Project.cover_photo` and returns `cover_photo_src` (uses `Photo.src`). Clients/studios consume this for album covers.
- `GET /api/projects/{id}/folders`
  - Returns folders with `coverPhotoSrc`, `photoCount`, enabling folder thumbnails in the UI.

## Frontend Consumption Flow (`App.tsx` + components)

### Bootstrap

1. After authentication, `App.tsx` calls `projectService.getProjects()` → maps each backend project to `Album`, normalizing `cover_photo_src` to an absolute URL (`http://localhost:8000` prefix when needed).
2. For every album, `photoService.getProjectPhotos(projectId)` fetches gallery photos.
   - `PhotoService` wraps `/v2/photos/projects/{id}/photos` and prefixes relative `src` values before storing them in `Album.photos`.

### Folder-Aware Navigation

- `handleOpenGalleryFromCover()` fetches folders via `projectService.getProjectFolders(projectId)`.
- `AlbumFoldersView` makes the same call on mount to refresh data, presenting each folder card with `coverPhotoSrc` and `photoCount`.
- Selecting a folder triggers `photoService.getProjectPhotos(projectId, folderId)`; results populate `galleryContent` for display.
- `handleViewAllPhotos()` re-fetches the unfiltered list (omits `folder_id`) and updates album cover art if necessary.

### Rendering & Interaction

- `GalleryPage`, `PhotoGrid`, `PhotoItem`, and `Lightbox` use `Photo.src` directly for `<img>` tags, toggling favorites/selections client-side while invoking the respective `/v2/photos/{id}/favorite|select` endpoints when wired up.
- Downloads use the same `photo.src` URL, linking straight to `/uploads/...`.
- Store flows (`PhotoSelectionPage`, cart builder, order checkout) reuse `Album.photos` arrays when allowing clients to choose images for products; `CartItem.photo_id` ties orders back to the stored photo records.

## Features Fetching Images from the Backend

- **Album list / Dashboard**: `GET /api/projects` supplies cover thumbnails for every project tile.
- **Cover Page**: Uses album-level `coverPhotoSrc`, falling back to `/placeholder-image.jpg` until either `Project.cover_photo` is set server-side or the first photo is loaded client-side.
- **Album & Gallery Folder grids**: `GET /api/projects/{id}/folders` for folder hero images and counts.
- **Gallery views**: `GET /v2/photos/projects/{id}/photos` (with or without `folder_id`) delivers the full-resolution gallery feeds.
- **Upload confirmations**: `uploadService.uploadWithProgress()` consumes the `PhotoResponse` returned by `PUT /v2/upload/{token}` to append newly uploaded images to the UI immediately.
- **Store selection & Compare tools**: Operate on the same photo collections already loaded through the gallery APIs.

## Data Handling Notes

- The API client (`lib/api-client.ts`) automatically attaches `Authorization` headers and prefixes backend URLs with `VITE_API_URL` (defaults to `http://localhost:8000`).
- Frontend consistently ensures relative `src` paths are converted to absolute URLs before rendering.
- Backend image metadata (`width`, `height`, `file_size`, `mime_type`) is populated during upload using Pillow, enabling the UI to maintain aspect ratios and display download sizes if needed.
- Project and folder photo counts stay in sync server-side within `UploadService.complete_upload()`, guaranteeing accurate badges in list views without extra queries.

## Worst-Case Image Fetch Load Scenario

- A freshly authenticated **studio user** landing on the dashboard triggers `GET /api/projects` and, for each project rendered in App.tsx, `GET /v2/photos/projects/{projectId}/photos`; with `N` projects this can mean `1 + N` photo-list queries in a single session startup.
- A **client user** opening the same project will execute the same `GET /api/projects` once, then `GET /api/projects/{id}/folders` and either one folder-filtered `GET /v2/photos/projects/{id}/photos?folder_id=...` per folder visited or an unfiltered fetch for “View All Photos`.
- If both studio and client users browse the same galleries concurrently and each navigates through all folders, the backend may serve roughly `2 × (1 + N + F)` photo-list responses (where `F` is per-project folder count), potentially returning the full photo payload multiple times.
- Because every response includes full photo metadata, a gallery with thousands of assets can stress the `/v2/photos` endpoint and underlying database; caching, pagination (`skip/limit` already exist), and CDN-backed static delivery are key to mitigating this repeated-load pattern.
