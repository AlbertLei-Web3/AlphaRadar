#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate Telegram Session String
生成 Telegram 会话字符串

This script uses Pyrogram to generate a session string for Telegram API.
这个脚本使用 Pyrogram 为 Telegram API 生成会话字符串。

Dependencies 依赖:
- python-dotenv
- pyrogram
- tgcrypto
"""

import os
import sys
from dotenv import load_dotenv
from pyrogram import Client

# Load environment variables
# 加载环境变量
load_dotenv()

def generate_session():
    """
    Generate Telegram session string
    生成 Telegram 会话字符串
    """
    try:
        print("🚀 Starting session generation...")

        # Get proxy configuration from environment variables
        # 从环境变量获取代理配置
        proxy_host = os.getenv("PROXY_HOST", "127.0.0.1")
        proxy_port = int(os.getenv("PROXY_PORT", "10808"))
        proxy_protocol = os.getenv("PROXY_PROTOCOL", "socks5")

        # Get phone number
        # 获取电话号码
        phone_number = input("📱 Please enter your phone number (with country code, e.g., +1234567890): ")

        # Initialize client with proxy
        # 使用代理初始化客户端
        app = Client(
            "my_account",
            api_id=27321288,
            api_hash="5c3202e68b0b9d356e7fc7daaec65e90",
            proxy=dict(
                scheme=proxy_protocol,
                hostname=proxy_host,
                port=proxy_port
            )
        )

        # Connect to Telegram
        # 连接到 Telegram
        print("🔌 Connecting to Telegram...")
        app.connect()

        # Send code request
        # 发送验证码请求
        print("📤 Sending code request...")
        sent_code = app.send_code(phone_number)

        # Get verification code
        # 获取验证码
        code = input("🔑 Please enter the verification code you received: ")

        # Sign in
        # 登录
        print("🔐 Signing in...")
        app.sign_in(phone_number, sent_code.phone_code_hash, code)

        # Get session string
        # 获取会话字符串
        session_string = app.export_session_string()
        print("\n✅ Session string generated successfully!")
        print("\n📋 Your session string:")
        print(session_string)
        print("\n💡 Add this to your .env file as TELEGRAM_SESSION_STRING")

        # Disconnect
        # 断开连接
        app.disconnect()

    except Exception as e:
        print(f"❌ Error generating session: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_session() 