import { APITypes } from "../types/ApiTypes";
import { TVKPLMessageClient } from "../types/libTypes";
import { MessageService } from "./MessageService.js";

export class MapApiToLibService
{
      public static mapTBlogResponseToChannel(blog: APITypes.TBlogResponse): TVKPLMessageClient.Channel
      {
            return { blogUrl: blog.blogUrl, id: blog.owner.id, name: blog.owner.name, publicWebSocketChannel: blog.publicWebSocketChannel.split(":")[1] }
      }

      public static mapTNewMessageToChatMessage(newMessage: APITypes.TNewMessage, channel: TVKPLMessageClient.Channel): TVKPLMessageClient.ChatMessage
      {
            const newMessageAuthor: APITypes.TAuthor = newMessage.result.data.data.data.author;
            const newMessageUser: APITypes.TUser = newMessage.result.data.data.data.user;
            return {
                  channel,
                  user: 
                  {
                        badges: newMessageAuthor.badges,
                        avatarUrl: newMessageUser.avatarUrl,
                        displayName: newMessageUser.displayName,
                        hasAvatar: newMessageUser.hasAvatar,
                        id: newMessageAuthor.id,
                        isChatModerator: newMessageAuthor.isChatModerator,
                        name: newMessageUser.name,
                        nick: newMessageUser.nick
                  },
                  createdAt: newMessage.result.data.data.data.createdAt,
                  id: newMessage.result.data.data.data.id,
                  isPrivate: newMessage.result.data.data.data.isPrivate,
                  message: MessageService.deserializeMessage(newMessage.result.data.data.data.data)
            };
      }
}