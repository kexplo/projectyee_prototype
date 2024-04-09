// import electronLogo from '@/assets/electron.svg'
import { Outlet } from 'react-router-dom'

import Sidebar from '@/components/Sidebar'

export const AppIndex = (): JSX.Element => {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <div className="text-center">
        <p className="text-lg">아직 작업이 없으시네요.</p>
        <p className="text-lg">사이드바에서 새 작업을 만들어보세요!</p>
      </div>
    </div>
  )
}

const App = (): JSX.Element => {
  return (
    <>
      <div className="min-h-screen flex flex-row">
        <Sidebar></Sidebar>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </>
  )
}
export default App
