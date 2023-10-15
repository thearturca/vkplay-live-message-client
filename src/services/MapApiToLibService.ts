import { APITypes } from "../types/ApiTypes.js";
import { TVKPLMessageClient } from "../types/libTypes.js";
import { MessageService } from "./MessageService.js";

export class MapApiToLib {
      public static mapTBlogResponseToChannel(blog: APITypes.TBlogResponse): TVKPLMessageClient.Channel {
            return { blogUrl: blog.blogUrl, id: blog.owner.id, name: blog.owner.name, publicWebSocketChannel: blog.publicWebSocketChannel.split(":")[1] }
      }

      public static mapTNewMessageToChatMessage(newMessage: APITypes.TNewMessage, channel: TVKPLMessageClient.Channel): TVKPLMessageClient.ChatMessage {
            const newMessageAuthor: APITypes.TAuthor = newMessage.data.data.data.author;
            const newMessageUser: APITypes.TUser = newMessage.data.data.data.user;
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
                  createdAt: newMessage.data.data.data.createdAt,
                  id: newMessage.data.data.data.id,
                  isPrivate: newMessage.data.data.data.isPrivate,
                  message: MessageService.deserializeMessage(newMessage.data.data.data.data)
            };
      }
}
