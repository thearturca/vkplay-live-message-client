
export namespace APITypes {
      export type TTokenResponse = { token?: string }

      export type AuthResponse = {
            accessToken: string,
            refreshToken: string,
            expiresAt: number
      }
      export type TBlogResponse = {
            publicWebSocketChannel: string,
            owner: TUser,
            blogUrl: string
      };
      export type TSmilesResponse = { data: { sets: TSmilesSet[] } }

      export type TSmilesSet = {
            type: string,
            smiles: TSmile[]
      }

      export type TBadge = {
            achievement: { name: string, type: string },
            id: string,
            isCreated: boolean,
            largeUrl: string,
            mediumUrl: string,
            smallUrl: string,
            name: string,
      };

      export type TRole = {
            id: string,
            name: string
            smallUrl: string,
            largeUrl: string,
            mediumUrl: string,
            priority: number,
      }

      export type TAuthor = {
      } & TUser;

      export type TUser = {
            badges: TBadge[],
            roles: TRole[],
            createdAt: number,
            isOwner: boolean,
            isVerifiedStreamer: boolean,
            vkplayProfileLink: string,
            isChatModerator: boolean,
            displayName: string,
            id: number,
            name: string,
            hasAvatar: boolean,
            avatarUrl: string,
            nick: string
            nickColor: number,
      };

      export type TMessageBlockText = {
            content: string,
            modificator: string,
            type: 'text' | string,
      };
      export type TMessageBlockMention = {
            displayName?: string,
            name?: string,
            nick?: string,
            id: number,
            type: 'mention',
      };

      export type TMessageBlockLink = {
            content: string,
            explicit: boolean,
            type: 'link',
            url: string,
      };

      export type TContentParsed = [string, "unstyled" | string, []];

      export type TSmile = {
            smallUrl?: string,
            mediumUrl?: string,
            largeUrl?: string,
            isAnimated?: boolean,
            id: string,
            name: string,
      }

      export type TMessageBlockSmile = {
            type: 'smile',
      } & TSmile;

      export type TMessageBlock = TMessageBlockText | TMessageBlockSmile | TMessageBlockMention | TMessageBlockLink;

      export type TParentMessage = {
            isPrivate: boolean,
            data: TMessageBlock[],
            createdAt: number,
            author: TAuthor,
            id: number,
      }

      export type TMessageResponse = {
            author: TAuthor,
            createdAt: number,
            data: TMessageBlock[],
            id: number,
            style: unknown[],
            user: TUser,
            isPrivate: boolean
            parent?: TParentMessage,
      };

      export type TNewMessage = {
            channel: string,
            data: {
                  data: {
                        data: TMessageResponse,
                        type: 'message' | string
                  },
                  offset: number
            }
      }

      export type ConnectionResponse = {
            client: string,
            version: string,
            expires: boolean,
            ttl: number,
      }

      export type WsMessage<T> = {
            id: number,
            result: T,
      }
}
