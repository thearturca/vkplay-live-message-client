import { EventEmitter } from "eventemitter3";
import { CookieAgent } from "http-cookie-agent/undici";
import { CookieJar } from "tough-cookie";

import VKPLMessageClient from "../client.js";
import { APITypes } from "../types/api.js";
import { HTTPMethod } from "../types/http.js";
import { VKPLClientInternal } from "../types/internal.js";
import { DeferredPromise } from "../utils/index.js";
import { VkplMessageParser } from "./VkplMessageParser.js";

type VkplApiEventMap = {
    refreshed: [token: VKPLClientInternal.TokenAuth];
};

export class VkplApi<T extends string> extends EventEmitter<VkplApiEventMap> {
    private refreshTokenPromise?: DeferredPromise<VKPLClientInternal.TokenAuth>;

    constructor(
        private messageParser: VkplMessageParser,
        public auth?: VKPLClientInternal.TokenAuth,
        protected readonly baseUrl: string = "https://api.live.vkplay.ru/v1",
    ) {
        super();
    }

    protected addAuthorizationHeader(headers: Headers): void {
        if (!this.auth) {
            return;
        }

        if (!headers.has("Authorization")) {
            headers.append("Authorization", `Bearer ${this.auth.accessToken}`);
        }

        if ("clientId" in this.auth) {
            headers.set("X-From-Id", this.auth.clientId);
        }
    }

