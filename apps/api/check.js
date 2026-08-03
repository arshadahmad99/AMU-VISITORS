const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'shabahat@admin.com' } });
  if (admin) {
    const match = await bcrypt.compare('Shabahat@4321', admin.passwordHash);
    console.log('Password match?', match);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
