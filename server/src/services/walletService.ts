import prisma from '../prisma';
import { Transaction } from '@prisma/client';

/**
 * 钱包服务接口 - 预留区块链对接
 */
export interface IWalletService {
  getBalance(userId: string): Promise<number>;
  transfer(fromUserId: string, toUserId: string, amount: number, envelopeId?: string): Promise<Transaction>;
  recharge(userId: string, amount: number): Promise<Transaction>;
  deduct(userId: string, amount: number, envelopeId?: string): Promise<Transaction>;
}

/**
 * 本地钱包服务实现（数据库模拟）
 * 后续可替换为 BlockchainWalletService
 */
export class LocalWalletService implements IWalletService {
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    return user.balance;
  }

  async recharge(userId: string, amount: number): Promise<Transaction> {
    if (amount <= 0) throw new Error('充值金额必须大于0');

    const [, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'recharge',
          amount,
        },
      }),
    ]);

    return transaction;
  }

  async deduct(userId: string, amount: number, envelopeId?: string): Promise<Transaction> {
    if (amount <= 0) throw new Error('扣款金额必须大于0');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    if (user.balance < amount) throw new Error('余额不足');

    const [, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'send',
          amount: -amount,
          envelopeId,
        },
      }),
    ]);

    return transaction;
  }

  async transfer(fromUserId: string, toUserId: string, amount: number, envelopeId?: string): Promise<Transaction> {
    if (amount <= 0) throw new Error('转账金额必须大于0');

    const sender = await prisma.user.findUnique({ where: { id: fromUserId } });
    if (!sender) throw new Error('发送者不存在');
    // 这里不再检查余额，因为发红包时已经扣款了

    const [, , transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: toUserId },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: fromUserId,
          type: 'send',
          amount: -amount,
          envelopeId,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: toUserId,
          type: 'receive',
          amount,
          envelopeId,
        },
      }),
    ]);

    return transaction;
  }
}

// 单例导出
export const walletService: IWalletService = new LocalWalletService();
