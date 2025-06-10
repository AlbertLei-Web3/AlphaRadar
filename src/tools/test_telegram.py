#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Telegram Channel Interaction
测试 Telegram 频道交互

This script tests the connection to Telegram channels and message retrieval.
这个脚本测试与 Telegram 频道的连接和消息获取。

Dependencies 依赖:
- python-dotenv
- pyrogram
- tgcrypto
"""

import os
import sys
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from pyrogram import Client, filters
from pyrogram.types import Message, Chat

# Load environment variables
# 加载环境变量
load_dotenv()

# 主群组ID和要监听的thread_id
GROUP_ID = -1002202241417  # GMGN Featured Signals(Lv2) - SOL
THREAD_IDS = [3216629, 3216593]  # Pump King of the hill (KOTH) 和 KOL FOMO

async def main():
    """
    监听GMGN主群组下两个thread的所有消息
    Listen to all messages from two threads in the GMGN main group
    """
    app = Client(
        "my_account",
        api_id=os.getenv("TELEGRAM_API_ID"),
        api_hash=os.getenv("TELEGRAM_API_HASH"),
        session_string=os.getenv("TELEGRAM_SESSION_STRING"),
        proxy=dict(
            scheme=os.getenv("PROXY_PROTOCOL", "socks5"),
            hostname=os.getenv("PROXY_HOST", "127.0.0.1"),
            port=int(os.getenv("PROXY_PORT", "10808"))
        )
    )

    await app.start()
    print("✅ 监听已启动，等待消息... (Ctrl+C 停止)")

    # 监听指定thread_id的消息
    @app.on_message(filters.chat(GROUP_ID))
    async def handler(client, message: Message):
        # 检查是否属于我们关注的thread
        if message.thread_id in THREAD_IDS:
            print(f"\n--- 捕获到新消息 ---")
            print(f"Thread ID: {message.thread_id}")
            print(f"Message ID: {message.id}")
            print(f"Time: {message.date}")
            print(f"Content: {message.text}")
            print("-------------------")

    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 监听已停止")
    finally:
        await app.stop()

if __name__ == "__main__":
    asyncio.run(main()) 