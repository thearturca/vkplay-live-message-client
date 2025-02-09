# VKplay live chat API client

**Это пре-альфа версия, здесь не протестировано на продолжительном подключении к вебсокету. Возможны вылеты и ошибки. Баги присылать сюда https://github.com/thearturca/vkplay-live-message-client/issues**

## Описание

Эта библиотека поможет вам подключиться к чату канала стримера на стриминговой площадке live.vkvideo.ru, и получать/отправлять сообщения с парсингом смайлов, создавать чат-ботов или клиенты для чатов. Чаты работают даже когда стримера нет в сети.

## Авторизация

Для отправки сообщений нужно указать токен live.vkvideo.ru, либо авторизационные данные для входа (логин и пароль).
Так как ещё нет легального удобного способа получить токен, его нужно взять из localStorage вашего браузера, если вы уже залогинены. Находиться в поле `auth`. Лучше всего создать новый аккаунт для бота. Если вы знаете, как достать токен, сообщите мне в discord.

Иструкция по получению токена с реферешом [live.vkvideo.ru](https://live.vkvideo.ru):

1. Откройте окно браузера в режиме инкогнито
2. Перейдите на страничку [live.vkvideo.ru](https://live.vkvideo.ru)
3. Нажмите на кнопку `Вход` и залогиньтесь
4. Обновите страницу
5. Нажмите `Ctrl+Shift+I`, перейдите в вкладку Application. Слева нажмите на `Local Storage`.
6. Найдите в столбце `Key` значение `auth`. Скопируйте `accessToken`, `refreshToken` и `expiresAt`. Это можно будет вставить в поле `auth` в вашем боте.
7. Найдите в столбце `Key` значение `_clientId`. Скопируйте значение. Это будет `clientId` для бота.

`Discord для вопросов: thearturca`

## [Поддержи проект на бусти!](https://boosty.to/thearturca/single-payment/donation/495699/target?share=target_link)

## Установка

```bash
npm i vklive-message-client
```

## Пример использования

### Токен

```TS
const authToken: string = process.env.VKPL_OAUTH;

if (!authToken) {
    throw new Error("VKPL_OAUTH is not set");
}

const client = new VKPLMessageClient({ auth: { accessToken: authToken }, channels: [target], debugLog: true });
await client.connect();
await client.sendMessage("Connected to chat!", target);

client.on("message", async (ctx) => {
      if (ctx.message.text.startsWith("!command"))
            await ctx.sendMessage("Hello World");
});

client.on("reward", async (ctx) => {
      if (ctx.reward.name === "reward_name")
          await ctx.sendMessage("Reward received!");
});
```

### Токен + Рефреш токен с сохранением в файл

> [!NOTE]
> У вас должен быть файл `token.json` с содержимым в следующем виде:
>
> ```json
> {
>     "accessToken": "token",
>     "refreshToken": "refreshToken",
>     "expiresAt": 12345,
>     "clientId": "clientId"
> }
> ```
>
> Данные нужно брать из `localStorage` вашего браузера

```TS
const auth = JSON.parse(await fs.promises.readFile("token.json", "utf8")); // должен иметь следующий вид: { accessToken: "token", refreshToken: "refreshToken", expiresAt: 12345, clientId: "clientId" }

const client = new VKPLMessageClient({ auth: auth, channels: [target], debugLog: true });
await client.connect();
await client.sendMessage("Connected to chat!", target);

client.on("message", async (ctx) => {
      if (ctx.message.text.startsWith("!command"))
            await ctx.sendMessage("Hello World");
});

client.on("reward", async (ctx) => {
      if (ctx.reward.name === "reward_name")
          await ctx.sendMessage("Reward received!");
});

client.on("refresh-token", async (ctx) => {
   await fs.promises.writeFile("token.json", JSON.stringify(ctx.auth));
});
```

### Логин и Пароль

> [!CAUTION]
> Данный способ не работает. Лучше использовать токен

```TS
const login: string = process.env.VKPL_LOGIN ?? "";
const password: string = process.env.VKPL_PASSWORD ?? "";

const client = new VKPLMessageClient({ auth: { login, password }, channels: [target], debugLog: true });
await client.connect();
await client.sendMessage("Connected to chat!", target);

client.on("message", async (ctx) => {
      if (ctx.message.text.startsWith("!command"))
            await ctx.sendMessage("Hello World");
});

client.on("reward", async (ctx) => {
      if (ctx.reward.name === "reward_name")
          await ctx.sendMessage("Reward received!");
});
```

### Изменение названия трансляции и категории по командам

```TS
const client = new VKPLMessageClient(...);
await client.connect();

// Команда смены названия. `!название [название трансляции]`
const titleCommand = "!название".toLowerCase();

// Команда смены категории. `!категория [название категории]`
const categoryCommand = "!категория".toLowerCase();

client.on("message", async (ctx) => {
      // Только для модераторов канала
      if (!ctx.user.isChannelModerator)
            return;

      // Проверка на команду смены названия
      if (ctx.message.text.toLowerCase().startsWith(titleCommand)) {
            const newTitle = ctx.message.text.slice(titleCommand.length);

            try {
                  const stream = await ctx.api.setStreamInfo(ctx.channel.blogUrl, {
                        title: newTitle
                  });

                  await ctx.reply(`Название трансляции обновлено: ${stream.data.stream.title}`);

            } catch (error) {
                  console.error(error);
                  await ctx.reply("Ошибка обновления названия трансляции");
            }
      }

      // Проверка на команду смены категории
      if (ctx.message.text.toLowerCase().startsWith(categoryCommand)) {
            const newCategory = ctx.message.text.slice(categoryCommand.length);

            try {
                  const stream = await ctx.api.setCategory(ctx.channel.blogUrl, newCategory);

                  await ctx.reply(`Категория обновлена: ${stream.data.stream.category.title}`);
            } catch (error) {
                  console.error(error);
                  await ctx.reply("Ошибка обновления категории");
            }
      }
});
```

## Фичи

### Readonly режим

В режиме readonly нельзя отправлять сообщения, но можно получать их.
Для активации этого режима нужно в поле auth написать `"readonly"` или не передавать параметр `auth` вообще.

```TS
const client = new VKPLMessageClient({ auth: "readonly", channels: [target], debugLog: true });
await client.connect(); // После подключения все сообщения будут выводится в консоль
```

### Вставка ссылок

В боте есть возможность вставки ссылок в текст сообщения. Доступно 2 формата ссылок:

- Прямая ссылка. Пример: `https://github.com/thearturca/vkplay-live-message-client`
- Ссылка в стиле markdown. Пример: `[Ссылка](https://github.com/thearturca/vkplay-live-message-client)`

Ссылка в стиле markdown будет выглядеть следующим образом:

[Ссылка](https://github.com/thearturca/vkplay-live-message-client)

#### Пример вставки ссылки

```TS
const client = new VKPLMessageClient({ auth: { accessToken: authToken }, channels: [target], debugLog: true });
await client.connect();

// отправки прямой ссылки
await client.sendMessage("Ссылка на мой гитхаб: https://github.com/thearturca/vkplay-live-message-client", target);

// отправки ссылки в стиле markdown
await client.sendMessage("[Ссылка на мой гитхаб](https://github.com/thearturca/vkplay-live-message-client)", target);
```

### Получение наград

Возможность получение уведомление об активации награды зрителем.

```TS
const client = new VKPLMessageClient({ auth: { accessToken: authToken }, channels: [target], debugLog: true });
await client.connect();

client.on("reward", async (ctx) => {
      if (ctx.reward.name === "reward_name")
          await ctx.sendMessage("Reward received!");
});
```

### Статус стрима

Возможность получить событие о запуске/остановке стрима.

```TS
const client = new VKPLMessageClient({ auth: { accessToken: authToken }, channels: [target], debugLog: true });
await client.connect();

client.on("stream-status", async (ctx) => {
      if (ctx.type === "stream_start")
          await ctx.sendMessage("Stream started!");

      if (ctx.type === "stream_end")
          await ctx.sendMessage("Stream stopped!");
});
```

### Информация о канале

Возможность получать изменения в информации о канале, такие как название, категория, зрители и т.д.

```TS
const client = new VKPLMessageClient({ auth: { accessToken: authToken }, channels: [target], debugLog: true });
await client.connect();

client.on("channel-info", async (ctx) => {
      await ctx.sendMessage(`Current viewers: ${ctx.viewers}`);
});
```