    /**
     * Получает список смайлов канала
     *
     * @param channel - название канала
     */
    public async getSmilesSet(channel: T): Promise<APITypes.TSmilesResponse> {
        const res = await this.httpRequest<APITypes.TSmilesResponse>(
            `/blog/${channel}/smile/user_set/`,
            "GET",
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Получает информацию о блоге
     *
     * @param channel - название канала
     */
    public async getBlog(channel: T): Promise<APITypes.TBlogResponse> {
        const res = await this.httpRequest<APITypes.TBlogResponse>(
            `/blog/${channel}`,
            "GET",
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Получает информацию о текущем пользователе
     */
    public async getCurrentUser(): Promise<APITypes.TUser> {
        const res = await this.httpRequest<APITypes.TUser>(
            "/user/current",
            "GET",
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    public async getWebSocketConnectToken(): Promise<APITypes.TokenResponse> {
        const res = await this.httpRequest<APITypes.TokenResponse>(
            `/ws/connect`,
            "GET",
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    public async getWebSocketSubscriptionToken(
        channels: T[],
    ): Promise<APITypes.WebSocketSubscriptionTokensResponse> {
        const params = new URLSearchParams({
            channels: channels.map((c) => `channel-info-manage:${c}`).join(","),
        });

        const res =
            await this.httpRequest<APITypes.WebSocketSubscriptionTokensResponse>(
                "/ws/subscribe",
                "GET",
                params,
            );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Таймаут пользователя
     *
     * @param channel - название канала
     * @param userId - идентификатор пользователя
     * @param seconds - время таймаута в секундах
     */
    public async timeoutUser(
        channel: T,
        userId: number,
        seconds: number,
    ): Promise<{}> {
        const body = new URLSearchParams({
            user_id: userId.toString(),
            period: seconds.toString(),
            by_stream: "flase",
            is_permanent: "false",
        });
        const res = await this.httpRequest<{}>(
            `/blog/${channel}/public_video_stream/ban`,
            "POST",
            undefined,
            body.toString(),
            new Headers({
                "Content-type": "application/x-www-form-urlencoded",
            }),
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Перманентно блокирует пользователя
     *
     * @param channel - название канала
     * @param userId - идентификатор пользователя
     */
    public async banUser(channel: T, userId: number): Promise<{}> {
        const body = new URLSearchParams({
            user_id: userId.toString(),
            by_stream: "flase",
            clean_messages: "true",
            is_permanent: "true",
        });

        const res = await this.httpRequest<{}>(
            `/blog/${channel}/public_video_stream/ban`,
            "POST",
            undefined,
            body.toString(),
            new Headers({
                "Content-type": "application/x-www-form-urlencoded",
            }),
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Отменяет таймаут и блокировку пользователя
     *
     * @param channel - название канала
     * @param userId - идентификатор пользователя
     */
    public async unbanUser(channel: T, userId: number): Promise<{}> {
        const query = new URLSearchParams({
            user_id: userId.toString(),
            by_stream: "flase",
        });

        const res = await this.httpRequest<{}>(
            `/blog/${channel}/public_video_stream/ban`,
            "DELETE",
            query,
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Удаляет все сообщения пользователя из чата канала
     *
     * @param channel - название канала
     * @param userId - идентификатор пользователя
     */
    public async deleteUserMessages(channel: T, userId: number): Promise<{}> {
        const query = new URLSearchParams({ user_id: userId.toString() });
        const res = await this.httpRequest<{}>(
            `/blog/${channel}/public_video_stream/chat/clean`,
            "DELETE",
            query,
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Получает статистику пользователя
     *
     * @param channel - название канала
     * @param userId - идентификатор пользователя
     */
    public async userStats(
        channel: T,
        userId: number,
    ): Promise<APITypes.UserStatResponse> {
        const query = new URLSearchParams({ user_id: userId.toString() });
        const res = await this.httpRequest<APITypes.UserStatResponse>(
            `/blog/${channel}/public_video_stream/chat/stat`,
            "GET",
            query,
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Получает роли, доступные на канале
     *
     * @param channel - название канала
     */
    public async getChannelRoles(
        channel: T,
    ): Promise<APITypes.ChannelRoleResponse> {
        const res = await this.httpRequest<APITypes.ChannelRoleResponse>(
            `/channel/${channel}/role`,
            "GET",
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Изменяет роли пользователя
     *
     * @param channel - название канала
     * @param userId - идентификатор пользователя
     * @param roles - список идентификаторов ролей
     */
    public async setUserRoles(
        channel: T,
        userId: number,
        roles: string[],
    ): Promise<{}> {
        const body = new URLSearchParams();

        body.append("role_ids", roles.join(","));

        const res = await this.httpRequest<{}>(
            `/channel/${channel}/role/user/${userId}`,
            "PUT",
            undefined,
            body.toString(),
            new Headers({
                "Content-type": "application/x-www-form-urlencoded",
            }),
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Обновляет информацию о стриме
     *
     * @param channel - название канала
     * @param streamInfo - информация о стриме
     *
     * Параметр `title` будет парситься. Возможно использование ссылок.
     * Параметр `plannedAt` будет переведён в UNIX timestamp
     */
    public async setStreamInfo(
        channel: T,
        streamInfo: Partial<VKPLClientInternal.StreamInfo>,
    ): Promise<APITypes.ManageStreamResponse> {
        const body = new URLSearchParams();

        if (streamInfo.title) {
            body.append(
                "title_data",
                JSON.stringify(this.messageParser.serialize(streamInfo.title)),
            );
        }

        if (streamInfo.categoryId) {
            body.append("category_id", streamInfo.categoryId);
        }

        if (streamInfo.plannedAt) {
            const timestamp = Math.floor(streamInfo.plannedAt.getTime() / 1000);
            body.append("planned_at", timestamp.toString());
        }

        if (streamInfo.donationAlertNick) {
            body.append("da_nick", streamInfo.donationAlertNick);
        }

        if (streamInfo.subscriptionLevelId) {
            body.append(
                "subscription_level_id",
                streamInfo.subscriptionLevelId,
            );
        }

        const res = await this.httpRequest<APITypes.ManageStreamResponse>(
            `/channel/${channel}/manage/stream`,
            "PUT",
            undefined,
            body.toString(),
            new Headers({
                "Content-type": "application/x-www-form-urlencoded",
            }),
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Получает список категорий, доступных на live.vkplay.ru
     *
     * @param filters - Фильтры. Если не указывать фильтры, то возвращает список из всех категорий
     * @return {Promise<APITypes.CategoryResponse>} Ответ API
     */
    public async getCategories(
        filters?: Partial<APITypes.CategoryFilters>,
    ): Promise<APITypes.CategoryResponse> {
        const query = new URLSearchParams();

        if (filters?.type) {
            query.append("type", filters.type);
        }

        if (filters?.search) {
            query.append("search", filters.search);
        }

        if (filters?.limit) {
            query.append("limit", filters.limit.toString());
        }

        const res = await this.httpRequest<APITypes.CategoryResponse>(
            "/public_video_stream/category/",
            "GET",
            query,
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        return res;
    }

    /**
     * Метод производит поиск категории по названию. Если нашлась категория, то производит
     * изменение категории канала.
     *
     * @param channel - Канал
     * @param categoryName - Название категории
     * @return {Promise<APITypes.ManageStreamResponse>} Ответ API на изменение категории
     *
     * @throws {Error} Если категория не найдена
     */
    public async setCategory(
        channel: T,
        categoryName: string,
    ): Promise<APITypes.ManageStreamResponse> {
        const category = await this.getCategories({
            search: categoryName,
            limit: 1,
        });

        const categoryId = category.data[0]?.id;

        if (!categoryId) throw new Error("Category not found");

        return await this.setStreamInfo(channel, {
            categoryId,
        });
    }

    /**
     * @param message - Сообщение
     * @param channel - Канал
     * @param mentionUserId - ID пользователей, которые должны быть упомянуты в сообщении
     * @param threadId - ID сообщения, если нужно ответить в конкретной ветке
     * @return {Promise<APITypes.TMessageResponse>} Ответ API на сообщение
     *
     * Позволяет отправлять сообщение в чат трансляции без подключения к чату. Нужно лишь указать канал, куда будет отправлено сообщение
     */
    public async sendMessage(
        message: string,
        channel: T,
        mentionUsers?: number[],
        threadId?: number,
    ): Promise<APITypes.TMessageResponse> {
        const serializedMessage = {
            data: JSON.stringify(
                this.messageParser.serialize(message, mentionUsers),
            ),
        };
        const body = new URLSearchParams(serializedMessage);

        if (threadId) {
            body.set("reply_to_id", threadId.toString());
        }

        const res = await this.httpRequest<APITypes.TMessageResponse>(
            `/blog/${channel}/public_video_stream/chat`,
            "POST",
            undefined,
            body.toString(),
            new Headers({
                "Content-type": "application/x-www-form-urlencoded",
            }),
        );

        if (typeof res === "string") {
            throw new Error(res);
        }

        if (VKPLMessageClient.debugLog)
            console.warn("[debug:send-message] ", JSON.stringify(res, null, 4));

        return res;
    }

    /**
     * @deprecated Vkpl усложнил процесс получения токена по логину и паролю. Поэтому данный функционал временно не работает.
     * При попытке использовать эту функцию, будет выдана ошибка.
     */
    public static async login(
        username: string,
        password: string,
    ): Promise<APITypes.AuthResponse> {
        const jar = new CookieJar();
        const agent = new CookieAgent({ cookies: { jar } });
        const body = new URLSearchParams({
            login: username,
            password: password,
        });

        let res = await fetch("https://auth-ac.vkplay.ru/sign_in", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                origin: "https://account.vkplay.ru",
                referer: "https://account.vkplay.ru",
            },
            body: body.toString(),
            dispatcher: agent,
        });

        if (!res.ok) {
            throw new Error("[api] Cannot get token");
        }

        res = await fetch(
            "https://account.vkplay.ru/oauth2/?redirect_uri=" +
                "https%3A%2F%2Flive.vkplay.ru%2Fapp%2Foauth_redirect_vkplay&client_id=vkplay.live&response_type=code&skip_grants=1",
            {
                method: "GET",
                headers: {
                    origin: "https://account.vkplay.ru",
                    referer: "https://account.vkplay.ru",
                },
                dispatcher: agent,
            },
        );

        if (!res.ok) {
            throw new Error("[api] Cannot get token");
        }

        res = await fetch("https://live.vkplay.ru", {
            dispatcher: agent,
        });

        if (!res.ok) {
            throw new Error("[api] Cannot get token");
        }

        const cookies = await jar.getCookies("https://live.vkplay.ru");
        const tokenCookie = cookies.find((c) => c.key === "auth");

        if (!tokenCookie) {
            throw new Error("[api] Cannot get token cookie");
        }

        const parsedToken = JSON.parse(
            decodeURIComponent(tokenCookie.value),
        ) as APITypes.AuthResponse;

        return parsedToken;
    }

    public static readonly tokenExpiresShift = 10 * 60 * 1000; // 10 min

    public isTokenExpired(): boolean {
        if (!this.auth) {
            return false;
        }

        if (!("expiresAt" in this.auth)) {
            return false;
        }

        return this.auth.expiresAt - VkplApi.tokenExpiresShift <= Date.now();
    }

    public async refreshToken(): Promise<VKPLClientInternal.TokenAuth> {
        if (!this.auth) {
            throw new TypeError("Auth must be provided to refresh token");
        }

        if (!("refreshToken" in this.auth))
            throw new TypeError(
                "Refresh token must be provided to refresh token",
            );

        if (this.refreshTokenPromise) {
            return await this.refreshTokenPromise.promise;
        }

        this.refreshTokenPromise = new DeferredPromise();

        try {
            const body = new URLSearchParams({
                response_type: "code",
                refresh_token: this.auth.refreshToken,
                grant_type: "refresh_token",
                device_id: this.auth.clientId,
                device_os: "streams_web",
            });

            const res = await fetch("https://api.live.vkplay.ru/oauth/token/", {
                method: "POST",
                body: body.toString(),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    origin: "https://live.vkplay.ru",
                    referer: "https://live.vkplay.ru",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
                },
            });

            if (!res.ok)
                throw new Error("[api] Cannot refresh token", {
                    cause: await res.text(),
                });

            const refreshedToken =
                (await res.json()) as APITypes.RefreshedTokenResponse;

            const token: VKPLClientInternal.WithRefreshToken<VKPLClientInternal.AccessTokenAuth> =
                {
                    accessToken: refreshedToken.access_token,
                    refreshToken: refreshedToken.refresh_token,
                    expiresAt: Date.now() + refreshedToken.expires_in * 1000,
                    clientId: this.auth.clientId,
                };

            this.auth.accessToken = token.accessToken;
            this.auth.refreshToken = token.refreshToken;
            this.auth.expiresAt = token.expiresAt;

            this.refreshTokenPromise.resolve(token);
            this.emit("refreshed", token);

            return token;
        } finally {
            this.refreshTokenPromise = undefined;
        }
    }

    protected async httpRequest<T = string>(
        endpoint: `/${string}`,
        method: HTTPMethod,
        query?: URLSearchParams,
        body?: string | FormData,
        headers: Headers = new Headers(),
    ): Promise<T | string> {
        if (this.isTokenExpired()) {
            await this.refreshToken();
        }

        this.addAuthorizationHeader(headers);

        const url = `${this.baseUrl}${endpoint}?${new URLSearchParams(query)}`;

        const response = await fetch(url, {
            method,
            headers,
            body,
        });

        if (response.status >= 400) {
            throw new Error(
                `[api:${response.status}] Error in request: ${await response.text()}`,
            );
        }

        if (
            response.headers.get("Content-Type")?.includes("application/json")
        ) {
            return (await response.json()) as T;
        }

        return await response.text();
    }
}
