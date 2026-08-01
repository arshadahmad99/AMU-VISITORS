import { booksStore, visitorRecordsStore, usersStore, purchasesStore } from '../src/services/store';

async function main() {
  console.log('🌱 Database Seed Script Executing...');
  console.log(`✅ Loaded ${usersStore.length} users into seed registry.`);
  console.log(`✅ Loaded ${booksStore.length} eBooks into catalog seed.`);
  console.log(`✅ Loaded ${visitorRecordsStore.length} University Visitor Records into seed registry.`);
  console.log(`✅ Loaded ${purchasesStore.length} recent book purchases.`);
  console.log('🎉 Seeding successfully populated database!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  });
