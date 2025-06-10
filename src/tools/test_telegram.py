import os
import sys
import asyncio
from dotenv import load_dotenv
from pyrogram import Client
from pyrogram.raw import types

# 加载环境变量
load_dotenv()

GROUP_ID = -1002202241417  # GMGN Featured Signals(Lv2) - SOL
THREAD_IDS = [3216629, 3216593]  # Pump King of the hill (KOTH) 和 KOL FOMO


async def main():
    """
    使用 on_raw_update 打印所有原始 update，便于调试 thread/topic 消息
    Use on_raw_update to print all raw updates for debugging thread/topic messages
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
    print("✅ on_raw_update 调试已启动，等待原始消息... (Ctrl+C 停止)")

    @app.on_raw_update()
    async def raw_update_handler(client, update, users, chats):
        # 只打印与目标群组相关的 update
        # Only print updates related to the target group
        try:
            # 打印所有 update 的类型和内容
            print("\n--- 捕获到原始 update ---")
            print(f"Update type: {type(update)}")
            print(f"Update content: {update}")
            # 如果 update 里有 peer/channel/group id，打印出来
            if hasattr(update, 'peer'):
                print(f"peer: {update.peer}")
            if hasattr(update, 'channel_id'):
                print(f"channel_id: {update.channel_id}")
            if hasattr(update, 'message'):
                print(f"message: {getattr(update, 'message', None)}")
            print("------------------------")
        except Exception as e:
            print(f"❌ Error in raw_update_handler: {e}")

    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 监听已停止")
    finally:
        await app.stop()

if __name__ == "__main__":
    asyncio.run(main())
