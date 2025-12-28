# Media Upload Feature

## Overview
Images and YouTube videos can be embedded in posts using the TipTap rich text editor.

## Features

### Image Upload
- **Storage**: Netlify Blobs (10GB free tier)
- **Max file size**: 5MB per image
- **Supported formats**: All standard image formats (JPG, PNG, GIF, WebP, etc.)
- **CDN**: Automatic via Netlify
- **Database tracking**: All uploads tracked in `media` table

### Video Embeds
- **YouTube**: Paste YouTube URL to embed videos
- **Responsive**: Videos automatically sized for mobile/desktop

## Usage

### For Admins (Content Authors)

1. **Insert Image**:
   - Click the image icon (📷) in the editor toolbar
   - Select an image file (max 5MB)
   - Image uploads automatically and appears in editor
   - Image is served via Netlify CDN

2. **Embed YouTube Video**:
   - Click the video icon (🎬) in the editor toolbar
   - Paste YouTube URL (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
   - Video player embeds automatically

## Technical Details

### File Storage
```
Netlify Blobs Store: "media"
URL Pattern: /.netlify/blobs/media/{uuid}.{ext}
```

### Database Schema
```typescript
media {
  id: UUID
  filename: string          // Unique filename (UUID.ext)
  originalFilename: string  // Original uploaded filename
  contentType: string       // MIME type (e.g., "image/jpeg")
  size: number             // File size in bytes
  url: string              // Public CDN URL
  uploadedBy: UUID         // Admin user ID
  createdAt: timestamp
}
```

### Server Functions
- `uploadImage()`: Handles image upload to Netlify Blobs
- `deleteMedia()`: Removes image from Blobs and database (future admin feature)

### Security
- ✅ Admin-only uploads
- ✅ File type validation
- ✅ File size limits (5MB)
- ✅ Unique filenames prevent overwrites
- ✅ All uploads tracked with user attribution

## Future Enhancements
- [ ] Media library UI for browsing/reusing uploaded images
- [ ] Image optimization/resizing before upload
- [ ] Drag & drop image upload
- [ ] Vimeo/other video platforms
- [ ] Direct video file uploads (MP4, WebM)
- [ ] Batch media cleanup for orphaned files
