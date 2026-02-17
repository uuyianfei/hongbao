import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { 
  AppOutline, 
  SendOutline, 
  PayCircleOutline 
} from 'antd-mobile-icons'

const tabs = [
  { key: '/', title: '红包广场', icon: <AppOutline /> },
  { key: '/send', title: '发红包', icon: <SendOutline /> },
  { key: '/wallet', title: '钱包', icon: <PayCircleOutline /> },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      <TabBar
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
        style={{
          borderTop: '1px solid #eee',
          backgroundColor: '#fff',
        }}
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  )
}
