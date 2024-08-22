import { EventEmitter } from "eventemitter3";

import { CentrifugeClient } from "./services/CentrifugeClient.js";
import { MapApiToClient } from "./services/MapApiToLibService.js";
import { VkplApi } from "./services/VkplApi.js";
import { VkplMessageParser } from "./services/VkplMessageParser.js";
import { APITypes } from "./types/api.js";
import { VkWsTypes } from "./types/api.v2.js";
import { VKPLClientInternal } from "./types/internal.js";

type VKPLMessageClientEventMap<Channel extends string> = {
    /**
     * Событие о новом сообщении в каналах трансляции
     */
    message: VKPLClientInternal.MessageEvent<Channel>;
    /**
     * Событие о получение награды за баллы канала
     */
    reward: VKPLClientInternal.RewardEvent<Channel>;
    /**
     * Событие о получении информации о канале таких как название, категория, зрители и т.д.
     */
    "channel-info": VKPLClientInternal.ChannelInfoEvent<Channel>;
    /**
     * Событие о получении статуса канала. Если начался трансляция или остановилась
     */
    "stream-status": VKPLClientInternal.StreamStatusEvent<Channel>;

    /**
     * Событие о получении нового токена. Понадобится для сохранения нового токена, и восстановления работы бота без надобности идти на сайт
     */
    "refresh-token": VKPLClientInternal.RefreshTokenEvent<Channel>;
};

/**
 * @property {string} channels - Список каналов
 * @property {Map} availableSmiles - Список доступных смайлов для акаунта бота
 *
 * Клиента для чата VKPlay Live. Позволяет получать и отправлять сообщения в чат трансляции.
 * Поддерживает несколько каналов, отправку сообщений по каждому из них, добавление упоминаний пользователей, отправку в ветку сообщений.
 *
 * @example
 * const login: string = process.env.VKPL_LOGIN ??;
 * const password: string = process.env.VKPL_PASSWORD;
 * const target: string = process.env.VKPL_TARGET;
 *
 * const client = new VKPLMessageClient({ auth: { login, password }, channels: [target], debugLog: true });
 * await client.connect();
 * await client.sendMessage(target, "Connected to chat!");
 *
 * client.on("message", async (ctx) =>{
 *     if (ctx.message.text.startsWith("!command"))
 *           await ctx.replyToThread("Hello World");
 * });
 */
class VKPLMessageClient<T extends string> extends EventEmitter<
    VKPLMessageClientEventMap<T>
