import { VkplApi } from "../services/VkplApi.js";
import { APITypes } from "./api.js";
import { VkWsTypes } from "./api.v2.js";

export namespace VKPLClientInternal {
      export type Smile = { id: string, name: string }

      export type AccessTokenAuth = {
            accessToken: string,
      }

      export type WithRefreshToken<T extends Record<string, unknown>> = {
            refreshToken: string,
            expiresAt: number,
      } & T;

      export type TokenAuth = AccessTokenAuth | WithRefreshToken<AccessTokenAuth>;

      /**
       * @deprecated Vkpl усложнил процесс получения токена по логину и паролю. Поэтому данный функционал временно не работает.
       * При попытке использовать эту функцию, будет выдана ошибка.
       */
      export type LoginAuth = {
            login: string,
            password: string
      }

      export type ReadonlyAuth = "readonly" | undefined;

      export type Auth = TokenAuth | LoginAuth | ReadonlyAuth;

      export type Config<T extends string> = {
            channels: T[],
            auth: Auth,
            wsServer?: string,
            debugLog?: boolean,
      };

      export type Channel = {
            blogUrl: string,
            publicWebSocketChannel: string,
            name: string,
            id: number
      };

      export type ParentMessage = {
            message: DeserializedMessage,
            user: VkWsTypes.ChatUser,
            id: number,
            isPrivate: boolean
      };

      export type ChatMessage = {
            parent?: ParentMessage,
            message: DeserializedMessage,
            user: VkWsTypes.ChatUser,
            channel: Channel,
            createdAt: number,
            id: number,
            isPrivate: boolean
      };

      export type DeserializedMessage = {
            text: string,
            smiles: Smile[],
            mentions: Mention[],
            links: Link[],
      };

      export type Link = {
            text: string,
            url: string
      }

      export type Mention = {
            userId: number,
            name?: string,
            displayName?: string,
            nick?: string
      };

      export type Role = {
            id: string,
            name: string,
            priority: number,
            smallUrl: string,
            mediumUrl: string
            largeUrl: string,
      }

      export type Badge = {
            achievement: { name: string, type: string },
            id: string,
            isCreated: boolean,
            largeUrl: string,
            mediumUrl: string,
            name: string,
            smallUrl: string
      };

      export type Context = {
            api: VkplApi,
      }

      export type MessageEvent = (messageContext: MessageEventContext) => void;

      export type MessageEventContext = Context & ChatMessage & {
            /**
            * Отправить сообещние в канал
            */
            sendMessage(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>,
            /**
            * Отметить пользователя в сообщении, и отправить его
            */
            reply(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>
            /**
            * Отправить сообщение в тред
            */
            replyToThread(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>,
      };

      export type RewardMessage = {
            /**
             * Полученная награда
             */
            reward: VkWsTypes.Reward & {
                  /**
                   * Сообщение к награде
                   */
                  message?: DeserializedMessage
                  /**
                   * Статус награды
                   */
                  status: VkWsTypes.RewardStatus,
            },
            /**
             * Канал, в котором была получена награда
             */
            channel: Channel,
            /**
             * Пользователь, который получил награду
             */
            user: VkWsTypes.User
      };

      export type RewardEvent = (rewardContext: RewardEventContext) => void;

      export type RewardEventContext = Context & RewardMessage & {
            /**
            * Отправить сообещние в канал
            */
            sendMessage(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>,
            /**
            * Отметить пользователя в сообщении, и отправить его
            */
            reply(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>
      }
}
