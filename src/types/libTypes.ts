import { APITypes } from "./ApiTypes.js";

export namespace TVKPLMessageClient {
      export type Smile = { id: string, name: string }
      export type Config = {
            channels: string[],
            auth?: {
                  token: string,
            } | {
                  login: string,
                  password: string
            } | "readonly",
            wsServer?: string,
            debugLog?: boolean
      };

      export type Channel = {
            blogUrl: string,
            publicWebSocketChannel: string,
            name: string,
            id: number
      };

      export type ParentMessage = {
            message: DeserializedMessage,
            user: User,
            id: number,
            isPrivate: boolean
      };

      export type ChatMessage = {
            parent?: ParentMessage,
            message: DeserializedMessage,
            user: User,
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

      export type User = {
            id: number,
            isChatModerator: boolean,
            badges: Badge[],
            roles: Role[],
            name: string,
            nick: string,
            displayName: string,
            hasAvatar: boolean,
            avatarUrl: string,
            isOwner: boolean,
            vkplayProfileLink: string
            nickColor: number,
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

      export type MessageEvent = (messageContext: MessageEventContext) => void;

      export type MessageEventContext = ChatMessage & {
            sendMessage(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>,
            reply(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>
            replyToThread(text: string, mentionUsers?: number[]): Promise<APITypes.TMessageResponse>,
      };


}
