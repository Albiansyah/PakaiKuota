"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Container } from "@/components/layout"
import {
  Megaphone,
  Loader2,
  CheckCircle2,
} from "lucide-react"

type Announcement = {
  id: string
  title: string
  message: string
  is_active: boolean
  created_at: string
}

export default function AdminBroadcastPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements")
      if (!res.ok) throw new Error("Unauthorized")
      const data = await res.json()
      setAnnouncements(data.announcements ?? [])
    } catch (err) {
      console.error("Failed to fetch announcements:", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    fetchAnnouncements()
  }, [user, router])

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setSent(false)

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      })
      if (res.ok) {
        setSent(true)
        setTitle("")
        setMessage("")
        fetchAnnouncements()
      }
    } catch (err) {
      console.error("Failed to send announcement:", err)
    }
    setSending(false)
  }

  return (
    <Container>
      <div className="flex items-center gap-3 mb-8">
        <Megaphone className="h-8 w-8 text-[var(--accent)]" />
        <div>
          <h1 className="text-3xl font-bold">Broadcast</h1>
          <p className="text-[var(--color-muted-foreground)]">
            Kirim pengumuman ke semua user
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kirim Pengumuman Baru</CardTitle>
            <CardDescription>Pengumuman akan muncul di dashboard semua user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Judul</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul pengumuman"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Pesan</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Isi pengumuman..."
                rows={4}
              />
            </div>
            {sent && (
              <p className="text-sm text-[var(--color-success)] flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Pengumuman berhasil dikirim!
              </p>
            )}
            <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Kirim
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengumuman</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--color-muted-foreground)]" />
              </div>
            ) : announcements.length === 0 ? (
              <p className="py-8 text-center text-[var(--color-muted-foreground)]">
                Belum ada pengumuman
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="border border-[var(--color-border)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{a.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"}`}>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">{a.message}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1 font-mono">
                      {new Date(a.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
