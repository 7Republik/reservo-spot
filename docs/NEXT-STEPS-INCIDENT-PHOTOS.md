# Next Steps: Incident Photos Implementation

## ✅ Completed
- [x] Storage bucket `incident-photos` created manually
- [x] RLS policies applied via migration
- [x] Database schema ready (`incident_reports.photo_url`)
- [x] Documentation updated
- [x] Verification script created

## 🚀 Ready to Implement

### 1. Frontend Components (Priority: HIGH)

#### A. Incident Report Form with Photo Upload
**Location**: `src/components/incidents/IncidentReportForm.tsx`

**Features needed**:
- File input for photo upload
- Image preview before submission
- Upload progress indicator
- File size validation (max 10 MB)
- MIME type validation
- Error handling

**Example structure**:
```tsx
const IncidentReportForm = ({ reservationId }) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handlePhotoUpload = async (file: File) => {
    // Upload to storage
    // Save URL to database
  };
  
  return (
    <form>
      <input type="file" accept="image/*" />
      <textarea placeholder="Description" />
      <input placeholder="License plate" />
      <button type="submit">Submit Report</button>
    </form>
  );
};
```

#### B. Incident Details View
**Location**: `src/components/incidents/IncidentDetails.tsx`

**Features needed**:
- Display incident photo
- Lightbox/modal for full-size view
- Download option for admins
- Photo metadata (upload date, size)

#### C. Admin Incident Management
**Location**: `src/components/admin/incidents/IncidentManagement.tsx`

**Features needed**:
- List all incidents with photos
- Filter by status (pending, confirmed, dismissed, resolved)
- View photo evidence
- Confirm/dismiss incidents
- Issue warnings to users
- Reassign parking spots

### 2. Custom Hooks (Priority: HIGH)

#### A. useIncidentReports Hook
**Location**: `src/hooks/useIncidentReports.ts`

```typescript
export const useIncidentReports = () => {
  const loadReports = async () => { /* ... */ };
  const createReport = async (data, photo) => { /* ... */ };
  const updateReport = async (id, data) => { /* ... */ };
  const uploadPhoto = async (file, userId) => { /* ... */ };
  
  return { reports, loading, loadReports, createReport, updateReport };
};
```

#### B. useIncidentPhotoUpload Hook
**Location**: `src/hooks/useIncidentPhotoUpload.ts`

```typescript
export const useIncidentPhotoUpload = () => {
  const uploadPhoto = async (file: File, userId: string) => {
    // Handle upload logic
    // Return photo URL
  };
  
  const deletePhoto = async (photoUrl: string) => {
    // Handle deletion
  };
  
  return { uploadPhoto, deletePhoto, uploading, progress };
};
```

### 3. Type Definitions (Priority: MEDIUM)

#### Location: `src/types/incidents.ts`

```typescript
export interface IncidentReport {
  id: string;
  reservation_id: string;
  reporter_id: string;
  description: string;
  status: 'pending' | 'confirmed' | 'dismissed' | 'resolved';
  photo_url?: string;
  offending_license_plate?: string;
  offending_user_id?: string;
  original_spot_id?: string;
  reassigned_spot_id?: string;
  reassigned_reservation_id?: string;
  admin_notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  resolved_at?: string;
}

export interface IncidentReportFormData {
  description: string;
  offending_license_plate?: string;
  photo?: File;
}
```

### 4. Utilities (Priority: LOW)

#### A. Image Compression
**Location**: `src/lib/imageUtils.ts`

```typescript
export const compressImage = async (file: File, maxSizeMB: number) => {
  // Compress image if needed
  // Return compressed file
};

export const validateImageFile = (file: File) => {
  // Check size, MIME type
  // Return validation result
};
```

### 5. Testing (Priority: MEDIUM)

- [ ] Test photo upload from user account
- [ ] Test photo viewing (user can see own, admin can see all)
- [ ] Test photo deletion (within 24h window)
- [ ] Test RLS policies (unauthorized access blocked)
- [ ] Test file size limit (10 MB)
- [ ] Test MIME type restrictions

### 6. User Experience Enhancements (Priority: LOW)

- [ ] Image preview before upload
- [ ] Drag & drop photo upload
- [ ] Multiple photo support (future enhancement)
- [ ] Photo editing (crop, rotate)
- [ ] Camera capture on mobile devices
- [ ] Offline support (queue uploads)

## 📋 Implementation Order

1. **Phase 1**: Basic functionality
   - Create `useIncidentPhotoUpload` hook
   - Create `IncidentReportForm` component
   - Test upload and storage

2. **Phase 2**: Admin features
   - Create `IncidentManagement` component
   - Add photo viewing in admin panel
   - Implement incident confirmation workflow

3. **Phase 3**: User features
   - Add incident reporting to user dashboard
   - Show user's own incident reports
   - Display incident status updates

4. **Phase 4**: Polish
   - Add image compression
   - Improve error handling
   - Add loading states and animations
   - Mobile optimization

## 🔗 Related Documentation

- Setup guide: `docs/incident-photos-setup-complete.md`
- Supabase config: `.kiro/steering/supabase.md`
- Migration: `supabase/migrations/20251112000130_create_incident_photos_bucket.sql`
- Verification: `scripts/verify-incident-photos-bucket.ts`

## 🎯 Success Criteria

- [ ] Users can upload photos when reporting incidents
- [ ] Photos are stored securely with proper RLS
- [ ] Admins can view all incident photos
- [ ] Users can only see their own photos
- [ ] File size and type restrictions work
- [ ] Upload errors are handled gracefully
- [ ] Photos display correctly in UI

---

**Ready to start implementing!** 🚀
