'use client';

import { Inter } from "next/font/google"

import {Provider} from "@/components/ui/provider";
import {TopNavBar} from "@/components/ui/navigation/navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
      <html className={inter.className} suppressHydrationWarning>
          <head>
              <title>BZE App</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="description" content="BZE app is a blockchain application built on top of BeeZee blockchain. The BZE coin or BeeZee coin empowers the network with rich features, a fast and secure blockchain with high performance."/>
              <link rel="icon" href="/images/logo_320px.png"/>
          </head>
          <body>
            <Provider>
                <TopNavBar appLabel={"DEX"} />
                {children}
            </Provider>
          </body>
      </html>
  )
}