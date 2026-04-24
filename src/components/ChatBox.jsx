import { useEffect, useRef, useState } from 'react'

const DAILY_CHAT_LIMIT = 20
const STORAGE_KEY = 'ai-chat-daily-limit'

const welcomeText =
  'Halo, selamat datang di AI Chat. Aku siap bantu brainstorming, menulis ulang, merangkum, atau menjawab pertanyaanmu.'

function buildReply(userText) {
  return `Siap. Aku menangkap inti pesanmu tentang "${userText}". Kalau mau, aku bisa bantu pecah jadi poin, bikin versi lebih rapi, atau langsung kasih jawaban draft.`
}

function getTodayKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function readDailyUsage() {
  const today = getTodayKey()
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return { date: today, count: 0 }
  }

  try {
    const parsed = JSON.parse(raw)

    if (parsed?.date === today && Number.isFinite(parsed?.count)) {
      return { date: today, count: parsed.count }
    }
  } catch {
    return { date: today, count: 0 }
  }

  return { date: today, count: 0 }
}

function writeDailyUsage(payload) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export default function ChatBox({ accountEmail }) {
  const initialUsage = readDailyUsage()
  const [messages, setMessages] = useState([{ role: 'bot', text: '' }])
  const [input, setInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(true)
  const [dailyUsage, setDailyUsage] = useState(initialUsage)
  const [limitNotice, setLimitNotice] = useState(
    initialUsage.count >= DAILY_CHAT_LIMIT
      ? 'Limit 20 chat untuk hari ini sudah habis. Kamu bisa chat lagi besok.'
      : ''
  )
  const bottomRef = useRef(null)
  const introTimerRef = useRef(null)
  const replyTimerRef = useRef(null)
  const remainingChats = Math.max(DAILY_CHAT_LIMIT - dailyUsage.count, 0)
  const isLimitReached = dailyUsage.count >= DAILY_CHAT_LIMIT

  useEffect(() => {
    let index = 0

    introTimerRef.current = window.setInterval(() => {
      index += 1
      setMessages([{ role: 'bot', text: welcomeText.slice(0, index) }])

      if (index >= welcomeText.length) {
        window.clearInterval(introTimerRef.current)
        setIsBotTyping(false)
      }
    }, 24)

    return () => {
      if (introTimerRef.current) {
        window.clearInterval(introTimerRef.current)
      }
      if (replyTimerRef.current) {
        window.clearTimeout(replyTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isBotTyping])

  const sendMessage = () => {
    if (!input.trim() || isBotTyping) return

    if (isLimitReached) {
      setLimitNotice(
        'Limit 20 chat untuk hari ini sudah habis. Kamu bisa chat lagi besok.'
      )
      return
    }

    const userText = input.trim()
    const reply = buildReply(userText)
    const nextUsage = {
      date: getTodayKey(),
      count: Math.min(dailyUsage.count + 1, DAILY_CHAT_LIMIT),
    }

    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setInput('')
    setIsBotTyping(true)
    setDailyUsage(nextUsage)
    writeDailyUsage(nextUsage)

    if (nextUsage.count >= DAILY_CHAT_LIMIT) {
      setLimitNotice(
        'Ini chat terakhir untuk hari ini. Setelah balasan ini, AI chat akan dikunci sampai besok.'
      )
    } else {
      setLimitNotice('')
    }

    replyTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: reply }])
      setIsBotTyping(false)
    }, 800)
  }

  return (
    <main className="chat-app">
      <section className="chat-shell">
        <header className="chat-header">
          <div>
            <p className="chat-kicker">AI Workspace</p>
            <h1 className="chat-title">AI Chat is ready</h1>
            <p className="chat-subtitle">
              Login berhasil sebagai <strong>{accountEmail}</strong>. Mulai
              percakapan dengan asisten AI kamu.
            </p>
          </div>
          <div className="chat-header-side">
            <div className="chat-status">
              <span className="status-dot"></span>
              <span>assistant online</span>
            </div>
            <div className={`chat-usage ${isLimitReached ? 'is-empty' : ''}`}>
              Sisa chat hari ini: <strong>{remainingChats}/20</strong>
            </div>
          </div>
        </header>

        {limitNotice ? (
          <div className={`chat-limit-banner ${isLimitReached ? 'is-locked' : ''}`}>
            {limitNotice}
          </div>
        ) : null}

        <section className="chat-window">
          {messages.map((msg, index) => (
            <article
              key={`${msg.role}-${index}`}
              className={`message-row ${msg.role === 'user' ? 'is-user' : 'is-bot'}`}
            >
              <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                {msg.text}
                {msg.role === 'bot' && index === messages.length - 1 && isBotTyping ? (
                  <span className="typing-cursor inline-cursor" aria-hidden="true"></span>
                ) : null}
              </div>
            </article>
          ))}

          {isBotTyping && messages[messages.length - 1]?.text === welcomeText ? (
            <article className="message-row is-bot">
              <div className="message-bubble bot-bubble typing-indicator">
                AI sedang menyiapkan jawaban
                <span></span>
                <span></span>
                <span></span>
              </div>
            </article>
          ) : null}

          <div ref={bottomRef} />
        </section>

        <div className="chat-composer">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="chat-input"
            placeholder={
              isLimitReached
                ? 'Limit chat hari ini sudah habis. Coba lagi besok.'
                : 'Tulis pertanyaan, ide, atau instruksi untuk AI...'
            }
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            disabled={isLimitReached}
          />
          <button
            onClick={sendMessage}
            className="chat-send-button"
            disabled={isLimitReached}
          >
            {isLimitReached ? 'Limit Habis' : 'Kirim'}
          </button>
        </div>
      </section>
    </main>
  )
}
