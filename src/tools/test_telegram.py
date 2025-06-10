#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Telegram Group Interaction
测试 Telegram 群组交互

This script tests the connection to Telegram groups and message retrieval.
这个脚本测试与 Telegram 群组的连接和消息获取。

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

# GMGN Signal Groups
# GMGN 信号群组
GMGN_GROUPS = {
    "GMGN Featured Signals(Lv2) - SOL": "gmgnsignals",
    "GMGN Featured Signals(Lv2) - ETH": "gmgnsignalseth",
    "GMGN Featured Signals(Lv2) - BTC": "gmgnsignalsbtc",
    "GMGN Featured Signals(Lv2) - BNB": "gmgnsignalsbnb",
    "GMGN Featured Signals(Lv2) - AVAX": "gmgnsignalsavax",
    "GMGN Featured Signals(Lv2) - MATIC": "gmgnsignalsmatic",
    "GMGN Featured Signals(Lv2) - ARB": "gmgnsignalsarb",
    "GMGN Featured Signals(Lv2) - OP": "gmgnsignalsop",
    "GMGN Featured Signals(Lv2) - BASE": "gmgnsignalsbase",
    "GMGN Featured Signals(Lv2) - INJ": "gmgnsignalsinj",
    "GMGN Featured Signals(Lv2) - TIA": "gmgnsignalstia",
    "GMGN Featured Signals(Lv2) - SEI": "gmgnsignalssei",
    "GMGN Featured Signals(Lv2) - SUI": "gmgnsignalssui",
    "GMGN Featured Signals(Lv2) - APT": "gmgnsignalsapt",
    "GMGN Featured Signals(Lv2) - NEAR": "gmgnsignalsnear",
    "GMGN Featured Signals(Lv2) - ATOM": "gmgnsignalsatom",
    "GMGN Featured Signals(Lv2) - OSMO": "gmgnsignalsosmo"
}

async def test_telegram():
    """
    Test Telegram connection and group interaction
    测试 Telegram 连接和群组交互
    """
    app = None
    try:
        print("🚀 Starting Telegram test...")

        # Get proxy configuration from environment variables
        # 从环境变量获取代理配置
        proxy_host = os.getenv("PROXY_HOST", "127.0.0.1")
        proxy_port = int(os.getenv("PROXY_PORT", "10808"))
        proxy_protocol = os.getenv("PROXY_PROTOCOL", "socks5")

        # Initialize client with proxy
        # 使用代理初始化客户端
        app = Client(
            "my_account",
            api_id=os.getenv("TELEGRAM_API_ID"),
            api_hash=os.getenv("TELEGRAM_API_HASH"),
            session_string=os.getenv("TELEGRAM_SESSION_STRING"),
            proxy=dict(
                scheme=proxy_protocol,
                hostname=proxy_host,
                port=proxy_port
            )
        )

        # Connect to Telegram
        # 连接到 Telegram
        print("🔌 Connecting to Telegram...")
        await app.start()

        # Get user information
        # 获取用户信息
        me = await app.get_me()
        print(f"\n✅ Connected as: {me.first_name} (@{me.username})")

        # Get list of dialogs (chats and groups)
        # 获取对话列表（聊天和群组）
        print("\n📋 Available GMGN signal groups:")
        group_ids = {}
        
        async for dialog in app.get_dialogs():
            chat = dialog.chat
            if chat.username in GMGN_GROUPS.values():
                group_ids[chat.title] = chat.id
                print(f"- {chat.title} (ID: {chat.id})")

        if not group_ids:
            print("❌ No GMGN signal groups found. Please make sure you're a member of these groups.")
            return

        # Set up message handlers for all groups
        # 为所有群组设置消息处理器
        @app.on_message(filters.chat(list(group_ids.values())))
        async def handle_new_message(client, message: Message):
            chat = await app.get_chat(message.chat.id)
            print(f"\n📨 New message in {chat.title}")
            print(f"From: {message.from_user.first_name if message.from_user else 'Unknown'}")
            print(f"Time: {message.date}")
            print(f"Content: {message.text}")
            print("---")

        print("\n👂 Listening for new messages in all GMGN signal groups... (Press Ctrl+C to stop)")
        
        # Keep the script running using asyncio
        # 使用 asyncio 保持脚本运行
        while True:
            await asyncio.sleep(1)

    except KeyboardInterrupt:
        print("\n👋 Stopping the script...")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        # Disconnect
        # 断开连接
        if app:
            await app.stop()

if __name__ == "__main__":
    asyncio.run(test_telegram()) 