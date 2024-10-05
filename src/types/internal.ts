import { VkplApi } from "../services/VkplApi.js";
import { APITypes } from "./api.js";
import { VkWsTypes } from "./api.v2.js";

export namespace VKPLClientInternal {
    export type Smile = { id: string; name: string };

    export type AccessTokenAuth = {
        accessToken: string;
    };

    export type WithRefreshToken<T extends Record<string, unknown>> = {
        refreshToken: string;
        expiresAt: number;
        clientId: string;
    } & T;

    export type TokenAuth = AccessTokenAuth | WithRefreshToken<AccessTokenAuth>;

    /**
     * @deprecated Vkpl усложнил процесс получения токена по логину и паролю. Поэтому данный функционал временно не работает.
     * При попытке использовать эту функцию, будет выдана ошибка.
     */
    export type LoginAuth = {
        login: string;
        password: string;
    };

    export type ReadonlyAuth = "readonly" | undefined;

    export type Auth = TokenAuth | LoginAuth | ReadonlyAuth;

    export type Config<T extends string> = {
        channels: T[];
        auth: Auth;
        wsServer?: string;
        debugLog?: boolean;
        log?: boolean;
    };

    export type Channel = {
        blogUrl: string;
        publicWebSocketChannel: string;
        name: string;
        id: number;
    };

    export type ParentMessage = {
        message: DeserializedMessage;
        user: VkWsTypes.ChatUser;
        id: number;
        isPrivate: boolean;
    };

    export type ChatMessage = {
        parent?: ParentMessage;
        message: DeserializedMessage;
        user: VkWsTypes.ChatUser;
        channel: Channel;
        createdAt: number;
        id: number;
        isPrivate: boolean;
    };

    export type DeserializedMessage = {
        text: string;
        smiles: Smile[];
        mentions: Mention[];
        links: Link[];
    };

    export type Link = {
        text: string;
        url: string;
    };

    export type Mention = {
        userId: number;
        name?: string;
        displayName?: string;
        nick?: string;
    };

    export type Role = {
        id: string;
        name: string;
        priority: number;
        smallUrl: string;
        mediumUrl: string;
        largeUrl: string;
    };

    export type Badge = {
        achievement: { name: string; type: string };
        id: string;
        isCreated: boolean;
        largeUrl: string;
        mediumUrl: string;
        name: string;
        smallUrl: string;
    };

    export type StreamInfo = {
        title: string;
        categoryId: string;
        plannedAt: Date;
        donationAlertNick: string;
        subscriptionLevelId: string;
    };

    export type Context<Channel extends string> = {
        api: VkplApi<Channel>;
    };

    export type MessageEvent<Channel extends string> = [
        ctx: MessageEventContext<Channel>,
    ];

    export type MessageEventContext<Channel extends string> = Context<Channel> &
        ChatMessage & {
            /**
             * Отправить сообещние в канал
             */
            sendMessage(
                text: string,
                mentionUsers?: number[],
            ): Promise<APITypes.TMessageResponse>;
            /**
             * Отметить пользователя в сообщении, и отправить его
             */
            reply(
                text: string,
                mentionUsers?: number[],
            ): Promise<APITypes.TMessageResponse>;
            /**
             * Отправить сообщение в тред
             */
            replyToThread(
                text: string,
                mentionUsers?: number[],
            ): Promise<APITypes.TMessageResponse>;
        };

    export type RewardMessage = {
        /**
         * Полученная награда
         */
        reward: VkWsTypes.Reward & {
            /**
             * Сообщение к награде
             */
            message?: DeserializedMessage;
            /**
             * Статус награды
             */
            status: VkWsTypes.RewardStatus;
        };
        /**
         * Канал, в котором была получена награда
         */
        channel: Channel;
        /**
         * Пользователь, который получил награду
         */
        user: VkWsTypes.User;
    };

    export type RewardEvent<Channel extends string> = [
        ctx: RewardEventContext<Channel>,
    ];

    export type RewardEventContext<Channel extends string> = Context<Channel> &
        RewardMessage & {
            /**
             * Отправить сообещние в канал
             */
            sendMessage(
                text: string,
                mentionUsers?: number[],
            ): Promise<APITypes.TMessageResponse>;
            /**
             * Отметить пользователя в сообщении, и отправить его
             */
            reply(
                text: string,
                mentionUsers?: number[],
            ): Promise<APITypes.TMessageResponse>;
        };

    export type ChannelInfoEvent<Channel extends string> = [
        ctx: ChannelInfoEventContext<Channel>,
    ];

    export type ChannelInfoEventContext<Channel extends string> =
        Context<Channel> &
            VkWsTypes.ChannelInfo & {
                /**
                 * Отправить сообещние в канал
                 */
                sendMessage(
                    text: string,
                    mentionUsers?: number[],
                ): Promise<APITypes.TMessageResponse>;
            };

    export type StreamStatusEvent<Channel extends string> = [
        ctx: StreamStatusEventContext<Channel>,
    ];

    export type StreamStatusEventContext<Channel extends string> =
        Context<Channel> &
            VkWsTypes.StreamStatus & {
                /**
                 * Отправить сообещние в канал
                 */
                sendMessage(
                    text: string,
                    mentionUsers?: number[],
                ): Promise<APITypes.TMessageResponse>;
            };

    export type RefreshTokenEvent<Channel extends string> = [
        ctx: RefreshTokenEventContext<Channel>,
    ];

    export type RefreshTokenEventContext<Channel extends string> =
        Context<Channel> & {
            auth: TokenAuth;
        };

    export type StreamLikeCounterEventContext<Channel extends string> =
        Context<Channel> &
            VkWsTypes.StreamLikeCounter & {
                /**
                 * Отправить сообещние в канал
                 */
                sendMessage(
                    text: string,
                    mentionUsers?: number[],
                ): Promise<APITypes.TMessageResponse>;
            };

    export type StreamLikeCounterEvent<Channel extends string> = [
        ctx: StreamLikeCounterEventContext<Channel>,
    ];

    export type FollowerEventContext<Channel extends string> =
        Context<Channel> &
            VkWsTypes.ActionsJournalFollower & {
                /**
                 * Отправить сообещние в канал
                 */
                sendMessage(
                    text: string,
                    mentionUsers?: number[],
                ): Promise<APITypes.TMessageResponse>;
            };

    export type FollowerEvent<Channel extends string> = [
        ctx: FollowerEventContext<Channel>,
    ];
}
