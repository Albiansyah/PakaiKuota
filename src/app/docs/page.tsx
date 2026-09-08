"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Container, Grid, PageHeader } from "@/components/layout"
import {
  Code2,
  Terminal,
  Copy,
  Check,
  Rocket,
  BookOpen,
  Key,
  FileCode,
} from "lucide-react"
import { cn } from "@/lib/cn"

const SNIPPETS = {
  curl: `curl https://api.pakaikuota.id/v1/chat/completions \\
  -H "Authorization: Bearer $PK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "Kamu adalah asisten yang helpful."},
      {"role": "user", "content": "Halo, siapa kamu?"}
    ]
  }'`,

  python: `import requests

url = "https://api.pakaikuota.id/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "gpt-4o-mini",
    "messages": [
        {"role": "user", "content": "Halo!"}
    ]
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,

  node: `const response = await fetch("https://api.pakaikuota.id/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.PK_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Halo!" }]
  })
});

const data = await response.json();
console.log(data);`,

  go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://api.pakaikuota.id/v1/chat/completions"

	payload := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "user", "content": "Halo!"},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println("Response:", resp.Status)
}`,

  php: `<?php

$url = "https://api.pakaikuota.id/v1/chat/completions";

$data = [
    "model" => "gpt-4o-mini",
    "messages" => [
        ["role" => "user", "content" => "Halo!"]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);`,

}

const MODELS = [
  { name: "gpt-4o", description: "Model flagship OpenAI", tier: "Menengah", price: "Rp 15.000" },
  { name: "gpt-4o-mini", description: "Model kecil, cepat, murah", tier: "Murah", price: "Rp 2.500" },
  { name: "claude-3-5-sonnet", description: "Model Claude terbaru", tier: "Menengah", price: "Rp 18.000" },
  { name: "gemini-1.5-flash", description: "Model cepat Google", tier: "Murah", price: "Rp 1.500" },
]

const STEPS = [
  {
    icon: Rocket,
    title: "1. Daftar Akun",
    description: "Daftar di PakaiKuota.id dan verifikasi email",
  },
  {
    icon: Key,
    title: "2. Top-up Saldo",
    description: "Top-up saldo menggunakan QRIS",
  },
  {
    icon: BookOpen,
    title: "3. Buat API Key",
    description: "Generate API key di dashboard",
  },
  {
    icon: FileCode,
    title: "4. Mulai Coding",
    description: "Gunakan API key untuk mengakses model LLM",
  },
]

export default function DocsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("curl")
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(SNIPPETS[activeTab as keyof typeof SNIPPETS])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Container>
      <PageHeader
        title="Dokumentasi API"
        description="Quickstart guide dan contoh code untuk integrate API PakaiKuota"
      />

      {/* Quickstart Steps */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Mulai Cepat</CardTitle>
          <CardDescription>
            4 langkah untuk mulai menggunakan API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Grid cols={4} gap="sm">
            {STEPS.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 mb-3">
                  <step.icon className="h-6 w-6 text-[var(--color-brand)]" />
                </div>
                <h3 className="font-medium mb-1">{step.title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {step.description}
                </p>
              </div>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Contoh Code</CardTitle>
          <CardDescription>
            Copy-paste ready code untuk berbagai bahasa pemrograman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="curl">
                <Terminal className="h-4 w-4 mr-2" />
                cURL
              </TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="go">Go</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            {Object.entries(SNIPPETS).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="mt-0">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <pre className="p-4 overflow-x-auto bg-[var(--color-muted)] rounded-lg text-sm font-mono">
                    <code>{code}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model yang Tersedia</CardTitle>
          <CardDescription>
            Daftar model yang dapat diakses via API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MODELS.map((model, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)]">
                    <Code2 className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-medium">{model.name}</code>
                      <Badge
                        variant={
                          model.tier === "Murah"
                            ? "success"
                            : model.tier === "Mahal"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {model.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {model.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{model.price}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    per 1M tokens
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-[var(--color-muted-foreground)] text-center">
            Lihat semua model di{" "}
            <a href="/pricing" className="text-[var(--color-brand)] hover:underline">
              halaman harga
            </a>
          </p>
        </CardContent>
      </Card>
    </Container>
  )
}
