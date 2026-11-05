import dns from 'node:dns';
try { dns.setDefaultResultOrder('ipv4first'); } catch {}

import { supabaseAdmin } from '../src/config/supabase.js';

async function run() {
  const { data, error } = await supabaseAdmin.storage.listBuckets();
  console.log('Buckets:', data);
  if (error) console.error('Error listing buckets:', error);

  const bucketName = 'product-images';
  const exists = data && data.some(b => b.name === bucketName);
  if (!exists) {
    console.log(`Creating bucket ${bucketName}...`);
    const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB limit (compressed WebP will be < 300KB anyway)
      allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
    });
    console.log('Create result:', createData, createError);
  } else {
    console.log(`Bucket ${bucketName} already exists!`);
    // ensure public is true
    const { data: updateData, error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
    });
    console.log('Update bucket public setting:', updateData, updateError);
  }
}

run().catch(console.error);

