import { useStore } from '../store'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCode() {
  const user = useStore(s => s.user)

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-4">我的二维码</h2>
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCodeSVG value={`wechat://user/${user?.wxid}`} size={200} />
      </div>
      <p className="mt-4 text-wechat-gray text-sm">微信号: {user?.wxid}</p>
    </div>
  )
}
