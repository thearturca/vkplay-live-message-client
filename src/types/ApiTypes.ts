
export namespace APITypes
{
  export type TTokenResponse = { token?: string }
  export type TBlogResponse = 
  { 
    publicWebSocketChannel: string,
    owner: TUser,
    blogUrl: string
  };
  export type TSmilesResponse = {data: {sets: TSmilesSet[]}}
  
  export type  TSmilesSet = {
    type: string,
    smiles: TSmile[]
  }
  
  export type TBadge = { 
    achievement: { name: string, type: string }, 
    id: string, 
    isCreated: boolean, 
    largeUrl: string, 
    mediumUrl: string, 
    name: string, 
    smallUrl: string
  };
  
  export type TAuthor = {
    badges: TBadge[],
    createdAt: number,
    isChatModerator: boolean,
  } & TUser;
  
  export type TUser = {
    displayName: string,
    id: number,
    name: string,
    hasAvatar: boolean,
    avatarUrl: string,
    nick: string
  };
  
  export type TMessageBlockText = {
    content: string,
    modificator: string,
    type: 'text' | string,
  };
  export type TMessageBlockMention = {
    id: number,
    type: 'mention',
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
  
  export type TMessageBlock = TMessageBlockText | TMessageBlockSmile | TMessageBlockMention;
  
  export type TNewMessage = 
  { 
    result: 
    { 
      channel: string, 
      data: 
      {
        data:
        {
          data: 
          {
            author: TAuthor,
            createdAt: number,
            data: TMessageBlock[],
            id: number,
            style: unknown[],
            user: TUser,
            isPrivate: boolean
          },
          type: 'message' | string
        },
        offset: number
      }
    } 
  }
}
