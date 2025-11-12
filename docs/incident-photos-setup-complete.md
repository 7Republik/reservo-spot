# Incident Photos Storage - Setup Complete ✅

**Date**: 2025-11-12  
**Status**: ✅ Completed

## What Was Done

### 1. Storage Bucket Created
- **Bucket ID**: `incident-photos`
- **Method**: Manual creation via Supabase Dashboard
- **Configuration**:
  - Public: ❌ No (requires authentication)
  - File size limit: 10 MB
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/heic`, `image/heif`

### 2. RLS Policies Applied
Migration: `20251112000130_create_incident_photos_bucket.sql`

**Policies created**:
1. ✅ Users can upload incident photos (to their own folder)
2. ✅ Users can view their own incident photos
3. ✅ Admins can view all incident photos
4. ✅ Users can delete their own photos (within 24 hours)
5. ✅ Admins can delete any incident photos

### 3. Database Schema
The `incident_reports` table already has:
- `photo_url` column (TEXT) - Stores the storage path to the photo
- Extended with incident reporting features (migration 20251111234017)

### 4. File Structure
Photos are stored with this pattern:
```
incident-photos/
  └── {user_id}/
      └── {filename}
```

Example: `incident-photos/550e8400-e29b-41d4-a716-446655440000/incident-2025-11-12-abc123.jpg`

## How to Use

### Upload Photo (Frontend)
```typescript
import { supabase } from '@/integrations/supabase/client';

async function uploadIncidentPhoto(file: File, userId: string) {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('incident-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL (requires authentication to access)
  const { data: { publicUrl } } = supabase.storage
    .from('incident-photos')
    .getPublicUrl(filePath);

  return publicUrl;
}
```

### Save to Database
```typescript
// After uploading photo, save the URL to incident_reports
const { data, error } = await supabase
  .from('incident_reports')
  .insert({
    reservation_id: reservationId,
    reporter_id: userId,
    description: description,
    photo_url: photoUrl, // URL from upload
    offending_license_plate: licensePlate,
    status: 'pending'
  });
```

### Display Photo (Frontend)
```typescript
// The photo_url from database can be used directly in <img> tag
// RLS policies ensure users can only see their own photos or admins see all
<img src={incidentReport.photo_url} alt="Incident evidence" />
```

## Verification

Run the verification script:
```bash
npx tsx scripts/verify-incident-photos-bucket.ts
```

This will check:
- ✅ Bucket exists
- ✅ Can list files
- ✅ User authentication status

## Next Steps

1. **Implement UI Components**:
   - Incident report form with photo upload
   - Photo preview in incident details
   - Admin panel for reviewing incidents with photos

2. **Add Photo Validation**:
   - File size check (max 10 MB)
   - MIME type validation
   - Image compression (optional)

3. **Enhance User Experience**:
   - Photo preview before upload
   - Upload progress indicator
   - Error handling for failed uploads

## Related Files

- Migration: `supabase/migrations/20251112000130_create_incident_photos_bucket.sql`
- Incident features: `supabase/migrations/20251111234017_add_incident_reporting_features.sql`
- Verification script: `scripts/verify-incident-photos-bucket.ts`
- Documentation: `.kiro/steering/supabase.md` (updated)

## Security Notes

- ✅ RLS policies enforce user isolation
- ✅ Only authenticated users can upload
- ✅ Users can only access their own photos
- ✅ Admins have full access for moderation
- ✅ 24-hour deletion window for users
- ✅ File size limited to 10 MB
- ✅ MIME types restricted to images only

## Troubleshooting

### "Permission denied" on upload
- Ensure user is authenticated
- Check that file path starts with user's UUID
- Verify MIME type is allowed

### "Bucket not found"
- Verify bucket was created in Dashboard
- Check bucket name is exactly `incident-photos`

### "File too large"
- Maximum file size is 10 MB
- Consider compressing images before upload

---

**Setup completed successfully!** 🎉
