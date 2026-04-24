import { useEffect, useRef, useState } from 'react'

const DAILY_CHAT_LIMIT = 20
const USAGE_STORAGE_KEY = 'kuromi-ai-daily-limit'
const MEMORY_STORAGE_KEY = 'kuromi-ai-memory-v2'
const KUROMI_NAME = 'Kuromi AI'
const CONSISTENT_CLOSE =
  'Kalau mau, aku bisa lanjutkan jadi ringkasan, langkah kerja, draft jawaban, atau daftar ide.'

const welcomeText =
  'Halo, aku Kuromi AI. Aku berjalan sepenuhnya lokal tanpa API, dan sekarang aku punya pseudo-learning dua lapis: memori jangka pendek untuk konteks percakapan aktif, dan memori jangka panjang untuk pola, preferensi, serta topik yang sering kamu bawa.'

const STOP_WORDS = new Set([
  'yang',
  'dan',
  'untuk',
  'dengan',
  'atau',
  'dari',
  'karena',
  'saya',
  'aku',
  'kamu',
  'kami',
  'kita',
  'mau',
  'ingin',
  'adalah',
  'bisa',
  'agar',
  'jadi',
  'seperti',
  'dalam',
  'sudah',
  'belum',
  'lagi',
  'lebih',
  'tolong',
  'buat',
  'ini',
  'itu',
  'the',
  'and',
  'for',
  'with',
  'your',
  'have',
  'from',
  'jadi',
  'banget',
  'dong',
  'nih',
  'sih',
  'aja',
  'sama',
  'bikin',
])

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
}

function toTitleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
  const raw = window.localStorage.getItem(USAGE_STORAGE_KEY)

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
  window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(payload))
}

function createEmptyMemory() {
  return {
    profile: {
      name: '',
      likes: [],
      role: '',
      currentFocus: '',
    },
    longTerm: {
      topics: {},
      traits: [],
      responseMode: 'adaptive',
    },
    shortTerm: {
      recentMessages: [],
      currentTopics: [],
      currentIntent: '',
      conversationSummary: '',
    },
    learnedAt: '',
  }
}

function readMemory() {
  const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY)

  if (!raw) {
    return createEmptyMemory()
  }

  try {
    const parsed = JSON.parse(raw)
    const fallback = createEmptyMemory()

    return {
      ...fallback,
      ...parsed,
      profile: {
        ...fallback.profile,
        ...(parsed?.profile ?? {}),
      },
      longTerm: {
        ...fallback.longTerm,
        ...(parsed?.longTerm ?? {}),
        topics: parsed?.longTerm?.topics ?? {},
        traits: Array.isArray(parsed?.longTerm?.traits)
          ? parsed.longTerm.traits.slice(0, 8)
          : [],
      },
      shortTerm: {
        ...fallback.shortTerm,
        ...(parsed?.shortTerm ?? {}),
        recentMessages: Array.isArray(parsed?.shortTerm?.recentMessages)
          ? parsed.shortTerm.recentMessages.slice(0, 5)
          : [],
        currentTopics: Array.isArray(parsed?.shortTerm?.currentTopics)
          ? parsed.shortTerm.currentTopics.slice(0, 4)
          : [],
      },
    }
  } catch {
    return createEmptyMemory()
  }
}

function writeMemory(memory) {
  window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory))
}

function extractTopicKeywords(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
    .slice(0, 10)
}

function detectIntent(text) {
  const normalized = normalizeText(text)

  if (/(ringkas|summary|rangkum)/.test(normalized)) return 'summarize'
  if (/(ide|brainstorm|konsep)/.test(normalized)) return 'brainstorm'
  if (/(langkah|step|tahapan|roadmap)/.test(normalized)) return 'plan'
  if (/(tulis|rewrite|perbaiki|rapikan|copywriting)/.test(normalized)) return 'rewrite'
  if (/(jelaskan|apa itu|kenapa|bagaimana)/.test(normalized)) return 'explain'

  return 'general'
}

function summarizeRecentContext(messages) {
  if (messages.length === 0) return ''
  if (messages.length === 1) return messages[0]
  return `${messages[0]} lalu ${messages[1]}`
}

function updateTrait(memory, value) {
  if (!value) return memory.longTerm.traits
  return Array.from(new Set([value, ...memory.longTerm.traits])).slice(0, 8)
}

