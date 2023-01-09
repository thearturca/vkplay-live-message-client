
export namespace TVKPLMessageClient
{
      export type Smile = { id: string, name: string }
      export type Config = 
      {
            channels: string[],
            authToken: string,
            wsServer?: string,
            debugLog?: boolean
      };

      export type Channel = 
      {
            blogUrl: string,
            publicWebSocketChannel: string,
            name: string,
            id: number
      };

      export type ChatMessage =
      {
            message: DeserializedMessage,
            user: User,
            channel: Channel,
            createdAt: number,
            id: number,
            isPrivate: boolean
      };

      export type DeserializedMessage = { text: string, smiles: Smile[], mention?:  Mention};

      export type Mention = { userId: number, name?: string, displayName?: string, nick?: string };

      export type User =
      {
            id: number,
            isChatModerator: boolean,
            badges: Badge[],
            name: string,
            nick: string,
            displayName: string,
            hasAvatar: boolean,
            avatarUrl: string,
      }

      export type Badge = 
      { 
            achievement: { name: string, type: string }, 
            id: string, 
            isCreated: boolean, 
            largeUrl: string, 
            mediumUrl: string, 
            name: string, 
            smallUrl: string
      };

      export type MessageEvent = (messageContext: MessageEventContext) => void;

      export type MessageEventContext = ChatMessage & { sendMessage(text: string): Promise<void>, reply(text: string): Promise<void> };

      
}
