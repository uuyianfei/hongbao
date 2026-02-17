import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { walletService } from '../services/walletService';
import { getRandomExcerpt } from '../services/bookService';
import {
  pickRandomChars,
  chineseToMorse,
  generateMorseTimeline,
  chineseToPlainPinyin,
} from '../services/morseService';

export const envelopeRoutes = Router();

/**
 * 随机分配红包金额（二倍均值法）
 * 保证每个人至少 0.01 元，总和等于 totalAmount
 */
function randomSplitAmount(totalAmount: number, count: number): number[] {
  if (count === 1) return [totalAmount];

  const amounts: number[] = [];
  let remaining = totalAmount;

  for (let i = 0; i < count - 1; i++) {
    const remainCount = count - i;
    // 二倍均值法: 0.01 ~ 2 * remaining / remainCount
    const maxAmount = Math.max(0.01, (2 * remaining) / remainCount);
    let amt = Math.random() * maxAmount;
    amt = Math.max(0.01, amt); // 至少0.01
    amt = Math.min(amt, remaining - 0.01 * (remainCount - 1)); // 保证后面的人至少有0.01
    amt = Math.round(amt * 100) / 100; // 保留两位小数
    amounts.push(amt);
    remaining -= amt;
    remaining = Math.round(remaining * 100) / 100;
  }

  // 最后一个人拿剩余
  amounts.push(Math.round(remaining * 100) / 100);

  return amounts;
}

/**
 * POST /api/envelopes - 创建红包
 * body: { senderId, amount, count }
 */
envelopeRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { senderId, amount, count = 1 } = req.body;

    if (!senderId) {
      return res.status(400).json({ error: '缺少发送者ID' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '请输入有效金额' });
    }
    const totalCount = Math.max(1, Math.min(100, Math.floor(count)));
    if (amount < totalCount * 0.01) {
      return res.status(400).json({ error: `${totalCount}个红包至少需要 ¥${(totalCount * 0.01).toFixed(2)}` });
    }

    // 检查余额
    const balance = await walletService.getBalance(senderId);
    if (balance < amount) {
      return res.status(400).json({ error: '余额不足' });
    }

    // 随机获取名著片段
    const { bookName, excerpt } = getRandomExcerpt();

    // 从片段中抽取随机汉字作为口令
    const { chars: answer } = pickRandomChars(excerpt, 4);

    // 生成摩斯密码
    const morseCode = chineseToMorse(answer);
    const morseTimeline = generateMorseTimeline(morseCode);
    const pinyinArr = chineseToPlainPinyin(answer);

    // 设置24小时过期
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 扣款
    await walletService.deduct(senderId, amount);

    // 创建红包
    const envelope = await prisma.redEnvelope.create({
      data: {
        senderId,
        amount,
        totalCount,
        claimedCount: 0,
        bookName,
        bookExcerpt: excerpt,
        answer,
        morseCode,
        status: 'pending',
        expiresAt,
      },
    });

    // 记录发送交易
    await prisma.transaction.create({
      data: {
        userId: senderId,
        type: 'send',
        amount: -amount,
        envelopeId: envelope.id,
      },
    });

    return res.json({
      id: envelope.id,
      amount,
      totalCount,
      bookName,
      bookExcerpt: excerpt,
      answer,
      answerPinyin: pinyinArr,
      morseCode,
      morseTimeline,
      expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/envelopes/:id - 获取红包信息（含领取列表）
 * 注意：不返回答案！
 */
envelopeRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const envelope = await prisma.redEnvelope.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, nickname: true } },
        claims: {
          include: {
            claimer: { select: { id: true, nickname: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!envelope) {
      return res.status(404).json({ error: '红包不存在' });
    }

    // 检查是否过期（仍有未领取的红包时）
    if (envelope.status === 'pending' && new Date() > envelope.expiresAt) {
      // 计算未领取的金额
      const claimedTotal = envelope.claims.reduce((sum, c) => sum + c.amount, 0);
      const refundAmount = Math.round((envelope.amount - claimedTotal) * 100) / 100;

      await prisma.redEnvelope.update({
        where: { id },
        data: { status: 'expired' },
      });

      // 退回未领取的金额
      if (refundAmount > 0) {
        await walletService.recharge(envelope.senderId, refundAmount);
        await prisma.transaction.create({
          data: {
            userId: envelope.senderId,
            type: 'recharge',
            amount: refundAmount,
            envelopeId: id,
          },
        });
      }

      envelope.status = 'expired';
    }

    // 生成摩斯时序数据
    const morseTimeline = generateMorseTimeline(envelope.morseCode);

    return res.json({
      id: envelope.id,
      sender: envelope.sender,
      amount: envelope.status === 'claimed' || envelope.status === 'expired' ? envelope.amount : undefined,
      totalCount: envelope.totalCount,
      claimedCount: envelope.claimedCount,
      bookName: envelope.bookName,
      bookExcerpt: envelope.bookExcerpt,
      morseCode: envelope.morseCode,
      morseTimeline,
      status: envelope.status,
      createdAt: envelope.createdAt,
      expiresAt: envelope.expiresAt,
      claims: envelope.claims.map((c) => ({
        id: c.id,
        claimer: c.claimer,
        amount: c.amount,
        createdAt: c.createdAt,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/envelopes/:id/claim - 领取红包
 * body: { userId, answer }
 */
envelopeRoutes.post('/:id/claim', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, answer } = req.body;

    if (!userId || !answer) {
      return res.status(400).json({ error: '缺少用户ID或口令' });
    }

    const envelope = await prisma.redEnvelope.findUnique({
      where: { id },
      include: { claims: true },
    });

    if (!envelope) {
      return res.status(404).json({ error: '红包不存在' });
    }

    if (envelope.status === 'claimed') {
      return res.status(400).json({ error: '红包已被全部领取' });
    }

    if (envelope.status === 'expired' || new Date() > envelope.expiresAt) {
      return res.status(400).json({ error: '红包已过期' });
    }

    if (envelope.senderId === userId) {
      return res.status(400).json({ error: '不能领取自己发的红包' });
    }

    // 检查是否已经领过
    const alreadyClaimed = envelope.claims.some((c) => c.claimerId === userId);
    if (alreadyClaimed) {
      return res.status(400).json({ error: '你已经领过这个红包了' });
    }

    // 校验答案
    if (answer.trim() !== envelope.answer) {
      return res.status(400).json({ error: '口令不正确，请再试试' });
    }

    // 计算本次领取金额（随机分配）
    const claimedTotal = envelope.claims.reduce((sum, c) => sum + c.amount, 0);
    const remaining = Math.round((envelope.amount - claimedTotal) * 100) / 100;
    const remainingCount = envelope.totalCount - envelope.claimedCount;

    let claimAmount: number;
    if (remainingCount <= 1) {
      // 最后一个，拿剩余全部
      claimAmount = remaining;
    } else {
      // 二倍均值法
      const maxAmount = Math.max(0.01, (2 * remaining) / remainingCount);
      claimAmount = Math.random() * maxAmount;
      claimAmount = Math.max(0.01, claimAmount);
      claimAmount = Math.min(claimAmount, remaining - 0.01 * (remainingCount - 1));
      claimAmount = Math.round(claimAmount * 100) / 100;
    }

    const newClaimedCount = envelope.claimedCount + 1;
    const allClaimed = newClaimedCount >= envelope.totalCount;

    // 创建领取记录
    await prisma.claim.create({
      data: {
        envelopeId: id,
        claimerId: userId,
        amount: claimAmount,
      },
    });

    // 更新红包状态
    await prisma.redEnvelope.update({
      where: { id },
      data: {
        claimedCount: newClaimedCount,
        status: allClaimed ? 'claimed' : 'pending',
      },
    });

    // 转账给领取者
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: claimAmount } },
    });

    // 记录领取交易
    await prisma.transaction.create({
      data: {
        userId,
        type: 'receive',
        amount: claimAmount,
        envelopeId: id,
      },
    });

    const newBalance = await walletService.getBalance(userId);

    return res.json({
      success: true,
      amount: claimAmount,
      bookName: envelope.bookName,
      balance: newBalance,
      totalCount: envelope.totalCount,
      claimedCount: newClaimedCount,
      message: `恭喜！成功领取 ¥${claimAmount.toFixed(2)} 红包`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/envelopes - 获取红包列表（红包广场）
 */
envelopeRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const envelopes = await prisma.redEnvelope.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sender: { select: { id: true, nickname: true } },
        claims: {
          include: {
            claimer: { select: { id: true, nickname: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return res.json(
      envelopes.map((e) => ({
        id: e.id,
        sender: e.sender,
        bookName: e.bookName,
        status: e.status,
        amount: e.status === 'claimed' ? e.amount : '???',
        totalCount: e.totalCount,
        claimedCount: e.claimedCount,
        claims: e.claims.map((c) => ({
          claimer: c.claimer,
          amount: c.amount,
          createdAt: c.createdAt,
        })),
        createdAt: e.createdAt,
        expiresAt: e.expiresAt,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
