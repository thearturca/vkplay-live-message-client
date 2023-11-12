# VKplay live chat API client

**Это пре-альфа версия, здесь не реализован механизм обновления токена, и не протестировано на продолжительном подключении к вебсокету. Возможны вылеты и ошибки. Баги присылать сюда https://github.com/thearturca/vkplay-live-message-client/issues**

### Описание

Эта библиотека поможет вам подключиться к чату канала стримера на стриминговой площадке vkplay.live, и получать/отправлять сообщения с парсингом смайлов, создавать чат-ботов или клиенты для чатов. Чаты работают даже когда стримера нет в сети.

### Авторизация
Для отправки сообщений нужно указать токен vkplay.live, либо авторизационные данные для входа (логин и пароль). 
Так как ещё нет легального удобного способа получить токен, его нужно взять из localStorage вашего браузера, если вы уже залогинены. Находиться в поле `auth`. Лучше всего создать новый аккаунт для бота. Если вы знаете, как достать токен, сообщите мне в discord. 

`Discord для вопросов: thearturca`

### Установка

```bash
npm i vklive-message-client
```

### Пример использования

#### Токен
```TS            
const authToken: string = process.env.VKPL_OAUTH ?? "";

const client = new VKPLMessageClient({ auth: { token: authToken }, channels: [target], debugLog: true });
await client.connect();
await client.sendMessage("Connected to chat!", target);

client.on("message", async (context) =>{
      if (context.message.text.startsWith("!command"))
            await context.sendMessage("Hello World");
});
```

#### Логин и Пароль
```TS
const login: string = process.env.VKPL_LOGIN ?? "";
const password: string = process.env.VKPL_PASSWORD ?? "";

const client = new VKPLMessageClient({ auth: { login, password }, channels: [target], debugLog: true });
await client.connect();
await client.sendMessage("Connected to chat!", target);

client.on("message", async (context) =>{
      if (context.message.text.startsWith("!command"))
            await context.sendMessage("Hello World");
});
```