> {
    private wsServerUrl: string =
        "wss://pubsub.live.vkplay.ru/connection/websocket?cf_protocol_version=v2";

    private auth?: VKPLClientInternal.TokenAuth;
    private credentials?: VKPLClientInternal.LoginAuth;

    /**
     * @property debugLog - Если true, то будет выводить логи вебсокета и API в консоль
     */
    public static debugLog: boolean;

    private centrifugeClient: CentrifugeClient<T>;
    private messageParser: VkplMessageParser;

    private channelNames: T[];

    /**
     * @property channels - Список каналов
     */
    public channels: VKPLClientInternal.Channel[] = [];

    /**
     * @availableSmiles - Список доступных смайлов для акаунта бота
     */
    public availableSmiles: Map<string, string> = new Map();

    public api: VkplApi<T>;

    constructor(private config: VKPLClientInternal.Config<T>) {
        super();

        VKPLMessageClient.debugLog = config.debugLog ?? false;

        if (config.auth && config.auth !== "readonly") {
            if ("accessToken" in config.auth) {
                this.auth = config.auth;
            }

            if ("login" in config.auth) {
                throw new TypeError(
                    "VKPLMessageClient: login and password are deprecated. Use accessToken instead",
                );
            }
        }

        this.messageParser = new VkplMessageParser(this.availableSmiles);
        this.api = new VkplApi(this.messageParser, this.auth);
        this.api.on("refreshed", (token) => this.onRefreshToken(token));
        this.channelNames = config.channels;
        this.wsServerUrl = config.wsServer ?? this.wsServerUrl;
        this.centrifugeClient = new CentrifugeClient(
            this.wsServerUrl,
            this.api,
        );

        this.centrifugeClient.on("message", (message) =>
            this.onMessage(message),
        );
        this.centrifugeClient.on("reward", (data) => this.onReward(data));
        this.centrifugeClient.on("channel-info", (data) =>
            this.onChannelInfo(data),
        );
        this.centrifugeClient.on("stream-status", (data) =>
            this.onStreamStatus(data),
        );
        this.centrifugeClient.on("reconnect", () => this.onReconnect());
    }

    private onRefreshToken(token: VKPLClientInternal.TokenAuth): void {
        this.auth = token;

        const ctx: VKPLClientInternal.RefreshTokenEventContext<T> = {
            auth: token,
            api: this.api,
        };

        this.emit("refresh-token", ctx);
    }

    private onMessage(
        message: VkWsTypes.WsMessage<VkWsTypes.ChatMessage>,
    ): void {
        const channelId = message.push.channel.split(":")[1];

        if (!channelId) {
            return;
        }

        const channel: VKPLClientInternal.Channel | undefined =
            this.findChannelById(channelId);

        // skip message since we are not subscribed to this channel
        if (!channel) {
            return;
        }

        const mappedMessage: VKPLClientInternal.ChatMessage =
            MapApiToClient.chatMessageFromApi(message.push.pub.data, channel);
        const ctx: VKPLClientInternal.MessageEventContext<T> = {
            ...mappedMessage,
            sendMessage: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(
                    text,
                    mappedMessage.channel.blogUrl as T,
                    mentionUsers,
                ),
            reply: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(
                    text,
                    mappedMessage.channel.blogUrl as T,
                    mentionUsers
                        ? [...mentionUsers, mappedMessage.user.id]
                        : [mappedMessage.user.id],
                ),
            replyToThread: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(
                    text,
                    mappedMessage.channel.blogUrl as T,
                    mentionUsers,
                    mappedMessage.id,
                ),
            api: this.api,
        };
        this.emit("message", ctx);
        console.log(
            `[chat:${channel.blogUrl}] ${mappedMessage.user.nick}: ${mappedMessage.message.text}`,
        );
    }

    private onReward(
        message: VkWsTypes.WsMessage<VkWsTypes.CpRewardDemandMessage>,
    ): void {
        const channelId = message.push.channel.split(":")[1];

        if (!channelId) {
            return;
        }

        const channel: VKPLClientInternal.Channel | undefined =
            this.findChannelById(channelId);

        // skip message since we are not subscribed to this channel
        if (!channel) {
            return;
        }

        const reward: VKPLClientInternal.RewardMessage =
            MapApiToClient.rewardMessageFromApi(message.push.pub.data, channel);
        const ctx: VKPLClientInternal.RewardEventContext<T> = {
            ...reward,
            sendMessage: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(
                    text,
                    reward.channel.blogUrl as T,
                    mentionUsers,
                ),
            reply: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(
                    text,
                    reward.channel.blogUrl as T,
                    mentionUsers
                        ? [...mentionUsers, reward.user.id]
                        : [reward.user.id],
                ),
            api: this.api,
        };
        this.emit("reward", ctx);
        console.log(
            `[reward:${channel.blogUrl}] ${reward.user.nick} reedemed reward: "${reward.reward.name}" ${reward.reward.message ? `with text "${reward.reward.message.text}"` : ""}`,
        );
    }

    private onChannelInfo(
        message: VkWsTypes.WsMessage<VkWsTypes.ChannelInfo>,
    ): void {
        const channelId = message.push.channel.split(":")[1];

        if (!channelId) {
            return;
        }

        const channel: VKPLClientInternal.Channel | undefined =
            this.findChannelById(channelId);

        // skip message since we are not subscribed to this channel
        if (!channel) {
            return;
        }

        const channelInfo = message.push.pub.data;
        const ctx: VKPLClientInternal.ChannelInfoEventContext<T> = {
            ...channelInfo,
            api: this.api,
            sendMessage: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(text, channel.blogUrl as T, mentionUsers),
        };

        this.emit("channel-info", ctx);
        console.log(
            `[channelInfo:${channel.blogUrl}] viewers: ${channelInfo.viewers}, isOnline: ${channelInfo.isOnline}, streamId: ${channelInfo.streamId}`,
        );
    }

    private onStreamStatus(
        message: VkWsTypes.WsMessage<VkWsTypes.StreamStatus>,
    ): void {
        const channelId = message.push.channel.split(":")[1];

        if (!channelId) {
            return;
        }

        const channel: VKPLClientInternal.Channel | undefined =
            this.findChannelById(channelId);

        // skip message since we are not subscribed to this channel
        if (!channel) {
            return;
        }

        const streamStatus = message.push.pub.data;
        const ctx: VKPLClientInternal.StreamStatusEventContext<T> = {
            ...streamStatus,
            api: this.api,
            sendMessage: async (text: string, mentionUsers?: number[]) =>
                this.api.sendMessage(text, channel.blogUrl as T, mentionUsers),
        };

        this.emit("stream-status", ctx);
        console.log(
            `[streamStatus:${channel.blogUrl}] ${streamStatus.type}, videoId: ${streamStatus.videoId}`,
        );
    }

    private async onReconnect(): Promise<void> {
        await this.connectToChats();
    }

    /**
     * @param id - Идентификатор
     *
     * Возвращает данные канала c API по имени.
     * Поск происходит по каналам, указанным в конфиге
     */
    public findChannelById(id: string): VKPLClientInternal.Channel | undefined {
        return this.channels.find(
            (channel) => channel.publicWebSocketChannel === id,
        );
    }

    /**
     * @param name - Имя канала
     *
     * Возвращает данные канала c API по имени.
     * Поск происходит по каналам, указанным в конфиге
     */
    public findChannelByName(
        name: string,
    ): VKPLClientInternal.Channel | undefined {
        return this.channels.find((channel) => channel.blogUrl === name);
    }

    private async connectToChats(): Promise<void> {
        for (const channel of this.channels) {
            try {
                await this.centrifugeClient.connectToChat(channel);
                await this.centrifugeClient.connectToChannelInfo(channel);

                if (!this.auth) {
                    continue;
                } // can't connect to rewards without token

                const wsSubscribeToken =
                    await this.api.getWebSocketSubscriptionToken([
                        channel.publicWebSocketChannel as T,
                    ]);

                if (!wsSubscribeToken.data.tokens.length) {
                    throw new Error(`Failed to obtain websocket subscribe token for reward channel: ${channel.blogUrl}
Connect to reward channel will be skipped`);
                }

                await this.centrifugeClient.connectToReedem(
                    channel,
                    wsSubscribeToken.data.tokens[0]?.token ?? "",
                );
            } catch (error) {
                console.error(error);
            }
        }
    }

    private async obtainToken(): Promise<void> {
        if (!this.credentials) {
            throw new TypeError("Credentials must be provided to obtain token");
        }

        const token = await VkplApi.login(
            this.credentials.login,
            this.credentials.password,
        );

        if (token.accessToken) {
            this.auth = token;
            this.api.auth = token;
        }
    }

    /**
     * Подключает бота к каналам, которые были переданы в конфиг
     * Необходимо вызвать этот метод, если вы хотите, чтобы бот получал сообщения
     */
    public async connect(): Promise<void> {
        if (!this.auth && this.credentials) {
            await this.obtainToken();
        }

        for (const channelName of this.channelNames) {
            const channel: VKPLClientInternal.Channel =
                MapApiToClient.channelFromBlogResponse(
                    await this.api.getBlog(channelName),
                );
            this.channels.push(channel);
        }

        if (this.config.auth !== "readonly") {
            await this.populateMessageParserWithSmiles();
        }

        await this.centrifugeClient.connect();
        await this.connectToChats();
    }

    public disconnect(): void {
        this.centrifugeClient.disconnect();
        this.centrifugeClient.removeAllListeners();
    }

    private async populateMessageParserWithSmiles(): Promise<void> {
        if (this.auth) {
            const channel = this.channels[0];

            if (!channel) {
                return;
            }

            const smilesSet: APITypes.TSmilesResponse =
                await this.api.getSmilesSet(channel.blogUrl as T);

            if (VKPLMessageClient.debugLog)
                console.warn(
                    "[debug:chat] Get smiles set",
                    JSON.stringify(smilesSet, null, 5),
                );

            for (const set of smilesSet.data.sets)
                for (const smile of set.smiles)
                    this.availableSmiles.set(smile.name, smile.id);
        } else {
            throw new Error(
                "[chat] Cannot get list of smiles because of no auth token nor channels provided",
            );
        }
    }

    /**
     * @param message - Сообщение
     * @param channel - Канал
     * @param mentionUserId - ID пользователей, которые должны быть упомянуты в сообщении
     * @param threadId - ID сообщения, если нужно ответить в конкретной ветке
     * @return {Promise<APITypes.TMessageResponse>} Ответ API на сообщение
     *
     * Позволяет отправлять сообщение в чат трансляции без подключения к чату. Нужно лишь указать канал, куда будет отправлено сообщение
     *
     * @deprecated Используйте `client.api.sendMessage` вместо `client.sendMessage`
     */
    public async sendMessage(
        message: string,
        channel: T,
        mentionUserId?: number[],
        threadId?: number,
    ): Promise<APITypes.TMessageResponse> {
        if (!this.config.auth || this.config.auth === "readonly") {
            throw new Error(
                "You must provide auth token or credentials. Current mode is readonly",
            );
        }

        if (!this.auth) {
            throw new Error("You must provide auth token or credentials");
        }

        return this.api.sendMessage(message, channel, mentionUserId, threadId);
    }
}

export default VKPLMessageClient;