function updateMemoryWithMessage(memory, userText) {
  const nextMemory = {
    ...memory,
    profile: { ...memory.profile },
    longTerm: {
      ...memory.longTerm,
      topics: { ...memory.longTerm.topics },
      traits: [...memory.longTerm.traits],
    },
    shortTerm: {
      ...memory.shortTerm,
      recentMessages: [userText, ...memory.shortTerm.recentMessages].slice(0, 5),
    },
    learnedAt: new Date().toISOString(),
  }

  const normalized = normalizeText(userText)
  const extractedTopics = extractTopicKeywords(userText)

  const nameMatch = normalized.match(
    /(?:nama saya|namaku|saya bernama|aku bernama)\s+([a-z0-9\s]+)/i
  )
  if (nameMatch?.[1]) {
    nextMemory.profile.name = toTitleCase(
      nameMatch[1].trim().split(/\s+/).slice(0, 3).join(' ')
    )
  }

  const likeMatch = normalized.match(
    /(?:saya suka|aku suka|saya senang|aku senang)\s+([a-z0-9\s]+)/i
  )
  if (likeMatch?.[1]) {
    const liked = likeMatch[1].trim().split(/\s+/).slice(0, 4).join(' ')
    nextMemory.profile.likes = Array.from(
      new Set([liked, ...nextMemory.profile.likes])
    ).slice(0, 5)
  }

  const roleMatch = normalized.match(
    /(?:saya seorang|aku seorang|saya kerja sebagai|aku kerja sebagai)\s+([a-z0-9\s]+)/i
  )
  if (roleMatch?.[1]) {
    nextMemory.profile.role = roleMatch[1].trim().split(/\s+/).slice(0, 5).join(' ')
  }

  const focusMatch = normalized.match(
    /(?:saya sedang|aku sedang|fokus saya|aku lagi fokus)\s+([a-z0-9\s]+)/i
  )
  if (focusMatch?.[1]) {
    nextMemory.profile.currentFocus = focusMatch[1]
      .trim()
      .split(/\s+/)
      .slice(0, 8)
      .join(' ')
  }

  if (normalized.includes('detail')) {
    nextMemory.longTerm.traits = updateTrait(nextMemory, 'suka jawaban detail')
  }
  if (normalized.includes('singkat') || normalized.includes('ringkas')) {
    nextMemory.longTerm.traits = updateTrait(nextMemory, 'suka jawaban ringkas')
  }
  if (normalized.includes('formal')) {
    nextMemory.longTerm.traits = updateTrait(nextMemory, 'suka nada formal')
  }
  if (normalized.includes('santai')) {
    nextMemory.longTerm.traits = updateTrait(nextMemory, 'suka nada santai')
  }

  extractedTopics.forEach((topic) => {
    nextMemory.longTerm.topics[topic] = (nextMemory.longTerm.topics[topic] ?? 0) + 1
  })

  nextMemory.shortTerm.currentTopics = extractedTopics.slice(0, 4)
  nextMemory.shortTerm.currentIntent = detectIntent(userText)
  nextMemory.shortTerm.conversationSummary = summarizeRecentContext(
    nextMemory.shortTerm.recentMessages
  )

  return nextMemory
}

function getTopTopics(memory, limit = 3) {
  return Object.entries(memory.longTerm.topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic)
}

function getShortContext(memory) {
  const topics = memory.shortTerm.currentTopics
  if (topics.length === 0) return ''
  return topics.join(', ')
}

function buildMemorySnapshot(memory) {
  const notes = []
  const topTopics = getTopTopics(memory)

  if (memory.profile.name) notes.push(`Aku ingat namamu ${memory.profile.name}.`)
  if (memory.profile.role) notes.push(`Konteks kerjamu saat ini: ${memory.profile.role}.`)
  if (memory.profile.currentFocus) {
    notes.push(`Fokus aktifmu yang tersimpan: ${memory.profile.currentFocus}.`)
  }
  if (memory.profile.likes.length > 0) {
    notes.push(`Preferensi yang kusimpan: ${memory.profile.likes.join(', ')}.`)
  }
  if (memory.longTerm.traits.length > 0) {
    notes.push(`Gaya jawaban yang kupelajari: ${memory.longTerm.traits.join(', ')}.`)
  }
  if (topTopics.length > 0) {
    notes.push(`Topik jangka panjang yang paling sering muncul: ${topTopics.join(', ')}.`)
  }
  if (memory.shortTerm.conversationSummary) {
    notes.push(`Konteks singkat percakapan aktif: ${memory.shortTerm.conversationSummary}.`)
  }

  return notes
}

