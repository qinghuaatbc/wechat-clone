import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { X, Camera, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function QRScanner({ onClose }) {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [targetUser, setTargetUser] = useState(null)
  const [adding, setAdding] = useState(false)
  const animationRef = useRef(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', true)
        videoRef.current.play()
        requestAnimationFrame(tick)
      }
    } catch (err) {
      setError('无法访问摄像头，请允许摄像头权限')
    }
  }

  const tick = useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight
      canvas.width = video.videoWidth
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })

      if (code && code.data) {
        handleScanResult(code.data)
        return
      }
    }
    animationRef.current = requestAnimationFrame(tick)
  }, [scanning])

  const handleScanResult = (data) => {
    setScanning(false)
    stopCamera()
    
    // Parse QR code data - expected format: "wechat:user:{uuid}"
    let userId = data
    if (data.startsWith('wechat:user:')) {
      userId = data.replace('wechat:user:', '')
    }
    
    setResult(userId)
    setShowConfirm(true)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code && code.data) {
          handleScanResult(code.data)
        } else {
          toast.error('无法识别二维码')
        }
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleAddFriend = async () => {
    setAdding(true)
    try {
      const res = await fetch('/api/friends/qr-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_id: result })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.message === 'friend added') {
          toast.success('好友已添加')
        } else {
          toast.success('好友请求已发送')
        }
        onClose?.()
      } else {
        toast.error(data.error || '添加失败')
      }
    } catch (e) {
      toast.error('网络错误')
    } finally {
      setAdding(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={onClose} className="text-white p-2 rounded-full bg-white/20">
          <X size={24} />
        </button>
        <h2 className="text-white font-medium">扫一扫</h2>
        <label className="text-white p-2 rounded-full bg-white/20 cursor-pointer">
          <Image size={24} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {error ? (
          <div className="text-center p-6">
            <AlertCircle size={48} className="text-wechat-gray mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <button onClick={startCamera} className="px-6 py-2 bg-wechat-green text-white rounded-lg">
              重试
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scan Area Overlay */}
            <div className="relative z-10">
              <div className="w-64 h-64 border-2 border-wechat-green rounded-lg relative overflow-hidden">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-wechat-green -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-wechat-green -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-wechat-green -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-wechat-green -mb-1 -mr-1" />
                
                {/* Scan line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-wechat-green/50 animate-scan" />
              </div>
            </div>

            <p className="absolute bottom-32 left-0 right-0 text-center text-white/80 text-sm z-10">
              将二维码放入框内，即可自动扫描
            </p>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-wechat-dark rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 rounded-full bg-wechat-green/20 flex items-center justify-center text-wechat-green text-2xl font-bold mx-auto mb-4">
                {targetUser?.nickname?.[0] || '?'}
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">添加好友</h3>
              <p className="text-sm text-wechat-gray mb-6">
                是否添加该用户为好友？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border border-wechat-border dark:border-gray-700 dark:text-wechat-darkText rounded-lg font-medium hover:bg-wechat-bg transition"
                >
                  取消
                </button>
                <button
                  onClick={handleAddFriend}
                  disabled={adding}
                  className="flex-1 py-3 bg-wechat-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
