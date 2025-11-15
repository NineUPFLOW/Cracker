import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ВСТАВЬ СЮДА СВОЙ ТОКЕН ОТ @BotFather
BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[
        InlineKeyboardButton("🎮 Играть в Змейку", web_app=WebAppInfo(
            url="https://nineupflow.github.io/Cracker/"
        ))
    ]]
    
    await update.message.reply_text(
        "🐍 *Игра Змейка*\n\n"
        "Нажми кнопку ниже чтобы начать игру прямо в Telegram!",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode='Markdown'
    )

if __name__ == '__main__':
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("Бот запущен!")
    app.run_polling()
