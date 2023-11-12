import { APITypes } from "../types/ApiTypes.js";
import { TVKPLMessageClient } from "../types/libTypes.js";
import { MessageService } from "./MessageService.js";

export class MapApiToLib {
      public static mapTBlogResponseToChannel(blog: APITypes.TBlogResponse): TVKPLMessageClient.Channel {
            return { blogUrl: blog.blogUrl, id: blog.owner.id, name: blog.owner.name, publicWebSocketChannel: blog.publicWebSocketChannel.split(":")[1] }
      }

      static mapTParentMessageToChatMessage(newMessage: APITypes.TParentMessage): TVKPLMessageClient.ParentMessage {
            return {
                  id: newMessage.id,
                  isPrivate: newMessage.isPrivate,
                  user: MapApiToLib.mapTAuthorToUser(newMessage.author),
                  message: MessageService.deserializeMessage(newMessage.data),
            }

      }

      public static mapTNewMessageToChatMessage(newMessage: APITypes.TNewMessage, channel: TVKPLMessageClient.Channel): TVKPLMessageClient.ChatMessage {
            const newMessageAuthor: APITypes.TAuthor = newMessage.data.data.data.author;
            const newMessageParent: APITypes.TParentMessage | undefined = newMessage.data.data.data.parent;
            const mappedParentMessage: TVKPLMessageClient.ParentMessage | undefined = newMessageParent
                  ? MapApiToLib.mapTParentMessageToChatMessage(newMessageParent)
                  : undefined;

            return {
                  channel,
                  user: MapApiToLib.mapTAuthorToUser(newMessageAuthor),
                  createdAt: newMessage.data.data.data.createdAt,
                  id: newMessage.data.data.data.id,
                  isPrivate: newMessage.data.data.data.isPrivate,
                  message: MessageService.deserializeMessage(newMessage.data.data.data.data),
                  parent: mappedParentMessage,
            };
      }

      static mapTAuthorToUser(author: APITypes.TAuthor): TVKPLMessageClient.User {
            return {
                  avatarUrl: author.avatarUrl,
                  badges: author.badges,
                  displayName: author.displayName,
                  hasAvatar: author.hasAvatar,
                  id: author.id,
                  isChatModerator: author.isChatModerator,
                  name: author.name,
                  nick: author.nick,
                  isOwner: author.isOwner,
                  vkplayProfileLink: author.vkplayProfileLink,
                  nickColor: author.nickColor,
            };
      }
}
