const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.visitorRecord.findMany();
  console.log('Total records:', records.length);

  const websiteUploadsDir = path.resolve(__dirname, '../../apps/website/public/uploads');
  const apiUploadsDir = path.resolve(__dirname, 'uploads');

  console.log('websiteUploadsDir:', websiteUploadsDir);
  console.log('apiUploadsDir:', apiUploadsDir);

  let autoFoundInWebsite = 0, autoMissingInWebsite = 0;
  let photoFoundInWebsite = 0, photoMissingInWebsite = 0;

  let autoFoundInApi = 0, autoMissingInApi = 0;
  let photoFoundInApi = 0, photoMissingInApi = 0;

  for (const r of records) {
    if (r.autographPath) {
      // autographPath is /uploads/autographs/...
      const relPath = r.autographPath.replace(/^\/uploads\//, '');
      const webFile = path.join(websiteUploadsDir, relPath);
      const apiFile = path.join(apiUploadsDir, relPath);

      if (fs.existsSync(webFile)) autoFoundInWebsite++; else autoMissingInWebsite++;
      if (fs.existsSync(apiFile)) autoFoundInApi++; else autoMissingInApi++;
    }

    if (r.visitorImagePath) {
      const relPath = r.visitorImagePath.replace(/^\/uploads\//, '');
      const webFile = path.join(websiteUploadsDir, relPath);
      const apiFile = path.join(apiUploadsDir, relPath);

      if (fs.existsSync(webFile)) photoFoundInWebsite++; else photoMissingInWebsite++;
      if (fs.existsSync(apiFile)) photoFoundInApi++; else photoMissingInApi++;
    }
  }

  console.log('Autographs in website public:', { found: autoFoundInWebsite, missing: autoMissingInWebsite });
  console.log('Photos in website public:', { found: photoFoundInWebsite, missing: photoMissingInWebsite });
  console.log('Autographs in api uploads:', { found: autoFoundInApi, missing: autoMissingInApi });
  console.log('Photos in api uploads:', { found: photoFoundInApi, missing: photoMissingInApi });
}
main().catch(console.error).finally(() => prisma.$disconnect());


