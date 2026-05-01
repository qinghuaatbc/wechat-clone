import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Search, Plus, MessageSquare } from 'lucide-react'

export default function GroupList({ onSelect }) {
  const groups = useStore(s => s.groups)
  const fetchGroups = useStore(s => s.fetchGroups)

  useEffect(() => { fetchGroups() }, [fetchGroups])

  return (
    <div className="divide-y divide-wechat-border">
      {groups.length === 0 ? (
        <p className="text-center py-8 text-wechat-gray">暂无群聊</p>
      ) : (
        groups.map(g => (
          <div key={g.id} className="flex items-center p-4 hover:bg-wechat-bg transition cursor-pointer" onClick={onSelect}>
            <div className="w-10 h-10 rounded bg-gray-500 flex items-center justify-center text-white">
              <MessageSquare size={20} />
            </div>
            <div className="ml-3">
              <p className="font-medium">{g.name}</p>
              <p className="text-xs text-wechat-gray">{g.owner_id === useStore.getState().user?.id ? '群主' : '成员'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
