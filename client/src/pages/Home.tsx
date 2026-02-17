import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Tag, PullToRefresh, Empty, Toast, DotLoading } from 'antd-mobile'
import { useUser } from '../hooks/useUser'
import { getEnvelopeList } from '../services/api'
import LoginDialog from '../components/LoginDialog'

interface ClaimItem {
  claimer: { id: string; nickname: string }
  amount: number
  createdAt: string
}

interface EnvelopeItem {
  id: string
  sender: { id: string; nickname: string }
  bookName: string
  status: string
  amount: number | string
  totalCount: number
  claimedCount: number
  claims: ClaimItem[]
  createdAt: string
  expiresAt: string
}

export default function Home() {
  const { user, login, refreshBalance } = useUser()
  const navigate = useNavigate()
  const [envelopes, setEnvelopes] = useState<EnvelopeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    try {
      const list = await getEnvelopeList()
      setEnvelopes(list)
    } catch (e: any) {
      Toast.show({ content: '加载失败', position: 'center' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
    if (user) refreshBalance()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (nickname: string, password: string) => {
    await login(nickname, password)
  }

  const statusConfig: Record<string, { text: string; tagColor: 'danger' | 'success' | 'default' }> = {
    pending: { text: '待领取', tagColor: 'danger' },
    claimed: { text: '已领完', tagColor: 'success' },
    expired: { text: '已过期', tagColor: 'default' },
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  return (
    <div className="page-container" style={{ background: '#f5f5f5' }}>
      <LoginDialog visible={!user} onLogin={handleLogin} />

      {/* 头部区域 */}
      <div style={{
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)',
        padding: '44px 20px 32px',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰背景圆 */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -20,
          left: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <div className="fade-in-up">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🧧</div>
          <h1 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 6, letterSpacing: 2 }}>
            口令红包
          </h1>
          <p style={{ fontSize: 13, opacity: 0.8, letterSpacing: 1 }}>
            摩斯密码 × 文学名著 · 破解密码领红包
          </p>
        </div>

        {user && (
          <div style={{
            marginTop: 20,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            borderRadius: 14,
            padding: '12px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}>
              {user.nickname[0]}
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user.nickname}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>余额 ¥{user.balance.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 红包列表 */}
      <div style={{ padding: '0 0 20px' }}>
        <div style={{
          padding: '16px 16px 8px',
          fontSize: 17,
          fontWeight: 'bold',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          红包广场
        </div>

        <PullToRefresh onRefresh={fetchList}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <DotLoading color="#e74c3c" />
            </div>
          ) : envelopes.length === 0 ? (
            <Empty
              description="暂无红包，去发一个吧！"
              style={{ padding: '60px 0' }}
            />
          ) : (
            <List style={{ '--border-top': 'none', '--border-bottom': 'none' }}>
              {envelopes.map((item, index) => {
                const s = statusConfig[item.status] || statusConfig.pending
                const isExpanded = expandedId === item.id
                return (
                  <div key={item.id}>
                    <List.Item
                      className="fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => {
                        if (item.status === 'pending') {
                          navigate(`/claim/${item.id}`)
                        } else if (item.claims.length > 0) {
                          setExpandedId(isExpanded ? null : item.id)
                        }
                      }}
                      clickable={item.status === 'pending' || item.claims.length > 0}
                      prefix={
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: item.status === 'pending'
                            ? 'linear-gradient(135deg, #e74c3c, #f39c12)'
                            : item.status === 'claimed'
                              ? 'linear-gradient(135deg, #27ae60, #2ecc71)'
                              : '#eee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          boxShadow: item.status === 'pending' ? '0 4px 12px rgba(231,76,60,0.3)' : 'none',
                        }}>
                          🧧
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <Tag color={s.tagColor} style={{ fontSize: 11 }}>
                            {s.text}
                          </Tag>
                          <span style={{ fontSize: 12, color: '#bbb' }}>
                            《{item.bookName}》
                          </span>
                          <span style={{ fontSize: 11, color: '#ccc' }}>
                            {item.claimedCount}/{item.totalCount}个 · {getTimeAgo(item.createdAt)}
                          </span>
                        </div>
                      }
                      extra={
                        <span style={{
                          color: item.status === 'claimed' ? '#e74c3c' : '#ccc',
                          fontWeight: 'bold',
                          fontSize: 17,
                        }}>
                          {item.status === 'claimed' ? `¥${Number(item.amount).toFixed(2)}` : '¥???'}
                        </span>
                      }
                    >
                      <span style={{ fontWeight: 500, fontSize: 15 }}>
                        {item.sender.nickname} 的红包
                      </span>
                    </List.Item>

                    {/* 领取详情展开 */}
                    {isExpanded && item.claims.length > 0 && (
                      <div style={{
                        background: '#fafafa',
                        padding: '8px 16px 8px 76px',
                        borderBottom: '1px solid #f0f0f0',
                      }}>
                        <div style={{
                          fontSize: 12,
                          color: '#999',
                          marginBottom: 6,
                          fontWeight: 'bold',
                        }}>
                          领取详情
                        </div>
                        {item.claims.map((claim, ci) => (
                          <div key={ci} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0',
                            borderBottom: ci < item.claims.length - 1 ? '1px dashed #eee' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#e74c3c',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 'bold',
                              }}>
                                {claim.claimer.nickname[0]}
                              </span>
                              <span style={{ fontSize: 13, color: '#333' }}>
                                {claim.claimer.nickname}
                              </span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 'bold', color: '#e74c3c' }}>
                              ¥{claim.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </List>
          )}
        </PullToRefresh>
      </div>
    </div>
  )
}
