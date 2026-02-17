import { useState, useEffect } from 'react'
import { Button, Input, Toast, Card, List, Dialog, Tag } from 'antd-mobile'
import { useUser } from '../hooks/useUser'
import { recharge, getTransactions } from '../services/api'
import LoginDialog from '../components/LoginDialog'

interface TransactionItem {
  id: string
  type: string
  amount: number
  createdAt: string
  envelope?: {
    id: string
    bookName: string
    amount: number
  }
}

export default function Wallet() {
  const { user, login, refreshBalance, logout } = useUser()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async () => {
    if (!user) return
    try {
      const list = await getTransactions(user.id)
      setTransactions(list)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecharge = async () => {
    if (!user) return
    const num = parseFloat(rechargeAmount)
    if (isNaN(num) || num <= 0) {
      Toast.show({ content: '请输入有效金额', position: 'center' })
      return
    }

    setLoading(true)
    try {
      await recharge(user.id, num)
      await refreshBalance()
      await fetchTransactions()
      setRechargeAmount('')
      Toast.show({ content: '充值成功', position: 'center', icon: 'success' })
    } catch (e: any) {
      Toast.show({ content: e.response?.data?.error || '充值失败', position: 'center' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Dialog.confirm({
      content: '确定要退出登录吗？',
      onConfirm: () => {
        logout()
        Toast.show({ content: '已退出', position: 'center' })
      },
    })
  }

  const typeConfig: Record<string, { text: string; icon: string; color: string }> = {
    recharge: { text: '充值', icon: '💰', color: '#27ae60' },
    receive: { text: '收红包', icon: '🧧', color: '#e74c3c' },
    send: { text: '发红包', icon: '📤', color: '#666' },
  }

  return (
    <div className="page-container" style={{ background: '#f5f5f5' }}>
      <LoginDialog visible={!user} onLogin={login} />

      {/* 头部余额卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)',
        padding: '44px 20px 36px',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰 */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div className="fade-in-up">
          <div style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 22,
          }}>
            {user?.nickname?.[0] || '?'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 12 }}>
            {user?.nickname || '--'} 的钱包
          </div>
          <div style={{ fontSize: 42, fontWeight: 'bold', letterSpacing: 1 }}>
            ¥{user?.balance.toFixed(2) || '0.00'}
          </div>
          <div style={{
            fontSize: 11,
            opacity: 0.5,
            marginTop: 8,
            background: 'rgba(255,255,255,0.1)',
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 10,
          }}>
            模拟余额 · 后续对接区块链
          </div>
        </div>
      </div>

      <div className="fade-in-up" style={{ padding: 16 }}>
        {/* 充值区域 */}
        <Card style={{
          borderRadius: 16,
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ padding: '4px 0' }}>
            <div style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span>💳</span> 模拟充值
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <Input
                placeholder="输入充值金额"
                type="number"
                value={rechargeAmount}
                onChange={setRechargeAmount}
                style={{
                  '--font-size': '16px',
                  flex: 1,
                  border: '1px solid #e8e8e8',
                  borderRadius: 12,
                  padding: '8px 14px',
                }}
              />
              <Button
                loading={loading}
                onClick={handleRecharge}
                style={{
                  background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '0 24px',
                  fontWeight: 'bold',
                }}
              >
                充值
              </Button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
            }}>
              {[10, 50, 100, 500].map((v) => (
                <Button
                  key={v}
                  size="small"
                  onClick={() => setRechargeAmount(String(v))}
                  style={{
                    borderRadius: 10,
                    height: 36,
                    borderColor: rechargeAmount === String(v) ? '#e74c3c' : '#e8e8e8',
                    color: rechargeAmount === String(v) ? '#e74c3c' : '#666',
                    background: rechargeAmount === String(v) ? '#fff5f5' : '#fafafa',
                    fontSize: 13,
                  }}
                >
                  ¥{v}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* 交易记录 */}
        <div style={{
          fontSize: 15,
          fontWeight: 'bold',
          color: '#333',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>📊</span> 交易记录
        </div>

        {transactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#ccc',
            fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            暂无交易记录
          </div>
        ) : (
          <List style={{
            '--border-top': 'none',
            '--border-bottom': 'none',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            {transactions.map((t) => {
              const info = typeConfig[t.type] || typeConfig.recharge
              const isPositive = t.amount > 0
              return (
                <List.Item
                  key={t.id}
                  prefix={
                    <span style={{ fontSize: 24, width: 36, textAlign: 'center' }}>
                      {info.icon}
                    </span>
                  }
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: '#bbb' }}>
                        {new Date(t.createdAt).toLocaleString('zh-CN')}
                      </span>
                      {t.envelope && (
                        <Tag color="default" style={{ fontSize: 10, borderRadius: 6 }}>
                          《{t.envelope.bookName}》
                        </Tag>
                      )}
                    </div>
                  }
                  extra={
                    <span style={{
                      color: isPositive ? '#27ae60' : '#999',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}>
                      {isPositive ? '+' : ''}{t.amount.toFixed(2)}
                    </span>
                  }
                >
                  <span style={{ fontWeight: 500 }}>{info.text}</span>
                </List.Item>
              )
            })}
          </List>
        )}

        {/* 退出登录 */}
        <Button
          block
          fill="none"
          onClick={handleLogout}
          style={{
            marginTop: 24,
            color: '#ccc',
            fontSize: 14,
          }}
        >
          退出登录
        </Button>
      </div>
    </div>
  )
}
