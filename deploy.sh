#!/bin/bash

# Деплой Vibe Todo на http://192.168.223.76:3000/

echo "🚀 Начинаю деплой Vibe Todo..."

# 1. Сборка проекта
echo "📦 Сборка проекта..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки проекта"
    exit 1
fi

# 2. Копирование на сервер
echo "📤 Копирование файлов на сервер..."
scp -r build/* developer@192.168.223.76:/var/www/vibe-todo/

if [ $? -ne 0 ]; then
    echo "❌ Ошибка копирования файлов"
    exit 1
fi

# 3. Перезапуск сервиса
echo "🔄 Перезапуск сервиса..."
ssh developer@192.168.223.76 "cd /var/www/vibe-todo && pm2 restart vibe-todo"

if [ $? -ne 0 ]; then
    echo "❌ Ошибка перезапуска сервиса"
    exit 1
fi

echo "✅ Деплой успешно завершен!"
echo "🌐 Приложение доступно по адресу: http://192.168.223.76:3000/"
