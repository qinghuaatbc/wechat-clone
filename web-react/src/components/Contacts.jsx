import { useStore } from '../store'
import { useState } from 'react'
import { Search, Plus } from 'lucide-react'

export default function Contacts() {
  const friends = useStore(s => s.friends)
  const searchUser = useStore(s => s.searchUser)
  const addFriend = useStore(s => s.addFriend)
  const fetchFriends = useStore(s => s.fetchFriends)

  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const handleSearch = async () => {
    if (!keyword.trim()) return
    const results = await searchUser(keyword)
    setSearchResults(results)
  }

  const handleAdd = async (wxid) => {
    await addFriend(wxid)
    setSearchResults([])
    setKeyword('')
    fetchFriends()
  }

  const groupedFriends = friends.reduce((acc, f) => {
    const letter = f.nickname?.[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(f)
    return acc
  }, {})

  const sortedLetters = Object.keys(groupedFriends).sort()

  return (
    <div className="pb-16">
      <div className="sticky top-0 bg-wechat-bg px-4 py-2 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wechat-gray" size={18} />
          <input
            type="text"
            placeholder="搜索微信号/昵称"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-wechat-green/50"
          />
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white mt-2 divide-y divide-wechat-border">
          {searchResults.map(u => (
            <div key={u.id} className="flex items-center p-4 justify-between">
              <div>
                <p className="font-medium">{u.nickname}</p>
                <p className="text-sm text-wechat-gray">{u.wxid}</p>
              </div>
              <button
                onClick={() => handleAdd(u.wxid)}
                className="px-4 py-1.5 bg-wechat-green text-white rounded-full text-sm hover:opacity-90"
              >
                添加
              </button>
            </div>
          ))}
        </div>
      )}

      {sortedLetters.map(letter => (
        <div key={letter}>
          <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg sticky top-[73px] z-10">
            {letter}
          </div>
          <div className="bg-white divide-y divide-wechat-border">
            {groupedFriends[letter].map(f => (
              <div key={f.id} className="flex items-center p-4 active:bg-wechat-bg transition">
                <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0">
                  {f.nickname?.[0] || '?'}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-wechat-dark">{f.nickname}</p>
                  {f.online && <span className="text-xs text-wechat-green">在线</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {friends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-wechat-gray">
          <p className="text-lg mb-2">暂无好友</p>
          <p className="text-sm">搜索上方添加好友</p>
        </div>
      )}
    </div>
  )
}
