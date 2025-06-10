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
from datetime import datetime
from dotenv import load_dotenv
from pyrogram import Client, filters
from pyrogram.types import Message

# Load environment variables
# 加载环境变量
load_dotenv()

async def test_telegram():
    """
    Test Telegram connection and group interaction
    测试 Telegram 连接和群组交互
    """
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
        print("\n📋 Available chats and groups:")
        async for dialog in app.get_dialogs():
            print(f"- {dialog.chat.title or dialog.chat.first_name} (ID: {dialog.chat.id})")

        # Ask for group ID to monitor
        # 询问要监控的群组 ID
        group_id = input("\n🔍 Enter the group ID to monitor (or press Enter to exit): ")
        if not group_id:
            return

        # Convert group_id to integer
        # 将 group_id 转换为整数
        try:
            group_id = int(group_id)
        except ValueError:
            print("❌ Invalid group ID. Please enter a valid number.")
            return

        # Get recent messages from the group
        # 获取群组最近的消息
        print(f"\n📥 Fetching recent messages from group {group_id}...")
        messages = await app.get_messages(group_id, limit=5)
        
        print("\n📨 Recent messages:")
        for msg in messages:
            if msg.text:
                print(f"\n--- Message from {msg.from_user.first_name if msg.from_user else 'Unknown'} ---")
                print(f"Time: {msg.date}")
                print(f"Content: {msg.text}")
                print("---")

        # Set up message handler for new messages
        # 设置新消息处理器
        @app.on_message(filters.chat(group_id))
        async def handle_new_message(client, message: Message):
            print(f"\n📨 New message from {message.from_user.first_name if message.from_user else 'Unknown'}")
            print(f"Time: {message.date}")
            print(f"Content: {message.text}")
            print("---")

        print("\n👂 Listening for new messages... (Press Ctrl+C to stop)")
        
        # Keep the script running
        # 保持脚本运行
        await app.idle()

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        # Disconnect
        # 断开连接
        await app.stop()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_telegram()) 