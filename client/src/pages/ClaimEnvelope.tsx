import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Input, Toast, Card, Result, SpinLoading, Tag } from 'antd-mobile'
import { useUser } from '../hooks/useUser'
import { getEnvelope, claimEnvelope, EnvelopeDetail } from '../services/api'
import MorsePlayer from '../components/MorsePlayer'
import LoginDialog from '../components/LoginDialog'

export default function ClaimEnvelope() {
  const { id } = useParams<{ id: string }>()
  const { user, login, refreshBalance } = useUser()
  const [envelope, setEnvelope] = useState<EnvelopeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getEnvelope(id)
      .then(setEnvelope)
      .catch((e) => setError(e.response?.data?.error || '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  const handleClaim = async () => {
    if (!user || !id) return
    const trimmed = answer.trim()
    if (!trimmed) {
      Toast.show({ content: '请输入口令', position: 'center' })
      return
    }

    setClaiming(true)
    try {
      const res = await claimEnvelope(id, user.id, trimmed)
      setClaimResult(res)
      await refreshBalance()
    } catch (e: any) {
      Toast.show({
        content: e.response?.data?.error || '领取失败',
        position: 'center',
      })
    } finally {
      setClaiming(false)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        gap: 16,
      }}>
        <SpinLoading color="white" style={{ '--size': '48px' }} />
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>加载红包中...</span>
      </div>
    )
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  const goHome = () => {
    window.location.href = '/'
  }

  // 错误
  if (error) {
    return (
      <div style={{ padding: 20, paddingTop: 80, background: '#f5f5f5', minHeight: '100vh' }}>
        <Result status="error" title="加载失败" description={error} />
        <Button block onClick={goHome} style={{ marginTop: 20, borderRadius: 24 }}>
          返回首页
        </Button>
      </div>
    )
  }

  // 领取成功 - 金额揭晓动画
  if (claimResult) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div className="fade-in-up" style={{
          background: '#fff',
          borderRadius: 24,
          padding: '48px 32px 36px',
          textAlign: 'center',
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          <div className="pulse" style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, marginBottom: 12, color: '#333', fontWeight: 600 }}>
            恭喜！破解成功
          </h2>
          <div style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#e74c3c',
            margin: '24px 0',
            textShadow: '0 2px 8px rgba(231,76,60,0.2)',
          }}>
            ¥{claimResult.amount.toFixed(2)}
          </div>
          <div style={{
            background: '#fdf2f2',
            borderRadius: 12,
            padding: '10px 16px',
            color: '#c0392b',
            fontSize: 13,
            marginBottom: 16,
          }}>
            来自《{claimResult.bookName}》的红包
          </div>
          <div style={{
            fontSize: 12,
            color: '#999',
            marginBottom: 28,
          }}>
            已领 {claimResult.claimedCount}/{claimResult.totalCount} 个
          </div>
          <Button
            block
            onClick={goHome}
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              height: 48,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  if (!envelope) return null

  // 已用户领过 - 检查当前用户是否在 claims 列表中
  const userClaim = user ? envelope.claims.find(c => c.claimer.id === user.id) : null

  // 已全部领完或已过期 - 显示详情页
  if (envelope.status === 'claimed' || envelope.status === 'expired' || userClaim) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: 20,
        paddingTop: 16,
      }}>
        <div
          onClick={goBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 18,
            marginBottom: 16,
          }}
        >
          ←
        </div>

        <Card style={{ borderRadius: 20, textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧧</div>
          <h3 style={{ color: '#333', marginBottom: 8, fontSize: 18 }}>
            {envelope.sender.nickname} 的红包
          </h3>
          {envelope.status === 'expired' && envelope.claims.length === 0 ? (
            <div style={{ color: '#999', fontSize: 14, margin: '16px 0' }}>
              红包已过期，无人领取
            </div>
          ) : (
            <>
              {envelope.amount !== undefined && (
                <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
                  总金额 ¥{envelope.amount.toFixed(2)} · {envelope.claimedCount}/{envelope.totalCount} 个已领
                </div>
              )}
              {userClaim && (
                <div style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#e74c3c',
                  margin: '16px 0 8px',
                }}>
                  你领了 ¥{userClaim.amount.toFixed(2)}
                </div>
              )}
            </>
          )}

          {envelope.status === 'expired' && (
            <Tag color="default" style={{ marginTop: 8 }}>已过期</Tag>
          )}
          {envelope.status === 'claimed' && (
            <Tag color="success" style={{ marginTop: 8 }}>已领完</Tag>
          )}
          {envelope.status === 'pending' && userClaim && (
            <Tag color="warning" style={{ marginTop: 8 }}>还有 {envelope.totalCount - envelope.claimedCount} 个待领</Tag>
          )}
        </Card>

        {/* 领取列表 */}
        {envelope.claims.length > 0 && (
          <Card style={{ borderRadius: 16, marginTop: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '4px 0' }}>
              <div style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>👥</span> 领取详情（{envelope.claims.length}人）
              </div>
              {envelope.claims.map((claim, i) => {
                // 找出金额最高的人
                const maxAmount = Math.max(...envelope.claims.map(c => c.amount))
                const isLucky = claim.amount === maxAmount && envelope.claims.length > 1
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < envelope.claims.length - 1 ? '1px solid #f5f5f5' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: claim.claimer.id === user?.id
                          ? 'linear-gradient(135deg, #e74c3c, #f39c12)'
                          : '#f0f0f0',
                        color: claim.claimer.id === user?.id ? '#fff' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 'bold',
                      }}>
                        {claim.claimer.nickname[0]}
                      </span>
                      <div>
                        <div style={{
                          fontSize: 14,
                          color: '#333',
                          fontWeight: claim.claimer.id === user?.id ? 'bold' : 'normal',
                        }}>
                          {claim.claimer.nickname}
                          {claim.claimer.id === user?.id && (
                            <span style={{ fontSize: 11, color: '#e74c3c', marginLeft: 4 }}>（我）</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>
                          {new Date(claim.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: '#e74c3c',
                      }}>
                        ¥{claim.amount.toFixed(2)}
                      </div>
                      {isLucky && (
                        <div style={{
                          fontSize: 10,
                          color: '#f39c12',
                          fontWeight: 'bold',
                        }}>
                          🏆 手气最佳
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <Button
          block
          onClick={goHome}
          style={{ marginTop: 20, borderRadius: 24, height: 44 }}
        >
          返回首页
        </Button>
      </div>
    )
  }

  // 待领取 - 主破解界面
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #c0392b 0%, #e74c3c 25%, #f5f5f5 45%)',
    }}>
      <LoginDialog visible={!user} onLogin={login} />

      {/* 顶部返回栏 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div
          onClick={goBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 18,
            backdropFilter: 'blur(4px)',
          }}
        >
          ←
        </div>
      </div>

      {/* 红包头部 */}
      <div className="fade-in-up" style={{
        padding: '52px 20px 24px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div className="pulse" style={{ fontSize: 52, marginBottom: 10 }}>🧧</div>
        <h2 style={{ fontSize: 21, fontWeight: 'bold', marginBottom: 6 }}>
          {envelope.sender.nickname} 的口令红包
        </h2>
        <p style={{ opacity: 0.8, fontSize: 13 }}>
          破解摩斯密码 · 对照名著原文 · 领取红包
        </p>
        {envelope.totalCount > 1 && (
          <div style={{
            marginTop: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 12,
            fontSize: 12,
          }}>
            已领 {envelope.claimedCount}/{envelope.totalCount} 个
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px 40px' }}>
        {/* 步骤提示 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          marginBottom: 16,
        }}>
          {['听音频', '解密码', '找汉字', '领红包'].map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#e74c3c',
                color: '#fff',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 12, color: '#666' }}>{step}</span>
              {i < 3 && <span style={{ color: '#ddd', margin: '0 2px' }}>→</span>}
            </div>
          ))}
        </div>

        {/* 摩斯密码播放器 */}
        <MorsePlayer
          timeline={envelope.morseTimeline}
          morseCode={envelope.morseCode}
        />

        {/* 名著片段 */}
        <Card style={{
          borderRadius: 16,
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ padding: '4px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <span style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>📖</span> 名著原文
              </span>
              <Tag color="warning" style={{ borderRadius: 8 }}>
                《{envelope.bookName}》
              </Tag>
            </div>
            <div style={{
              fontSize: 17,
              lineHeight: 2.2,
              color: '#333',
              background: 'linear-gradient(135deg, #fffbf0 0%, #fff8f0 100%)',
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid #f0e6d6',
              fontFamily: '"STKaiti", "KaiTi", "楷体", "STSong", serif',
              textIndent: '2em',
            }}>
              {envelope.bookExcerpt}
            </div>
            <div style={{
              marginTop: 10,
              fontSize: 12,
              color: '#999',
              lineHeight: 1.8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
              <span>
                解码摩斯密码得到拼音字母 → 拼出完整拼音 → 在上方原文中找到对应汉字
              </span>
            </div>
          </div>
        </Card>

        {/* 摩斯密码对照表（可折叠） */}
        <MorseCheatSheet />

        {/* 已领取列表 */}
        {envelope.claims.length > 0 && (
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
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>👥</span> 已领取（{envelope.claimedCount}/{envelope.totalCount}）
              </div>
              {envelope.claims.map((claim, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < envelope.claims.length - 1 ? '1px dashed #f0f0f0' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#e74c3c',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}>
                      {claim.claimer.nickname[0]}
                    </span>
                    <span style={{ fontSize: 13, color: '#333' }}>{claim.claimer.nickname}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 'bold', color: '#e74c3c' }}>
                    ¥{claim.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 口令输入 */}
        <Card style={{
          borderRadius: 16,
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '2px solid #e74c3c',
        }}>
          <div style={{ padding: '4px 0' }}>
            <div style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#e74c3c',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span>🔑</span> 输入口令
            </div>
            <Input
              placeholder="输入破解出的汉字口令"
              value={answer}
              onChange={setAnswer}
              onEnterPress={handleClaim}
              clearable
              style={{
                '--font-size': '22px',
                '--text-align': 'center',
                border: '2px dashed #ffd5d5',
                borderRadius: 12,
                padding: '14px',
                letterSpacing: 10,
                background: '#fffafa',
              }}
            />
          </div>
        </Card>

        {/* 领取按钮 */}
        <Button
          block
          loading={claiming}
          disabled={!user || claiming || !answer.trim()}
          onClick={handleClaim}
          style={{
            background: answer.trim()
              ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
              : '#ddd',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            height: 52,
            fontSize: 17,
            fontWeight: 'bold',
            boxShadow: answer.trim() ? '0 6px 20px rgba(231,76,60,0.35)' : 'none',
          }}
        >
          🧧 开红包
        </Button>

        {/* 返回按钮 */}
        <Button
          block
          fill="none"
          onClick={goHome}
          style={{
            marginTop: 10,
            color: '#999',
            fontSize: 14,
          }}
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}

/** 摩斯密码对照表组件 */
function MorseCheatSheet() {
  const [expanded, setExpanded] = useState(false)

  const morseTable = [
    ['A', '.-'],    ['B', '-...'], ['C', '-.-.'], ['D', '-..'],
    ['E', '.'],     ['F', '..-.'], ['G', '--.'],  ['H', '....'],
    ['I', '..'],    ['J', '.---'], ['K', '-.-'],  ['L', '.-..'],
    ['M', '--'],    ['N', '-.'],   ['O', '---'],  ['P', '.--.'],
    ['Q', '--.-'],  ['R', '.-.'],  ['S', '...'],  ['T', '-'],
    ['U', '..-'],   ['V', '...-'], ['W', '.--'],  ['X', '-..-'],
    ['Y', '-.--'],  ['Z', '--..'],
  ]

  return (
    <Card style={{
      borderRadius: 16,
      marginBottom: 16,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      <div style={{ padding: '4px 0' }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📋</span> 摩斯密码对照表
          </span>
          <span style={{
            fontSize: 12,
            color: '#999',
            transition: 'transform 0.3s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}>
            ▼
          </span>
        </div>

        {expanded && (
          <div style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}>
            {morseTable.map(([letter, code]) => (
              <div key={letter} style={{
                background: '#f8f8f8',
                borderRadius: 8,
                padding: '6px 4px',
                textAlign: 'center',
                fontSize: 12,
              }}>
                <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{letter}</span>
                <span style={{ color: '#666', marginLeft: 4, fontFamily: 'monospace' }}>{code}</span>
              </div>
            ))}
          </div>
        )}

        {!expanded && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#bbb' }}>
            点击展开查看完整对照表
          </div>
        )}
      </div>
    </Card>
  )
}
