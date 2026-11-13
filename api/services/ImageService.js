/**
 * ImageService — shared helpers for the universal image convention.
 *
 * All Waterline models inherit canonical image attributes from
 * config/models.js (image, imageUrl, imageAlt, imageMeta, imageUploaded).
 * This service centralizes the small pieces of logic every image-aware
 * endpoint needs so controllers don't reimplement (or diverge on) them:
 *
 *   - MIME/extension validation for image uploads
 *   - Building the stable imageMeta payload stored on records
 *
 * It deliberately does NOT perform uploads itself; FileController.uploadFile
 * remains the single upload path (BunnyCDN) so existing behavior, retries,
 * folder support, and response shape are unchanged.
 */

// MIME types accepted when an upload is flagged as an image
// (`isImage=true` / `image=true` in the request body).
const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
];

// Fallback extension check for clients/browsers that send a generic
// `application/octet-stream` content type.
const ALLOWED_IMAGE_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'bmp', 'tif', 'tiff', 'heic', 'heif',
];

module.exports = {

    /** True when the given MIME type is an accepted image type. */
    isAllowedImageMime: function (contentType) {
        const mime = String(contentType || '').trim().toLowerCase();
        if (!mime) return false;
        if (ALLOWED_IMAGE_MIME_TYPES.includes(mime)) return true;
        // Accept any vendor-prefixed/parameterized image/* (e.g. "image/png; charset=binary").
        return mime.split(';')[0].trim().startsWith('image/');
    },

    /** True when the filename has an accepted image extension. */
    hasImageExtension: function (filename) {
        const match = /\.([a-z0-9]+)$/i.exec(String(filename || '').trim());
        if (!match) return false;
        return ALLOWED_IMAGE_EXTENSIONS.includes(match[1].toLowerCase());
    },

    /**
     * Validate an uploaded file as an image. Used by FileController.uploadFile
     * when the request indicates an image upload (`isImage`/`image` truthy).
     *
     * @param {object} file - a Skipper uploaded file descriptor (filename, type, size)
     * @returns {null | string} null when valid, otherwise a human-readable error message.
     */
    validateImageFile: function (file) {
        if (!file) return 'No file was uploaded.';
        const filename = String(file.filename || '');
        const contentType = String(file.type || file.contentType || '');
        const size = Number(file.size || 0);

        if (size <= 0) return 'Uploaded file is empty.';

        const mimeOk = this.isAllowedImageMime(contentType);
        const extOk = this.hasImageExtension(filename);
        // Generic octet-stream (or missing type) is tolerated only when the
        // extension clearly identifies an image; otherwise require image/*.
        if (!mimeOk && !(contentType === 'application/octet-stream' && extOk)) {
            return `Unsupported file type${contentType ? ` (${contentType})` : ''}. Expected an image (JPEG, PNG, WebP, GIF, AVIF, SVG).`;
        }
        if (!mimeOk && !extOk) {
            return 'Unsupported file. The upload does not look like an image.';
        }
        return null;
    },

    /**
     * Build the canonical `imageMeta` object to persist on a record after an
     * upload. Keeps only small, serializable, useful fields — never file contents.
     *
     * @param {object} file - Skipper uploaded file descriptor
     * @param {string} url  - final CDN URL of the uploaded file
     * @param {object} [extra] - optional extras (e.g. { folder })
     */
    buildImageMeta: function (file, url, extra) {
        return {
            filename: String(file?.filename || ''),
            contentType: String(file?.type || file?.contentType || ''),
            size: Number(file?.size || 0),
            url: String(url || ''),
            uploadedAt: new Date().toISOString(),
            ...(extra && typeof extra === 'object' ? extra : {}),
        };
    },
};
