# Image Support (Universal Image Convention)

Every Waterline model in this backend automatically supports a canonical set of
image fields. This is a **backend-wide convention**, not a per-model change —
the fields are defined once as base attributes in `config/models.js` and are
inherited by all current and future models.

## Canonical image fields (inherited by every model)

| Attribute       | Type      | Notes                                                        |
| --------------- | --------- | ------------------------------------------------------------ |
| `image`         | `string`  | Primary image URL (CDN/absolute). `null` when absent.         |
| `imageUrl`      | `string`  | Alias of `image`, for consumers that prefer the explicit name.|
| `imageAlt`      | `string`  | Accessibility/alt text. `null` when absent.                   |
| `imageMeta`     | `json`    | Upload metadata: `{filename, contentType, size, url, uploadedAt, folder, ...}`. |
| `imageUploaded` | `boolean` | `false` by default; set `true` once the binary is confirmed in storage. |

No model file needs to declare these — they exist on every model automatically
(`schema: true` + `migrate: 'alter'` adds the columns/collections safely).

## Preferred payload (new models)

```js
// Create a record with an image
await SomeModel.create({
    title: 'Example',
    image: 'https://travelimg.b-cdn.net/folder/photo_1690000000.jpg',
    imageUrl: 'https://travelimg.b-cdn.net/folder/photo_1690000000.jpg',
    imageAlt: 'Front view of the property',
    imageMeta: {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 248320,
        uploadedAt: '2026-09-29T08:00:00.000Z',
    },
    imageUploaded: true,
});
```

New models should use ONLY these canonical fields.

## Legacy model-specific fields (unchanged)

Some existing models predate the convention and keep their own fields — they
still work exactly as before and were **not** modified:

- `Area.featureImg`, `Area.hotelImg`, `Area.featureImgUploaded`
- `Site.featureImg` + `Site.uploaded`
- `Itinerary.featureImg`-style fields on other models, etc.

Read/write them as before. Do **not** remove them; migrate models to the
canonical fields opportunistically (e.g. when touching a model anyway), never
in a mass edit.

## Upload endpoint

`POST /api/file/uploadFile` (multipart/form-data, field name `fmFile`) remains
the single upload path (BunnyCDN, 20 MB limit, 3 retries).

### Generic file upload (unchanged)

```
fmFile: <binary>
folder: optional subfolder
```

Response is the raw CDN URL string (frontend contract preserved):

```
https://travelimg.b-cdn.net/folder/photo_1690000000.jpg
```

### Image upload (new optional validation)

Add a truthy flag to have the server validate that the upload is actually an
image before storing it:

```
fmFile:  <binary>
isImage: true        // or image=true
folder:  optional subfolder
```

- Accepted: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`,
  `image/svg+xml`, `image/bmp`, `image/tiff`, `image/heic`, `image/heif`
  (plus matching extensions when the browser sends `application/octet-stream`).
- Invalid uploads get `400 { code: 'Error', message: 'Unsupported file type ...' }`
  and are never written to storage.
- Without the flag, behavior is byte-for-byte identical to before (any file type
  allowed, raw URL string response). The response stays a **raw URL string** —
  frontend code across the app parses it as a string, so no JSON envelope was
  introduced.

## Example: new model using the convention

```js
// api/models/Gallery.js — nothing image-specific to declare
module.exports = {
    attributes: {
        title: { type: 'string', required: true },
        company: { model: 'company' },
        isDeleted: { type: 'boolean' },
        // image, imageUrl, imageAlt, imageMeta, imageUploaded are inherited
    },
};
```

## Helper service

`api/services/ImageService.js` centralizes validation/metadata helpers:

- `ImageService.isAllowedImageMime(contentType)`
- `ImageService.hasImageExtension(filename)`
- `ImageService.validateImageFile(skipperFile)` → `null | errorMessage`
- `ImageService.buildImageMeta(file, url, extra)` → object for `imageMeta`

Controllers performing their own image handling should reuse these instead of
reimplementing checks.
