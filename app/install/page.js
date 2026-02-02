import InstallClient from './InstallClient'
import { I18nProvider } from '@/lib/i18n-context'

export const metadata = {
  title: 'Install Monity | Monity',
  description: 'Install Monity on your iPhone for the best experience',
}

export default function InstallPage() {
  return (
    <I18nProvider>
      <InstallClient />
    </I18nProvider>
  )
}
