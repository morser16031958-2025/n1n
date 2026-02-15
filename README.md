# n1n-chat

Веб‑чат на React для работы с двумя провайдерами:
- n1n.ai
- OpenRouter

## Запуск

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

## Ключи API

Ключи сохраняются локально в браузере (localStorage) отдельно для каждого провайдера:
- `n1n_api_key`
- `openrouter_api_key`

Не добавляйте ключи в репозиторий.

## Выгрузка на GitHub

1) Создайте репозиторий на GitHub (пустой).

2) В проекте выполните:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

В репозитории уже настроен CI, который проверяет сборку на GitHub Actions.
