# Homebrew Cask formula template for Markdown for Mac
#
# Author:  Albert Garcia Diaz
# Created: 2026-03-20
#
# INSTRUCTIONS:
#   1. Build the DMG:          npm run dist
#   2. Get the SHA256:         shasum -a 256 dist/Markdown\ for\ Mac-1.0.0.dmg
#   3. Create a GitHub Release and upload the DMG
#   4. Replace REPLACE_SHA256 and REPLACE_GITHUB_USERNAME below
#   5. Copy this file to your homebrew-tap repo at:
#        Casks/markdown-for-mac.rb

cask "markdown-for-mac" do
  version "1.0.0"
  sha256 "REPLACE_SHA256"

  url "https://github.com/REPLACE_GITHUB_USERNAME/markdown-for-mac/releases/download/v#{version}/Markdown.for.Mac-#{version}-arm64.dmg"
  name "Markdown for Mac"
  desc "A beautiful markdown viewer for macOS"
  homepage "https://github.com/REPLACE_GITHUB_USERNAME/markdown-for-mac"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Markdown for Mac.app"

  zap trash: [
    "~/Library/Application Support/markdown-for-mac",
    "~/Library/Preferences/com.markdownformac.app.plist",
    "~/Library/Saved Application State/com.markdownformac.app.savedState",
  ]
end
