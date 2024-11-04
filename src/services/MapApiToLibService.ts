import { APITypes } from "../types/api.js";
import { VkWsTypes } from "../types/api.v2.js";
import { VKPLClientInternal } from "../types/internal.js";
import { VkplMessageParser } from "./VkplMessageParser.js";

export class MapApiToClient {
    public static channelFromBlogResponse(
        blog: APITypes.TBlogResponse,
    ): VKPLClientInternal.Channel {
        const publicWebSocketChannel =
            blog.publicWebSocketChannel.split(":")[1];

        if (!publicWebSocketChannel) {
            throw new TypeError("Invalid publicWebSocketChannel");
        }

        return {
            blogUrl: blog.blogUrl,
            id: blog.owner.id,
            name: blog.owner.name,
            publicWebSocketChannel,
        };
    }

    public static parentMessageFromApi(
        message: VkWsTypes.ParentMessage,
    ): VKPLClientInternal.ParentMessage {
        return {
            id: message.id,
            isPrivate: message.isPrivate,
            user: message.author,
            message: VkplMessageParser.deserialize(message.data),
        };
    }

    public static rewardMessageFromApi(
        message: VkWsTypes.CpRewardDemandMessage,
        channel: VKPLClientInternal.Channel,
    ): VKPLClientInternal.RewardMessage {
        return {
            channel,
            user: message.data.user,
            reward: {
                status: message.data.status,
                ...message.data.reward,
                message:
                    message.data.activationMessage.length > 0
                        ? VkplMessageParser.deserialize(
                              message.data.activationMessage,
                          )
                        : undefined,
            },
        };
    }

    public static chatMessageFromApi(
        message: VkWsTypes.ChatMessage,
        channel: VKPLClientInternal.Channel,
    ): VKPLClientInternal.ChatMessage {
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
            message: VkplMessageParser.deserialize(message.data.data),
            parent: parentMessage,
            flags: message.data.flags,
            threadId: message.data.threadId,
        };
    }
}
