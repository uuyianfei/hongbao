import { createContext, useContext, ReactNode } from 'react'
import { useUser } from '../hooks/useUser'
import { User } from '../services/api'

interface UserContextType {
  user: User | null
  loading: boolean
  login: (nickname: string, password: string) => Promise<any>
  logout: () => void
  refreshBalance: () => Promise<void>
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: false,
  login: async () => {},
  logout: () => {},
  refreshBalance: async () => {},
  setUser: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const userState = useUser()

  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  return useContext(UserContext)
}