function buildStructuredReply(userText, memory) {
  const normalized = normalizeText(userText)
  const topTopics = getTopTopics(memory)
  const shortContext = getShortContext(memory)
  const personaStyle =
    memory.longTerm.traits.includes('suka jawaban ringkas')
      ? 'ringkas'
      : memory.longTerm.traits.includes('suka jawaban detail')
        ? 'detail'
        : 'adaptif'

  if (normalized.includes('siapa kamu') || normalized.includes('namamu siapa')) {
    return [
      `Aku ${KUROMI_NAME}, asisten lokal tanpa API.`,
      `Aku memakai pseudo-learning dua lapis: memori jangka pendek untuk obrolan aktif dan memori jangka panjang untuk pola yang sering kamu ulang.`,
      `Semua memoriku disimpan lokal di browser ini.`,
      CONSISTENT_CLOSE,
    ].join(' ')
  }

  if (normalized.includes('ingat apa') || normalized.includes('apa yang kamu ingat')) {
    const snapshot = buildMemorySnapshot(memory)
    return snapshot.length > 0
      ? `${snapshot.join(' ')} Semua ini kusimpan lokal di browser, bukan di server mana pun.`
      : `Saat ini memoriku masih minim. Ceritakan nama, peran, fokus, atau gaya jawaban yang kamu suka, lalu aku akan mengingatnya secara lokal.`
  }

  if (
    normalized.includes('reset memori') ||
    normalized.includes('hapus memori') ||
    normalized.includes('lupakan semua')
  ) {
    return `Kalau kamu ingin benar-benar menghapus pseudo-learning-ku, pakai tombol Reset Memory di panel atas. Itu akan membersihkan memori jangka pendek dan jangka panjang sekaligus.`
  }

  const opening = `Kuromi AI menangkap inti pesanmu tentang "${userText}".`

  const contextLine = shortContext
    ? `Dalam konteks percakapan aktif, ini nyambung dengan ${shortContext}.`
    : `Aku sedang membangun konteks aktif dari pesan ini.`

  const longTermLine =
    topTopics.length > 0
      ? `Dari memori jangka panjang, topik yang paling sering kamu bawa adalah ${topTopics.join(', ')}.`
      : `Memori jangka panjangku masih berkembang, jadi setiap chat baru akan membantu Kuromi AI jadi lebih konsisten.`

  const profileLine = memory.profile.currentFocus
    ? `Aku akan menyesuaikan arah jawaban dengan fokusmu saat ini: ${memory.profile.currentFocus}.`
    : memory.profile.role
      ? `Aku juga mempertimbangkan peranmu sebagai ${memory.profile.role} saat menyusun jawaban.`
      : `Kalau kamu mau jawaban yang lebih pas, beri aku sedikit konteks tentang peran atau targetmu.`

  const intentMap = {
    summarize: 'Aku paling cocok melanjutkan ini sebagai ringkasan inti dan poin penting.',
    brainstorm: 'Aku bisa lanjutkan ini sebagai brainstorming ide yang lebih variatif.',
    plan: 'Aku bisa pecah ini menjadi tahapan atau langkah kerja yang runtut.',
    rewrite: 'Aku bisa bantu ubah ini menjadi versi yang lebih rapi, enak dibaca, atau lebih persuasif.',
    explain: 'Aku bisa jelaskan konsepnya dengan bahasa yang lebih sederhana dan terstruktur.',
    general:
      personaStyle === 'detail'
        ? 'Aku akan menjaga jawaban tetap lengkap dan kontekstual.'
        : personaStyle === 'ringkas'
          ? 'Aku akan menjaga jawaban tetap singkat dan langsung ke inti.'
          : 'Aku akan menjaga jawaban tetap seimbang antara konteks dan kejelasan.',
  }

  return [opening, contextLine, longTermLine, profileLine, intentMap[memory.shortTerm.currentIntent], CONSISTENT_CLOSE].join(' ')
}

