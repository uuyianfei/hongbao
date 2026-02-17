import { useState } from 'react'
import { Dialog, Input, Button, Toast } from 'antd-mobile'

interface LoginDialogProps {
  visible: boolean
  onLogin: (nickname: string, password: string) => Promise<any>
}

export default function LoginDialog({ visible, onLogin }: LoginDialogProps) {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const name = nickname.trim()
    if (!name) {
      Toast.show({ content: '请输入昵称', position: 'center' })
      return
    }
    if (!password) {
      Toast.show({ content: '请输入密码', position: 'center' })
      return
    }
    setLoading(true)
    try {
      await onLogin(name, password)
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || '登录失败'
      Toast.show({ content: msg, position: 'center' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      visible={visible}
      title="欢迎来到口令红包"
      content={
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            首次登录将自动注册，请牢记密码
          </p>
          <Input
            placeholder="请输入昵称"
            value={nickname}
            onChange={setNickname}
            style={{
              '--font-size': '16px',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
            }}
          />
          <Input
            placeholder="请输入密码"
            type="password"
            value={password}
            onChange={setPassword}
            onEnterPress={handleLogin}
            style={{
              '--font-size': '16px',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          />
        </div>
      }
      actions={[
        {
          key: 'login',
          text: loading ? '登录中...' : '进入',
          bold: true,
          disabled: loading,
          onClick: handleLogin,
          style: { color: '#e74c3c' },
        },
      ]}
    />
  )
}
