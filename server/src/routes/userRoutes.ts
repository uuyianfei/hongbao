import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { walletService } from '../services/walletService';

export const userRoutes = Router();

/**
 * POST /api/users - 创建/登录用户
 * body: { nickname, password }
 * 首次：创建用户并设置密码
 * 后续：校验密码是否匹配
 */
userRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname || typeof nickname !== 'string') {
      return res.status(400).json({ error: '请输入昵称' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: '请输入密码' });
    }

    // 查找已有用户
    let user = await prisma.user.findFirst({ where: { nickname } });

    if (user) {
      // 已有用户 - 校验密码
      if (user.password !== password) {
        return res.status(401).json({ error: '密码错误' });
      }
    } else {
      // 新用户 - 创建并设置密码
      user = await prisma.user.create({
        data: {
          nickname,
          password,
          balance: 100, // 新用户赠送100元体验金
        },
      });

      // 记录赠送交易
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'recharge',
          amount: 100,
        },
      });
    }

    return res.json({
      id: user.id,
      nickname: user.nickname,
      balance: user.balance,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/users/:id/wallet - 查询钱包余额
 */
userRoutes.get('/:id/wallet', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const balance = await walletService.getBalance(id);
    return res.json({ userId: id, balance });
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

/**
 * POST /api/users/:id/recharge - 模拟充值
 */
userRoutes.post('/:id/recharge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '请输入有效金额' });
    }

    const transaction = await walletService.recharge(id, amount);
    const newBalance = await walletService.getBalance(id);

    return res.json({
      success: true,
      transaction,
      balance: newBalance,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/users/:id/transactions - 交易记录
 */
userRoutes.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        envelope: {
          select: {
            id: true,
            bookName: true,
            amount: true,
          },
        },
      },
    });

    return res.json(transactions);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
