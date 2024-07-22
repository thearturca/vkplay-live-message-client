import { APITypes } from "../types/api.js";
import { VkWsTypes } from "../types/api.v2.js";
import { TVKPLMessageClient } from "../types/internal.js";
import { MessageService } from "./MessageService.js";

export class MapApiToClient {
      public static channelFromBlogResponse(blog: APITypes.TBlogResponse): TVKPLMessageClient.Channel {
            return { blogUrl: blog.blogUrl, id: blog.owner.id, name: blog.owner.name, publicWebSocketChannel: blog.publicWebSocketChannel.split(":")[1] }
      }

      public static parentMessageFromApi(message: VkWsTypes.ParentMessage): TVKPLMessageClient.ParentMessage {
            return {
                  id: message.id,
                  isPrivate: message.isPrivate,
                  user: message.author,
                  message: MessageService.deserializeMessage(message.data),
            };
      }

      public static rewardMessageFromApi(message: VkWsTypes.CpRewardDemandMessage, channel: TVKPLMessageClient.Channel): TVKPLMessageClient.RewardMessage {
            return {
                  channel,
                  user: message.data.user,
                  reward: {
                        status: message.data.status,
                        ...message.data.reward, message: message.data.activationMessage.length > 0
                              ? MessageService.deserializeMessage(message.data.activationMessage)
                              : undefined
                  },
            };
      }

      public static chatMessageFromApi(message: VkWsTypes.ChatMessage, channel: TVKPLMessageClient.Channel): TVKPLMessageClient.ChatMessage {
            const author = message.data.author;
            const parentMessage = message.data.parent
                  ? MapApiToClient.parentMessageFromApi(message.data.parent)
                  : undefined;

            return {
                  channel,
                  user: author,
                  createdAt: message.data.createdAt,
                  id: message.data.id,
                  isPrivate: message.data.isPrivate,
                  message: MessageService.deserializeMessage(message.data.data),
                  parent: parentMessage,
            };
      }
}
