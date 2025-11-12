/**
 * Script to verify incident-photos bucket configuration
 * Run with: npx tsx scripts/verify-incident-photos-bucket.ts
 */

import { supabase } from '../src/integrations/supabase/client';

async function verifyBucket() {
  console.log('🔍 Verifying incident-photos bucket...\n');

  try {
    // 1. Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const incidentBucket = buckets?.find(b => b.id === 'incident-photos');
    
    if (!incidentBucket) {
      console.error('❌ Bucket "incident-photos" not found');
      console.log('Available buckets:', buckets?.map(b => b.id).join(', '));
      return;
    }

    console.log('✅ Bucket exists:', incidentBucket.name);
    console.log('   - Public:', incidentBucket.public);
    console.log('   - Created:', incidentBucket.created_at);
    console.log('   - Updated:', incidentBucket.updated_at);
    console.log();

    // 2. Try to list files (should work for authenticated users)
    const { data: files, error: listError } = await supabase
      .storage
      .from('incident-photos')
      .list();

    if (listError) {
      console.error('❌ Error listing files:', listError.message);
      return;
    }

    console.log('✅ Can list files in bucket');
    console.log(`   - Files found: ${files?.length || 0}`);
    console.log();

    // 3. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('⚠️  Not authenticated - some tests skipped');
      console.log('   To test upload/download, authenticate first');
    } else {
      console.log('✅ Authenticated as:', user.email);
      console.log('   - User ID:', user.id);
    }

    console.log('\n✅ Bucket verification complete!');
    console.log('\nNext steps:');
    console.log('1. Implement incident report form with photo upload');
    console.log('2. Test upload from authenticated user');
    console.log('3. Verify RLS policies work correctly');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyBucket();
