import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SendEnvelope from './pages/SendEnvelope'
import ClaimEnvelope from './pages/ClaimEnvelope'
import Wallet from './pages/Wallet'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/send" element={<SendEnvelope />} />
          <Route path="/wallet" element={<Wallet />} />
        </Route>
        <Route path="/claim/:id" element={<ClaimEnvelope />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
