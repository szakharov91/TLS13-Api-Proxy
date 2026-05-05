# TLS13-Api-Proxy

HTTP-прокси для пробрасывания запросов к ЕСИА с проверкой клиентского ключа доступа.

## Установка

Скачайте бинарник для вашей платформы со страницы [Releases](../../releases):

| Файл | Платформа |
|------|-----------|
| `tls13apiproxy-linux` | Linux x64 |
| `tls13apiproxy-macos` | macOS x64 |
| `tls13apiproxy-win.exe` | Windows x64 |

На Linux/macOS сделайте файл исполняемым:

```bash
chmod +x tls13apiproxy-linux
```

## Подготовка файла ключей

Создайте текстовый файл, в котором каждый клиентский ключ записан на отдельной строке. Строки начинающиеся с `#` считаются комментариями и игнорируются.

```
# Ключи клиентов
my-secret-key-1
my-secret-key-2
another-client-key
```

## Запуск

```bash
./tls13apiproxy-linux -p <порт> -k <путь-к-файлу-ключей>
```

**Аргументы:**

| Аргумент | Описание |
|----------|----------|
| `-p` | Порт, на котором будет слушать прокси |
| `-k` | Путь к текстовому файлу с клиентскими ключами |

**Пример:**

```bash
./tls13apiproxy-linux -p 3000 -k /etc/proxy/keys.txt
```

## Использование

Прокси принимает `POST /esia` запросы. Каждый запрос должен содержать заголовки:

| Заголовок | Описание |
|-----------|----------|
| `x-client-api-key` | Ключ клиента из файла ключей |
| `x-target-url` | URL целевого ЕСИА-эндпоинта |
| `Authorization` | Bearer-токен (пробрасывается на целевой сервер) |

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/esia \
  -H "x-client-api-key: my-secret-key-1" \
  -H "x-target-url: https://esia.gosuslugi.ru/aas/oauth2/token" \
  -H "Authorization: Bearer <токен>" \
  -H "Content-Type: application/json" \
  -d '{"grant_type": "client_credentials"}'
```

## Коды ответов

| Код | Причина |
|-----|---------|
| `400` | Не передан заголовок `x-target-url` |
| `401` | Отсутствует или неверный `x-client-api-key` |
| `5xx` | Ошибка от целевого сервера или сетевая ошибка |
