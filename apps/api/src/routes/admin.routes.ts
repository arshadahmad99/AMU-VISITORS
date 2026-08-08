import { Router, Response } from 'express';
import { DashboardStats } from '@digital-library/types';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET Admin Dashboard Analytics
router.get('/dashboard', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBooks = await prisma.book.count();
    const totalSales = await prisma.purchase.count();
    
    const revenueAgg = await prisma.purchase.aggregate({
      _sum: { amount: true }
    });
    const totalRevenue = revenueAgg._sum.amount || 0;
    
    const totalVisitorRecords = await prisma.visitorRecord.count();

    const books = await prisma.book.findMany({ select: { category: true } });
    const categoryMap: Record<string, number> = {};
    books.forEach((b) => {
      categoryMap[b.category] = (categoryMap[b.category] || 0) + 1;
    });

    const categoryDistribution = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat],
    }));

    // Calculate real revenue chart data from purchases for the last 6 months
    const purchases = await prisma.purchase.findMany({
      select: { amount: true, createdAt: true },
      where: { status: 'completed' }, // Only completed if you have status, or all if no status enum. Let's fetch all for safety if we just care about gross.
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Pre-fill last 6 months with 0
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyRevenue[key] = 0;
    }

    purchases.forEach(p => {
      const date = new Date(p.createdAt);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += p.amount;
      }
    });

    const revenueChart = Object.keys(monthlyRevenue).map(date => ({
      date,
      revenue: Math.round(monthlyRevenue[date])
    }));

    const stats: DashboardStats = {
      totalUsers,
      totalBooks,
      totalSales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalVisitorRecords,
      revenueChart,
      categoryDistribution,
      visitorTrends: [],
    };

    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load dashboard', details: err.message });
  }
});

// GET All Users with Purchase Counts
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        purchases: true,
      }
    });

    const userList = users.map((u) => ({
      ...u,
      purchaseCount: u.purchases.length,
      totalSpent: u.purchases.reduce((sum, p) => sum + p.amount, 0),
    }));

    return res.json(userList);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// PUT Block / Unblock User
router.put('/users/:id/block', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isBlocked: !user.isBlocked },
    });

    return res.json({ message: `User ${updatedUser.name} is now ${updatedUser.isBlocked ? 'blocked' : 'unblocked'}`, user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

// DELETE User
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleted = await prisma.user.delete({ where: { id: user.id } });
    return res.json({ message: 'User account deleted', user: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// GET All Purchase Orders
router.get('/orders', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, book: true }
    });
    
    // Format to match what the admin panel expects
    const formattedOrders = orders.map(o => ({
      ...o,
      userName: o.user.name,
      userEmail: o.user.email,
      bookTitle: o.book.title,
    }));
    
    return res.json(formattedOrders);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

export default router;
