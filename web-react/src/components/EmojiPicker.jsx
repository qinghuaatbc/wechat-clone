import { motion } from 'framer-motion'

const EMOJIS = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖']

export default function EmojiPicker({ onSelect }) {
  return (
    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-wechat-bar border-t border-wechat-border overflow-hidden">
      <div className="grid grid-cols-8 gap-2 p-4 h-48 overflow-y-auto">
        {EMOJIS.map((e, i) => (
          <button key={i} onClick={() => onSelect(e)} className="text-2xl hover:bg-wechat-bg rounded p-1">{e}</button>
        ))}
      </div>
    </motion.div>
  )
}
