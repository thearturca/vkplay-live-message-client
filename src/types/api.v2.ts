export namespace VkWsTypes {
    export type WebSocketSubscriptionTokensResponse = {
        data: {
            tokens: {
                token: string;
                channel: string;
            }[];
        };
    };

    export type Method<T extends Record<string, unknown>> = {
        id: number;
    } & T;

    export type SubscribeMethod = {
        subscribe: {
            channel: string;
            token?: string;
        };
    };

    export type UnsubscribeMethod = {
        unsubscribe: {
            channel: string;
        };
    };

    export type ConnectMethod = {
        connect: {
            token: string;
            name: "js" | string;
        };
    };

    export type Badge = {
        achievement: { name: string; type: string };
        id: string;
        isCreated: boolean;
        largeUrl: string;
        mediumUrl: string;
        smallUrl: string;
        name: string;
    };

    export type Role = {
        id: string;
        name: string;
        smallUrl: string;
        largeUrl: string;
        mediumUrl: string;
        priority: number;
    };

    export type Author = {} & ChatUser;

    export type ProfileLink = {
        type: string;
        link: string;
    };

    export type User = {
        id: number;
        nickColor: number;
        displayName: string;
        hasAvatar: boolean;
        avatarUrl: string;
        isVerifiedStreamer: boolean;
        nick: string;
        profileLinks: ProfileLink[];
        vkplayProfileLink: string;
        name: string;
    };

    export type ChatUser = {
        badges: Badge[];
        roles: Role[];
        createdAt: number;
        isOwner: boolean;
        isChatModerator: boolean;
        isChannelModerator: boolean;
    } & User;

    export type ParentMessage = {
        isPrivate: boolean;
        data: ChatMessageBlock[];
        createdAt: number;
        author: Author;
        id: number;
    };

    export type MessageBlockText = {
        content: string;
        modificator: string;
        type: "text" | string;
    };
    export type MessageBlockMention = {
        displayName?: string;
        name?: string;
        nick?: string;
        id: number;
        type: "mention";
    };

    export type MessageBlockLink = {
        content: string;
        explicit: boolean;
        type: "link";
        url: string;
    };

    export type ContentParsed = [string, "unstyled" | string, []];

    export type Smile = {
        smallUrl?: string;
        mediumUrl?: string;
        largeUrl?: string;
        isAnimated?: boolean;
        id: string;
        name: string;
    };

    export type MessageBlockSmile = {
        type: "smile";
    } & Smile;

    export type ChatMessageBlock =
        | MessageBlockText
        | MessageBlockSmile
        | MessageBlockMention
        | MessageBlockLink;

    export type MessageData = {
        author: Author;
        createdAt: number;
        data: ChatMessageBlock[];
        id: number;
        style: unknown[];
        user: ChatUser;
        isPrivate: boolean;
        parent?: ParentMessage;
    };

    export type ChatMessage = {
        data: MessageData;
        type: "message";
    };

    export type Reward = {
        name: string;
        price: number;
        isAutoapproved: boolean;
        bgcolor: number;
        isDisabled: boolean;
        description: string;
        isTextRequired: boolean;
        id: string;
        largeUrl: string;
        mediumUrl: string;
        smallUrl: string;
        isCreated: boolean;
        isHiddenText: boolean;
        isUnlimited: boolean;
    };

    export type ActionsJournalNewEventRewardDemandMessage = {
        data: {
            action_time: number;
            type: "reward_demand" | string;
            reward_demand: {
                status: string;
                user: User;
                activationMessage: ChatMessageBlock[];
                demandId: number;
                reward: Reward;
                createdAt: number;
            };
        };
        type: "actions_journal_new_event";
    };

    export type RewardStatus = "approved" | "pending" | "rejected";

    export type CpRewardDemandMessage = {
        data: {
            createdAt: number;
            reward: Reward;
            demandId: number;
            activationMessage: ChatMessageBlock[];
            user: User;
            status: RewardStatus;
        };
        type: "cp_reward_demand";
    };

    export type StreamStatus = {
        videoId: number;
        type: "stream_end" | "stream_start";
    };

    export type ChannelInfo = {
        type: "stream_online_status";
        blogUrl: string;
        title: string;
        category: {
            title: string;
        };
        isOnline: boolean;
        viewers: number;
        streamId: string;
    };

    export type WsMessage<T extends Record<string, unknown>> = {
        push: {
            channel: string;
            pub: {
                data: T;
                offset: number;
            };
        };
    };

    export type WsMethodResponse<T extends Record<string, unknown>> = {
        id: number;
    } & T;
}
