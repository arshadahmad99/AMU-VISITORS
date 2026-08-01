import { Router, Response } from 'express';
import { DashboardStats } from '@digital-library/types';
import { usersStore, booksStore, purchasesStore, visitorRecordsStore } from '../services/store';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET Admin Dashboard Analytics
router.get('/dashboard', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = usersStore.length;
  const totalBooks = booksStore.length;
  const totalSales = purchasesStore.length;
  const totalRevenue = purchasesStore.reduce((acc, curr) => acc + curr.amount, 0);
  const totalVisitorRecords = visitorRecordsStore.length;

  const categoryMap: Record<string, number> = {};
  booksStore.forEach((b) => {
    categoryMap[b.category] = (categoryMap[b.category] || 0) + 1;
  });

  const categoryDistribution = Object.keys(categoryMap).map((cat) => ({
    category: cat,
    count: categoryMap[cat],
  }));

  const revenueChart = [
    { date: 'Jan 2026', revenue: 1450 },
    { date: 'Feb 2026', revenue: 2100 },
    { date: 'Mar 2026', revenue: 3400 },
    { date: 'Apr 2026', revenue: 4200 },
    { date: 'May 2026', revenue: 5800 },
    { date: 'Jun 2026', revenue: 7500 },
    { date: 'Jul 2026', revenue: Math.round(totalRevenue) },
  ];

  const stats: DashboardStats = {
    totalUsers,
    totalBooks,
    totalSales,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalVisitorRecords,
    revenueChart,
    categoryDistribution,
    visitorTrends: [
      { year: 1950, count: 12 },
      { year: 1970, count: 45 },
      { year: 1990, count: 120 },
      { year: 2010, count: 450 },
      { year: 2024, count: 980 },
    ],
  };

  return res.json(stats);
});

// GET All Users with Purchase Counts
router.get('/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userList = usersStore.map((u) => {
    const userPurchases = purchasesStore.filter((p) => p.userId === u.id);
    return {
      ...u,
      purchaseCount: userPurchases.length,
      totalSpent: userPurchases.reduce((sum, p) => sum + p.amount, 0),
      purchases: userPurchases,
    };
  });
  return res.json(userList);
});

// PUT Block / Unblock User
router.put('/users/:id/block', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const user = usersStore.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.isBlocked = !user.isBlocked;
  return res.json({ message: `User ${user.name} is now ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
});

// DELETE User
router.delete('/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const index = usersStore.findIndex((u) => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const deleted = usersStore.splice(index, 1);
  return res.json({ message: 'User account deleted', user: deleted[0] });
});

// GET All Purchase Orders
router.get('/orders', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json(purchasesStore);
});

export default router;
