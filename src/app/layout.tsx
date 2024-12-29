import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import "./globals.css"

const geistMono = Geist_Mono({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "pixi.js to Skia converter",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`h-screen py-20 ${geistMono.className} antialiased max-w-[1024px] mx-auto`}
      >
        {children}
      </body>
    </html>
  )
}
