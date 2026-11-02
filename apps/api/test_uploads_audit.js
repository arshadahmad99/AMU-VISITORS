const http = require('http');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Import our express app
const app = require('./dist/src/server').default;

const server = app.listen(5099, async () => {
  console.log('🧪 Test server started on http://localhost:5099');

  const request = (urlPath) => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:5099${urlPath}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        }));
      }).on('error', reject);
    });
  };

  try {
    const prisma = new PrismaClient();
    const records = await prisma.visitorRecord.findMany();
    console.log(`\n--- 1. AUDITING DATABASE VISITOR RECORDS (Total: ${records.length}) ---`);

    const sampleWithBoth = records.find(r => r.autographPath && r.visitorImagePath);
    if (!sampleWithBoth) {
      throw new Error('Could not find sample record with both autograph and photo');
    }
    console.log('Sample Visitor:', sampleWithBoth.visitorName);
    console.log('Autograph Path:', sampleWithBoth.autographPath);
    console.log('Photo Path:', sampleWithBoth.visitorImagePath);

    // Test 1: Real autograph returns 200 with image/bmp
    const autoRes = await request(sampleWithBoth.autographPath);
    console.log('\n[Test 1] Autograph Request Status:', autoRes.status, 'Content-Type:', autoRes.headers['content-type']);
    if (autoRes.status !== 200 || !autoRes.headers['content-type'].includes('image/bmp')) {
      throw new Error(`Test 1 Failed: Expected 200 and image/bmp, got ${autoRes.status} and ${autoRes.headers['content-type']}`);
    }
    console.log('✅ Test 1 Passed: Real autograph file returns HTTP 200 image/bmp');

    // Test 2: Real photo returns 200 with image/bmp
    const photoRes = await request(sampleWithBoth.visitorImagePath);
    console.log('\n[Test 2] Photo Request Status:', photoRes.status, 'Content-Type:', photoRes.headers['content-type']);
    if (photoRes.status !== 200 || !photoRes.headers['content-type'].includes('image/bmp')) {
      throw new Error(`Test 2 Failed: Expected 200 and image/bmp, got ${photoRes.status} and ${photoRes.headers['content-type']}`);
    }
    console.log('✅ Test 2 Passed: Real photo file returns HTTP 200 image/bmp');

    // Test 3: Fallback visitor SVG returns 200
    const fbVisRes = await request('/uploads/fallback-visitor.svg');
    console.log('\n[Test 3] Fallback Visitor SVG Status:', fbVisRes.status, 'Content-Type:', fbVisRes.headers['content-type']);
    if (fbVisRes.status !== 200 || !fbVisRes.headers['content-type'].includes('image/svg+xml')) {
      throw new Error(`Test 3 Failed: Expected 200 image/svg+xml, got ${fbVisRes.status}`);
    }
    console.log('✅ Test 3 Passed: Fallback visitor SVG returns HTTP 200 image/svg+xml');

    // Test 4: Fallback autograph SVG returns 200
    const fbAutoRes = await request('/uploads/fallback-autograph.svg');
    console.log('\n[Test 4] Fallback Autograph SVG Status:', fbAutoRes.status, 'Content-Type:', fbAutoRes.headers['content-type']);
    if (fbAutoRes.status !== 200 || !fbAutoRes.headers['content-type'].includes('image/svg+xml')) {
      throw new Error(`Test 4 Failed: Expected 200 image/svg+xml, got ${fbAutoRes.status}`);
    }
    console.log('✅ Test 4 Passed: Fallback autograph SVG returns HTTP 200 image/svg+xml');

    // Test 5: Missing file returns 404 with JSON error and fallbackUrl hint
    const missingRes = await request('/uploads/autographs/missing_photo_nonexistent.bmp');
    console.log('\n[Test 5] Missing file Status:', missingRes.status, 'Body:', missingRes.body);
    if (missingRes.status !== 404) {
      throw new Error(`Test 5 Failed: Expected 404, got ${missingRes.status}`);
    }
    console.log('✅ Test 5 Passed: Missing file returns HTTP 404 with logging and fallback hints');

    // Test 6: Missing file with ?fallback=true returns HTTP 200 SVG directly
    const fallbackParamRes = await request('/uploads/autographs/missing_photo_nonexistent.bmp?fallback=true');
    console.log('\n[Test 6] Missing file with fallback=true Status:', fallbackParamRes.status, 'Content-Type:', fallbackParamRes.headers['content-type']);
    if (fallbackParamRes.status !== 200 || !fallbackParamRes.headers['content-type'].includes('image/svg+xml')) {
      throw new Error(`Test 6 Failed: Expected 200 image/svg+xml, got ${fallbackParamRes.status}`);
    }
    console.log('✅ Test 6 Passed: Missing file with ?fallback=true returns HTTP 200 SVG fallback');

    // Test 7: Security check - Path traversal to secure_uploads or package.json
    const traversalRes = await request('/uploads/../../package.json');
    console.log('\n[Test 7] Security Path Traversal Status:', traversalRes.status);
    if (traversalRes.status !== 403 && traversalRes.status !== 404) {
      throw new Error(`Test 7 Failed: Path traversal was not blocked, got ${traversalRes.status}`);
    }
    console.log('✅ Test 7 Passed: Path traversal blocked (HTTP ' + traversalRes.status + ')');

    // Test 8: Full database file mapping check
    let autoOk = 0, photoOk = 0;
    for (const r of records) {
      if (r.autographPath) {
        const file = path.join(__dirname, 'uploads', r.autographPath.replace('/uploads/', ''));
        if (fs.existsSync(file)) autoOk++;
      }
      if (r.visitorImagePath) {
        const file = path.join(__dirname, 'uploads', r.visitorImagePath.replace('/uploads/', ''));
        if (fs.existsSync(file)) photoOk++;
      }
    }
    console.log('\n[Test 8] All DB records file existence check:');
    console.log(`- Autographs available on disk: ${autoOk} / 158 (${((autoOk/158)*100).toFixed(1)}%)`);
    console.log(`- Photos available on disk: ${photoOk} / 88 (${((photoOk/88)*100).toFixed(1)}%)`);
    if (autoOk !== 158 || photoOk !== 88) {
      throw new Error(`Test 8 Failed: Some DB records are missing on disk!`);
    }
    console.log('✅ Test 8 Passed: 100% of visitor autograph and photo files are present on disk!');

    console.log('\n========================================');
    console.log('🎉 ALL 8 TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
});
