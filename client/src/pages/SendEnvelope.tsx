import { useState } from 'react'
import { Button, Input, Toast, Dialog, Card, Stepper } from 'antd-mobile'
import { useUser } from '../hooks/useUser'
import { createEnvelope, CreateEnvelopeResult } from '../services/api'
import MorsePlayer from '../components/MorsePlayer'
import LoginDialog from '../components/LoginDialog'

export default function SendEnvelope() {
  const { user, login, refreshBalance } = useUser()
  const [amount, setAmount] = useState('')
  const [count, setCount] = useState(1)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<CreateEnvelopeResult | null>(null)

  const handleSend = async () => {
    if (!user) return
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      Toast.show({ content: '请输入有效金额', position: 'center' })
      return
    }
    if (num < count * 0.01) {
      Toast.show({ content: `${count}个红包至少需要 ¥${(count * 0.01).toFixed(2)}`, position: 'center' })
      return
    }
    if (num > user.balance) {
      Toast.show({ content: '余额不足，请先充值', position: 'center' })
      return
    }

    setSending(true)
    try {
      const res = await createEnvelope(user.id, num, count)
      setResult(res)
      await refreshBalance()
      Toast.show({ content: '红包创建成功！', position: 'center', icon: 'success' })
    } catch (e: any) {
      Toast.show({ content: e.response?.data?.error || '创建失败', position: 'center' })
    } finally {
      setSending(false)
    }
  }

  const handleShare = async () => {
    if (!result) return
    const url = `${window.location.origin}/claim/${result.id}`
    try {
      await navigator.clipboard.writeText(url)
      Toast.show({ content: '链接已复制到剪贴板', position: 'center', icon: 'success' })
    } catch {
      Dialog.alert({
        title: '红包链接',
        content: url,
      })
    }
  }

  // 创建成功后的预览
  if (result) {
    return (
      <div className="page-container" style={{ background: '#f5f5f5' }}>
        <div style={{
          background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
          padding: '36px 20px 24px',
          color: '#fff',
          textAlign: 'center',
        }}>
          <div className="fade-in-up">
            <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>红包创建成功！</h2>
            <p style={{ opacity: 0.85, fontSize: 13 }}>分享给朋友来挑战吧</p>
          </div>
        </div>

        <div className="fade-in-up" style={{ padding: 16 }}>
          {/* 金额卡片 */}
          <Card style={{ borderRadius: 16, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, fontWeight: 'bold', color: '#e74c3c' }}>
                ¥{result.amount.toFixed(2)}
              </div>
              <div style={{ color: '#999', fontSize: 13, marginTop: 6 }}>
                共 {result.totalCount} 个红包 · 来自《{result.bookName}》
              </div>
            </div>
          </Card>

          {/* 摩斯密码预览 */}
          <MorsePlayer
            timeline={result.morseTimeline}
            morseCode={result.morseCode}
          />

          {/* 答案展示（仅发送者可见） */}
          <Card style={{
            borderRadius: 16,
            marginBottom: 16,
            border: '2px dashed #ffd5d5',
            background: '#fffafa',
          }}>
            <div style={{ padding: '8px 0', textAlign: 'center' }}>
              <div style={{
                fontSize: 12,
                color: '#999',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}>
                <span>🔐</span> 口令答案（仅你可见）
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#e74c3c',
                letterSpacing: 12,
                marginBottom: 4,
              }}>
                {result.answer}
              </div>
              <div style={{
                fontSize: 13,
                color: '#888',
                fontFamily: 'monospace',
              }}>
                拼音：{result.answerPinyin.join(' · ')}
              </div>
            </div>
          </Card>

          <Button
            block
            onClick={handleShare}
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              height: 50,
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: 12,
              boxShadow: '0 6px 20px rgba(231,76,60,0.35)',
            }}
          >
            📤 分享红包链接
          </Button>

          <Button
            block
            onClick={() => { setResult(null); setAmount(''); setCount(1) }}
            style={{
              borderRadius: 24,
              height: 44,
              fontSize: 14,
              color: '#666',
            }}
          >
            继续发红包
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ background: '#f5f5f5' }}>
      <LoginDialog visible={!user} onLogin={login} />

      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)',
        padding: '44px 20px 32px',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div className="fade-in-up">
          <div style={{ fontSize: 40, marginBottom: 8 }}>✉️</div>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 }}>
            发口令红包
          </h2>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            系统自动从四大名著中生成摩斯密码口令
          </p>
        </div>
      </div>

      <div className="fade-in-up" style={{ padding: 16 }}>
        {/* 余额展示 */}
        {user && (
          <Card style={{
            borderRadius: 16,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #fff5f5, #fff)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: 14 }}>当前余额</span>
              <span style={{ fontSize: 22, fontWeight: 'bold', color: '#e74c3c' }}>
                ¥{user.balance.toFixed(2)}
              </span>
            </div>
          </Card>
        )}

        {/* 金额输入 */}
        <Card style={{
          borderRadius: 16,
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              红包总金额
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#e74c3c',
              }}>
                ¥
              </span>
              <Input
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={setAmount}
                style={{
                  '--font-size': '36px',
                  '--color': '#333',
                  flex: 1,
                }}
              />
            </div>
          </div>
        </Card>

        {/* 红包个数 */}
        <Card style={{
          borderRadius: 16,
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
          }}>
            <div>
              <div style={{ fontSize: 14, color: '#666' }}>红包个数</div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>
                金额将随机分配给每位领取者
              </div>
            </div>
            <Stepper
              min={1}
              max={100}
              value={count}
              onChange={setCount}
              style={{
                '--button-background-color': '#e74c3c',
                '--button-text-color': '#fff',
                '--input-width': '44px',
                '--input-font-size': '18px',
                '--height': '36px',
                '--border-radius': '8px',
              }}
            />
          </div>
        </Card>

        {/* 快捷金额 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          marginBottom: 20,
        }}>
          {[1, 5, 10, 20].map((v) => (
            <Button
              key={v}
              size="small"
              onClick={() => setAmount(String(v))}
              style={{
                borderRadius: 12,
                height: 40,
                borderColor: amount === String(v) ? '#e74c3c' : '#e8e8e8',
                color: amount === String(v) ? '#e74c3c' : '#666',
                background: amount === String(v) ? '#fff5f5' : '#fff',
                fontWeight: amount === String(v) ? 'bold' : 'normal',
                fontSize: 14,
              }}
            >
              ¥{v}
            </Button>
          ))}
        </div>

        {/* 红包预估 */}
        {amount && parseFloat(amount) > 0 && count > 1 && (
          <Card style={{
            borderRadius: 16,
            marginBottom: 16,
            background: '#fff5f5',
            border: '1px solid #ffd5d5',
          }}>
            <div style={{
              textAlign: 'center',
              fontSize: 13,
              color: '#c0392b',
              padding: '4px 0',
            }}>
              共 {count} 个红包，总计 ¥{parseFloat(amount).toFixed(2)}，
              平均每个约 ¥{(parseFloat(amount) / count).toFixed(2)}
            </div>
          </Card>
        )}

        {/* 玩法说明 */}
        <Card style={{
          borderRadius: 16,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #fffbe6, #fff8e1)',
          border: '1px solid #ffe58f',
        }}>
          <div style={{ fontSize: 13, color: '#8a6d3b', lineHeight: 2 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>
              🎯 玩法说明
            </div>
            <div>① 系统从四大名著中随机选取一段文字</div>
            <div>② 从中抽取几个汉字，转为摩斯密码音频</div>
            <div>③ 领红包者需听音频解码出拼音</div>
            <div>④ 在名著原文中找到对应汉字即可开启红包</div>
            <div>⑤ 多个红包时，金额随机分配，手气最佳拿最多！</div>
          </div>
        </Card>

        {/* 发送按钮 */}
        <Button
          block
          loading={sending}
          disabled={!user || sending || !amount || parseFloat(amount) <= 0}
          onClick={handleSend}
          style={{
            background: (amount && parseFloat(amount) > 0)
              ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
              : '#ddd',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            height: 52,
            fontSize: 17,
            fontWeight: 'bold',
            boxShadow: (amount && parseFloat(amount) > 0)
              ? '0 6px 20px rgba(231,76,60,0.35)'
              : 'none',
          }}
        >
          🧧 发 {count} 个红包
        </Button>
      </div>
    </div>
  )
}
