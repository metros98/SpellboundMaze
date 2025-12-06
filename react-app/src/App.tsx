import React, { useState } from 'react'
import StartMenu from './pages/StartMenu'
import ProfileEditor from './pages/ProfileEditor'
import GameView from './pages/GameView'
import { Profile } from './types'

type Page = { name: 'start' } | { name: 'edit', profile?: Profile } | { name: 'game', profile: Profile }

export default function App(){
  const [page, setPage] = useState<Page>({ name: 'start' })

  return (
    <div style={{ padding: 12 }}>
      {page.name === 'start' && <StartMenu onEdit={p=>setPage({name:'edit', profile:p})} onPlay={p=>setPage({name:'game', profile:p})} />}
      {page.name === 'edit' && <ProfileEditor profile={page.profile} onDone={()=>setPage({name:'start'})} />}
      {page.name === 'game' && <GameView profile={page.profile} onExit={()=>setPage({name:'start'})} />}
    </div>
  )
}
