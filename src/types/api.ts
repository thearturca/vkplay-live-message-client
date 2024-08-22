export namespace APITypes {
    export type TokenResponse = { token?: string };

    export type WebSocketSubscriptionTokensResponse = {
        data: {
            tokens: {
                token: string;
                channel: string;
            }[];
        };
    };

    export type AuthResponse = {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
    };

    export type RefreshedTokenResponse = {
        expires_in: number;
        refresh_token: string;
        access_token: string;
    };

    export type TBlogResponse = {
        publicWebSocketChannel: string;
        owner: TUser;
        blogUrl: string;
    };
    export type TSmilesResponse = { data: { sets: TSmilesSet[] } };

    export type TSmilesSet = {
        type: string;
        smiles: TSmile[];
    };

    export type TBadge = {
        achievement: { name: string; type: string };
        id: string;
        isCreated: boolean;
        largeUrl: string;
        mediumUrl: string;
        smallUrl: string;
        name: string;
    };

    export type TRole = {
        id: string;
        name: string;
        smallUrl: string;
        largeUrl: string;
        mediumUrl: string;
        priority: number;
    };

    export type TAuthor = {} & TUser;

    export type TUser = {
        badges: TBadge[];
        roles: TRole[];
        createdAt: number;
        isOwner: boolean;
        isVerifiedStreamer: boolean;
        vkplayProfileLink: string;
        isChatModerator: boolean;
        displayName: string;
        id: number;
        name: string;
        hasAvatar: boolean;
        avatarUrl: string;
        nick: string;
        nickColor: number;
    };

    export type TMessageBlockText = {
        content: string;
        modificator: string;
        type: "text" | string;
    };
    export type TMessageBlockMention = {
        displayName?: string;
        name?: string;
        nick?: string;
        id: number;
        type: "mention";
    };

    export type TMessageBlockLink = {
        content: string;
        explicit: boolean;
        type: "link";
        url: string;
    };

    export type TContentParsed = [string, "unstyled" | string, []];

    export type TSmile = {
        smallUrl?: string;
        mediumUrl?: string;
        largeUrl?: string;
        isAnimated?: boolean;
        id: string;
        name: string;
    };

    export type TMessageBlockSmile = {
        type: "smile";
    } & TSmile;

    export type TMessageBlock =
        | TMessageBlockText
        | TMessageBlockSmile
        | TMessageBlockMention
        | TMessageBlockLink;

    export type TParentMessage = {
        isPrivate: boolean;
        data: TMessageBlock[];
        createdAt: number;
        author: TAuthor;
        id: number;
    };

    export type TMessageResponse = {
        author: TAuthor;
        createdAt: number;
        data: TMessageBlock[];
        id: number;
        style: unknown[];
        user: TUser;
        isPrivate: boolean;
        parent?: TParentMessage;
    };

    export type TNewMessage = {
        channel: string;
        data: {
            data: {
                data: TMessageResponse;
                type: "message" | string;
            };
            offset: number;
        };
    };

    export type ConnectionResponse = {
        client: string;
        version: string;
        expires: boolean;
        ttl: number;
    };

    export type WsMessage<T> = {
        id: number;
        result: T;
    };

    export type UserStat = {
        giftsCount: number;
        messagesCount: number;
        permanentBansCount: number;
        temporaryBansCount: number;
    };

    export type SubscriberInfo = {
        paidSubscriptionDaysDuration: number | null;
        subscriptionDaysDuration: number | null;
    };

    export type UserStatResponse = {
        bans: [];
        blog: null;
        moderator: null;
        stat: UserStat;
        subscriberInfo: SubscriberInfo;
        user: TUser;
    };

    export type ChannelRoleResponse = {
        data: {
            roles: TRole[];
        };
    };

    export type AccessRestrictions = {
        view: View;
    };

    export type View = {
        allowed: boolean;
    };

    export type CategoryType = "game" | "irl";

    export type Category = {
        showPlayGameUrl?: string;
        coverUrl: string;
        type?: CategoryType;
        id: string;
        title: string;
    };

    export type Count = {
        likes: number;
        viewers: number;
        views: number;
    };

    export type SubscriptionLevel = {
        externalId: number;
        name: string;
        isArchived: boolean;
        isDeleted: boolean;
        id: string;
        priority: number;
        bonusMultiplier?: number;
    };

    export type ProfileLink = {
        link: string;
        type: string;
    };

    export type WsLimitedChannel = {
        token: string;
        channel: string;
    };

    export type Stream = {
        wsChatChannel: string;
        channelCoverImageUrl: string;
        isBlackListedByUser: boolean;
        isPublic: boolean;
        user: TUser;
        accessRestrictions: AccessRestrictions;
        plannedAt: number;
        endTime: number | null;
        isChannelModerator: boolean;
        hasAccess: boolean;
        isChatModerator: boolean;
        isEnded: boolean;
        data: unknown[];
        isOnline: boolean;
        count: Count;
        isLiked: boolean;
        subscriptionLevels: SubscriptionLevel[];
        isSupportProgramMember: boolean;
        title: string;
        wsLimitedChannel: WsLimitedChannel;
        hasChatPinnedMessage: boolean;
        createdAt: number;
        daNick: string;
        category: Category;
        embedUrl: string;
        isHidden: boolean;
        channelCoverType: string;
        isCreated: boolean;
        id: string;
        wsStreamViewersChannel: string;
        wsStreamChannelPrivate: string;
        wsStreamChannel: string;
        previewUrl: string;
        wsChatChannelPrivate: string;
        titleData: TMessageBlock[];
        hasChat: boolean;
    };

    export type ManageStreamResponse = {
        data: {
            stream: Stream;
        };
    };

    export type Extra = {
        isLast: boolean;
        offset: number;
    };

    export type CategoryResponse = {
        data: Category[];
        extra: Extra;
    };

    export type CategoryFilters = {
        search: string;
        type: CategoryType;
        limit: number;
    };
}