export default function ChatBox({ accountEmail }) {
  const initialUsage = readDailyUsage()
  const initialMemory = readMemory()
  const [messages, setMessages] = useState([{ role: 'bot', text: '' }])
  const [input, setInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(true)
  const [dailyUsage, setDailyUsage] = useState(initialUsage)
  const [memory, setMemory] = useState(initialMemory)
  const [limitNotice, setLimitNotice] = useState(
    initialUsage.count >= DAILY_CHAT_LIMIT
      ? 'Limit 20 chat untuk hari ini sudah habis. Kamu bisa chat lagi besok.'
      : ''
  )
  const [memoryNotice, setMemoryNotice] = useState('')
  const bottomRef = useRef(null)
  const introTimerRef = useRef(null)
  const replyTimerRef = useRef(null)
  const remainingChats = Math.max(DAILY_CHAT_LIMIT - dailyUsage.count, 0)
  const isLimitReached = dailyUsage.count >= DAILY_CHAT_LIMIT
  const learnedTopics = getTopTopics(memory)

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

  const resetMemory = () => {
    const freshMemory = createEmptyMemory()
    setMemory(freshMemory)
    writeMemory(freshMemory)
    setMemoryNotice('Memori Kuromi AI berhasil direset. Pseudo-learning dimulai dari awal lagi.')
  }

  const sendMessage = () => {
    if (!input.trim() || isBotTyping) return

    if (isLimitReached) {
      setLimitNotice(
        'Limit 20 chat untuk hari ini sudah habis. Kamu bisa chat lagi besok.'
      )
      return
    }

    const userText = input.trim()
    const nextMemory = updateMemoryWithMessage(memory, userText)
    const reply = buildStructuredReply(userText, nextMemory)
    const nextUsage = {
      date: getTodayKey(),
      count: Math.min(dailyUsage.count + 1, DAILY_CHAT_LIMIT),
    }

    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setInput('')
    setIsBotTyping(true)
    setDailyUsage(nextUsage)
    setMemory(nextMemory)
    setMemoryNotice('')
    writeDailyUsage(nextUsage)
    writeMemory(nextMemory)

    if (nextUsage.count >= DAILY_CHAT_LIMIT) {
      setLimitNotice(
        'Ini chat terakhir untuk hari ini. Setelah balasan ini, Kuromi AI akan dikunci sampai besok.'
      )
    } else {
      setLimitNotice('')
    }

    replyTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: reply }])
      setIsBotTyping(false)
    }, 820)
  }

  return (
    <main className="chat-app">
      <section className="chat-shell">
        <header className="chat-header">
          <div>
            <p className="chat-kicker">Kuromi AI Workspace</p>
            <h1 className="chat-title">Kuromi AI is ready</h1>
            <p className="chat-subtitle">
              Login berhasil sebagai <strong>{accountEmail}</strong>. Kamu
              sekarang masuk ke workspace <strong>{KUROMI_NAME}</strong> yang
              berjalan lokal tanpa API.
            </p>
          </div>
          <div className="chat-header-side">
            <div className="chat-status">
              <span className="status-dot"></span>
              <span>kuromi online</span>
            </div>
            <div className={`chat-usage ${isLimitReached ? 'is-empty' : ''}`}>
              Sisa chat hari ini: <strong>{remainingChats}/20</strong>
            </div>
          </div>
        </header>

        <section className="memory-strip">
          <div className="memory-card">
            <span className="memory-label">Mode</span>
            <strong>Lokal, tanpa API</strong>
          </div>
          <div className="memory-card">
            <span className="memory-label">Memori Pendek</span>
            <strong>
              {memory.shortTerm.currentTopics.length > 0
                ? memory.shortTerm.currentTopics.join(', ')
                : 'Belum ada konteks aktif'}
            </strong>
          </div>
          <div className="memory-card">
            <span className="memory-label">Memori Panjang</span>
            <strong>
              {learnedTopics.length > 0
                ? learnedTopics.join(', ')
                : 'Menunggu pola jangka panjang'}
            </strong>
          </div>
          <div className="memory-card">
            <span className="memory-label">Profil</span>
            <strong>
              {memory.profile.name
                ? `Mengenal ${memory.profile.name}`
                : 'Belum ada profil user'}
            </strong>
          </div>
        </section>

        <div className="memory-actions">
          <button type="button" className="memory-reset-button" onClick={resetMemory}>
            Reset Memory
          </button>
          {memoryNotice ? <span className="memory-notice">{memoryNotice}</span> : null}
        </div>

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
              <div
                className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}
              >
                {msg.text}
                {msg.role === 'bot' &&
                index === messages.length - 1 &&
                isBotTyping ? (
                  <span
                    className="typing-cursor inline-cursor"
                    aria-hidden="true"
                  ></span>
                ) : null}
              </div>
            </article>
          ))}

          {isBotTyping && messages[messages.length - 1]?.text === welcomeText ? (
            <article className="message-row is-bot">
              <div className="message-bubble bot-bubble typing-indicator">
                Kuromi AI sedang menyiapkan jawaban
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
                : 'Ceritakan sesuatu agar Kuromi AI bisa belajar lebih konsisten...'
            }
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            disabled={isLimitReached}
          />
          <button
            onClick={sendMessage}
            className="chat-send-button"
            disabled={isLimitReached}
          >
            {isLimitReached ? 'Limit Habis' : 'Kirim ke Kuromi'}
          </button>
        </div>
      </section>
    </main>
  )
}
