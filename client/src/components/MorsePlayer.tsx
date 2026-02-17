import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, ProgressBar, Dialog, Toast } from 'antd-mobile'
import { EyeOutline, EyeInvisibleOutline } from 'antd-mobile-icons'
import { MorseTimeline } from '../services/api'
import { MorseAudioPlayer } from '../utils/morseAudio'

const UNLOCK_PHRASE = '祝福逸小非2026马年大吉，马到功成'

interface MorsePlayerProps {
  timeline: MorseTimeline
  morseCode: string
}

export default function MorsePlayer({ timeline, morseCode }: MorsePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [unlockInput, setUnlockInput] = useState('')
  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      playerRef.current?.dispose()
    }
  }, [])

  // 打开弹窗时自动聚焦输入框
  useEffect(() => {
    if (showUnlockDialog) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [showUnlockDialog])

  const handlePlay = async () => {
    if (playing) {
      playerRef.current?.stop()
      setPlaying(false)
      setProgress(0)
      return
    }

    const player = new MorseAudioPlayer()
    playerRef.current = player
    setPlaying(true)
    setProgress(0)

    try {
      await player.play(timeline, (p) => setProgress(p * 100))
    } finally {
      setPlaying(false)
      setProgress(0)
    }
  }

  const handleToggleReveal = () => {
    if (revealed) {
      setRevealed(false)
    } else {
      setShowUnlockDialog(true)
      setUnlockInput('')
    }
  }

  const handleUnlockConfirm = () => {
    if (unlockInput === UNLOCK_PHRASE) {
      setRevealed(true)
      setShowUnlockDialog(false)
      setUnlockInput('')
      Toast.show({ content: '验证成功！密码已显示', icon: 'success', position: 'center' })
    } else {
      Toast.show({ content: '输入不正确，请重新输入', position: 'center' })
    }
  }

  // 禁止粘贴
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    Toast.show({ content: '禁止粘贴，请手动输入', position: 'center' })
  }, [])

  // 禁止拖拽输入
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const morseParts = morseCode.split(' / ')

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    }}>
      {/* 标题 + 显示/隐藏按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        position: 'relative',
      }}>
        <span style={{ fontSize: 16 }}>📡</span>
        <span style={{
          color: '#e0e0e0',
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: 2,
        }}>
          摩斯密码信号
        </span>
        {/* 眼睛图标 */}
        <div
          onClick={handleToggleReveal}
          style={{
            position: 'absolute',
            right: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: revealed ? '#00d4ff' : 'rgba(255,255,255,0.3)',
            fontSize: 18,
          }}
        >
          {revealed ? <EyeOutline /> : <EyeInvisibleOutline />}
        </div>
      </div>

      {/* 摩斯密码分组可视化 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 16,
        position: 'relative',
      }}>
        {morseParts.map((part, i) => (
          <div key={i} style={{
            background: 'rgba(0, 212, 255, 0.08)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              color: 'rgba(0, 212, 255, 0.5)',
              fontSize: 11,
              fontWeight: 600,
              minWidth: 16,
            }}>
              {i + 1}
            </span>
            <span style={{
              fontFamily: '"Courier New", monospace',
              fontSize: revealed ? 16 : 20,
              color: '#00d4ff',
              letterSpacing: revealed ? 3 : 6,
              fontWeight: 700,
              filter: revealed ? 'none' : 'blur(5px)',
              userSelect: revealed ? 'auto' : 'none',
              transition: 'filter 0.3s ease, font-size 0.3s ease, letter-spacing 0.3s ease',
              textShadow: revealed ? 'none' : '0 0 12px #00d4ff, 0 0 24px rgba(0,212,255,0.5)',
            }}>
              {part.trim()}
            </span>
          </div>
        ))}

        {/* 模糊状态下的覆盖提示 */}
        {!revealed && (
          <div
            onClick={handleToggleReveal}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 10,
              paddingBottom: 8,
            }}
          >
            <div style={{
              background: 'rgba(0, 20, 40, 0.6)',
              borderRadius: 16,
              padding: '5px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
            }}>
              <EyeInvisibleOutline style={{ fontSize: 13 }} />
              <span>请用耳朵破译 · 点击验证后查看</span>
            </div>
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div style={{ marginBottom: 16 }}>
        <ProgressBar
          percent={progress}
          style={{
            '--fill-color': playing ? '#00d4ff' : 'rgba(0,212,255,0.3)',
            '--track-color': 'rgba(255,255,255,0.08)',
            '--track-width': '6px',
          }}
        />
        {playing && (
          <div style={{
            textAlign: 'center',
            marginTop: 6,
            fontSize: 11,
            color: '#00d4ff',
            opacity: 0.8,
          }}>
            正在播放... {Math.round(progress)}%
          </div>
        )}
      </div>

      {/* 播放按钮 */}
      <div style={{ textAlign: 'center' }}>
        <Button
          onClick={handlePlay}
          style={{
            background: playing
              ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
              : 'linear-gradient(135deg, #00d4ff, #0099cc)',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            padding: '10px 40px',
            fontSize: 15,
            fontWeight: 'bold',
            boxShadow: playing
              ? '0 4px 16px rgba(231,76,60,0.4)'
              : '0 4px 16px rgba(0,212,255,0.4)',
          }}
        >
          {playing ? '⏹ 停止' : '▶ 播放摩斯密码'}
        </Button>
      </div>

      {/* 提示 */}
      <div style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 1.6,
      }}>
        短音(·) = 滴 &nbsp; 长音(-) = 嗒 &nbsp; 每组对应一个拼音字母
        <br />
        组间用 / 分隔，代表不同汉字的拼音
      </div>

      {/* 解锁弹窗 */}
      <Dialog
        visible={showUnlockDialog}
        title="验证解锁"
        content={
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
              请手动输入以下祝福语以查看摩斯密码：
            </p>
            <div style={{
              background: '#fff5f5',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              textAlign: 'center',
              fontSize: 15,
              color: '#e74c3c',
              fontWeight: 'bold',
              letterSpacing: 1,
              border: '1px dashed #ffc9c9',
            }}>
              {UNLOCK_PHRASE}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
              onPaste={handlePaste as any}
              onDrop={handleDrop as any}
              placeholder="请手动输入上方祝福语..."
              autoComplete="off"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: unlockInput === UNLOCK_PHRASE ? '2px solid #27ae60' : '2px solid #e8e8e8',
                borderRadius: 10,
                fontSize: 15,
                outline: 'none',
                textAlign: 'center',
                transition: 'border-color 0.3s',
                letterSpacing: 1,
              }}
            />
            {unlockInput.length > 0 && (
              <div style={{
                marginTop: 8,
                fontSize: 12,
                textAlign: 'center',
                color: unlockInput === UNLOCK_PHRASE ? '#27ae60' : '#999',
              }}>
                {unlockInput === UNLOCK_PHRASE
                  ? '✅ 输入正确！'
                  : `已输入 ${unlockInput.length}/${UNLOCK_PHRASE.length} 字`
                }
              </div>
            )}
          </div>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => { setShowUnlockDialog(false); setUnlockInput('') },
          },
          {
            key: 'confirm',
            text: '确认解锁',
            bold: true,
            disabled: unlockInput !== UNLOCK_PHRASE,
            onClick: handleUnlockConfirm,
            style: { color: unlockInput === UNLOCK_PHRASE ? '#e74c3c' : '#ccc' },
          },
        ]}
      />
    </div>
  )
}
