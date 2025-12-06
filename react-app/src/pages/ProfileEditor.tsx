import React, { useEffect, useState } from 'react'
import { Profile } from '../types'
import { addProfile, updateProfile } from '../lib/persistence'

export default function ProfileEditor({ profile, onDone }: { profile?: Profile, onDone: ()=>void }){
  const [id] = useState(profile?.id ?? ('temp-' + Date.now()))
  const [name, setName] = useState(profile?.name ?? '')
  const [wordsText, setWordsText] = useState((profile?.words ?? []).join('\n'))

  useEffect(()=>{
    if(profile){ setName(profile.name); setWordsText((profile.words ?? []).join('\n')); }
  }, [profile])

  function save(){
    const words = wordsText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    const p: Profile = { id, name: name || 'Child', words, stats: profile?.stats ?? { played:0, correct:0 } }
    if(profile && profile.id === id) updateProfile(p); else addProfile(p);
    onDone();
  }

  return (
    <div>
      <h2>{profile ? 'Edit Child' : 'Create Child'}</h2>
      <div style={{ maxWidth:640 }}>
        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} style={{ display:'block', width:'100%', marginBottom:8 }} />
        <label>Words (one per line)</label>
        <textarea value={wordsText} onChange={e=>setWordsText(e.target.value)} rows={10} style={{ width:'100%' }} />
        <div style={{ marginTop:8 }}>
          <button onClick={save}>Save</button>
          <button onClick={onDone} style={{ marginLeft:8 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
