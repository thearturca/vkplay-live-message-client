import { randomUUID } from "crypto";
import { CookieAgent } from "http-cookie-agent/undici";
import { CookieJar } from "tough-cookie";

import VKPLMessageClient from "../client.js";
import { APITypes } from "../types/api.js";
import { HTTPMethod } from "../types/http.js";
import { VKPLClientInternal } from "../types/internal.js";
import { VkplMessageParser } from "./VkplMessageParser.js";

export class VkplApi {
      constructor(
            private messageParser: VkplMessageParser,
            public auth?: VKPLClientInternal.TokenAuth,
            protected readonly baseUrl: string = "https://api.live.vkplay.ru/v1",
      ) {

      }

      protected addAuthorizationHeader(headers: Headers) {
            if (!this.auth)
                  return;

            if (!headers.has("Authorization"))
                  headers.append("Authorization", `Bearer ${this.auth.accessToken}`);
      }

      public async getSmilesSet<T extends string>(channel: T): Promise<APITypes.TSmilesResponse> {
            const res = await this.httpRequest<APITypes.TSmilesResponse>(`/blog/${channel}/smile/user_set/`, "GET");

            if (typeof res === "string")
                  throw new Error(res);

            return res;
      }

      public async getBlog<T extends string>(channel: T): Promise<APITypes.TBlogResponse> {
            const res = await this.httpRequest<APITypes.TBlogResponse>(`/blog/${channel}`, "GET");

            if (typeof res === "string")
                  throw new Error(res);

            return res;
      }

      public async getCurrentUser(): Promise<APITypes.TUser> {
            const res = await this.httpRequest<APITypes.TUser>("/user/current", "GET");

            if (typeof res === "string")
                  throw new Error(res);

            return res;
      }

      public async getWebSocketConnectToken(): Promise<APITypes.TokenResponse> {
            const headers = new Headers({ "X-From-Id": randomUUID() });

            const res = await this.httpRequest<APITypes.TokenResponse>(`/ws/connect`, "GET", undefined, undefined, headers);

            if (typeof res === "string")
                  throw new Error(res);

            return res;
      }

      public async getWebSocketSubscriptionToken<T extends string>(channels: T[]): Promise<APITypes.WebSocketSubscriptionTokensResponse> {
            const params = new URLSearchParams({
                  channels: channels.map(c => `channel-info-manage:${c}`).join(",")
            });

            const res = await this.httpRequest<APITypes.WebSocketSubscriptionTokensResponse>("/ws/subscribe", "GET", params);

            if (typeof res === "string")
                  throw new Error(res);

            return res;
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
      public async sendMessage<T extends string>(message: string, channel: T, mentionUsers?: number[], threadId?: number): Promise<APITypes.TMessageResponse> {
            const serializedMessage = { data: JSON.stringify(this.messageParser.serialize(message, mentionUsers)) };
            const body = new URLSearchParams(serializedMessage);

            if (threadId)
                  body.set("reply_to_id", threadId.toString());

            const res = await this.httpRequest<APITypes.TMessageResponse>(
                  `/blog/${channel}/public_video_stream/chat`,
                  "POST",
                  undefined,
                  body.toString(),
                  new Headers({ "Content-type": "application/x-www-form-urlencoded" }),
            );

            if (typeof res === "string")
                  throw new Error(res);

            if (VKPLMessageClient.debugLog)
                  console.warn("[debug:send-message] ", JSON.stringify(res, null, 4));

            return res;
      }

      /**
      * @deprecated Vkpl усложнил процесс получения токена по логину и паролю. Поэтому данный функционал временно не работает.
      * При попытке использовать эту функцию, будет выдана ошибка.
      */
      public static async login(username: string, password: string): Promise<APITypes.AuthResponse> {
            const jar = new CookieJar();
            const agent = new CookieAgent({ cookies: { jar } });
            const body = new URLSearchParams({ "login": username, "password": password });

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

            if (!res.ok)
                  throw new Error("[api] Cannot get token");

            res = await fetch("https://account.vkplay.ru/oauth2/?redirect_uri=" +
                  "https%3A%2F%2Flive.vkplay.ru%2Fapp%2Foauth_redirect_vkplay&client_id=vkplay.live&response_type=code&skip_grants=1", {

                  method: "GET",
                  headers: {

                        origin: "https://account.vkplay.ru",
                        referer: "https://account.vkplay.ru",
                  },
                  dispatcher: agent,
            })

            if (!res.ok)
                  throw new Error("[api] Cannot get token");

            res = await fetch("https://live.vkplay.ru", {
                  dispatcher: agent,
            });

            if (!res.ok)
                  throw new Error("[api] Cannot get token");

            const cookies = await jar.getCookies("https://live.vkplay.ru");
            const tokenCookie = cookies.find(c => c.key === "auth");

            if (!tokenCookie)
                  throw new Error("[api] Cannot get token cookie");

            const parsedToken = JSON.parse(decodeURIComponent(tokenCookie.value)) as APITypes.AuthResponse;

            return parsedToken;
      }

      protected async httpRequest<T>(
            endpoint: `/${string}`,
            method: HTTPMethod,
            query?: URLSearchParams,
            body?: string | FormData,
            headers: Headers = new Headers(),
      ): Promise<T | string> {
            this.addAuthorizationHeader(headers);

            const response = await fetch(`${this.baseUrl}${endpoint}?${new URLSearchParams(query)}`, {
                  method,
                  headers,
                  body,
            });

            if (response.status >= 400) {
                  throw new Error(`[api:${response.status}] Error in request: ${await response.text()}`);
            }

            if (response.headers.get("Content-Type")?.includes("application/json")) {
                  return (await response.json()) as T;
            }

            return await response.text();
      }
}
