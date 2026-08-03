import { PrismaClient } from '@prisma/client';
import { booksStore, visitorRecordsStore, usersStore, purchasesStore } from '../src/services/store';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Database Seed Script Executing...');
  
  console.log('Clearing old data...');
  await prisma.purchase.deleteMany();
  await prisma.visitorRecord.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  console.log(`✅ Loaded ${usersStore.length} users into seed registry.`);
  for (const u of usersStore) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: 'hashed_pw',
        role: u.role || 'USER'
      }
    });
  }

  console.log(`✅ Loaded ${booksStore.length} eBooks into catalog seed.`);
  for (const b of booksStore) {
    await prisma.book.create({
      data: {
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category,
        price: b.price,
        coverImage: b.coverImage,
        pdfUrl: b.pdfUrl || '',
        description: b.description,
        totalPages: b.totalPages,
        rating: b.rating,
        pagesTextJson: JSON.stringify(b.pagesText || [])
      }
    });
  }

  console.log(`✅ Loaded ${visitorRecordsStore.length} University Visitor Records into seed registry.`);
  for (const v of visitorRecordsStore) {
    await prisma.visitorRecord.create({
      data: {
        id: v.id,
        visitorName: v.visitorName,
        visitDate: v.visitDate,
        purpose: v.purpose,
        department: v.department,
        contact: v.contact,
        year: v.year,
        notes: v.notes,
        originalMdbId: v.originalMdbId
      }
    });
  }

  console.log(`✅ Loaded ${purchasesStore.length} recent book purchases.`);
  // Note: Skipping actual purchases seeding since we don't have all book/user associations mapped neatly in mock.

  console.log('🎉 Seeding successfully populated database!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
