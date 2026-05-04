import { DepositProvider } from './DepositProvider'

export default function DeposerLayout({ children }: { children: React.ReactNode }) {
  return <DepositProvider>{children}</DepositProvider>
}
