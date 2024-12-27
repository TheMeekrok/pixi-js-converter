import type { NextConfig } from "next"
import CopyWebpackPlugin from "copy-webpack-plugin"

const nextConfig: NextConfig = {
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false }

    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [{ from: "node_modules/canvaskit-wasm/bin/canvaskit.wasm" }],
      })
    )

    return config
  },
}

export default nextConfig
