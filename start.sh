#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
fileName="start.js"

filePath="$DIR/$fileName"
# 打开第一个 Terminal 窗口并运行第一个 Node.js 脚本
osascript -e 'tell application "Terminal" to do script "cd '"$DIR"' && node '"$filePath"'"'

