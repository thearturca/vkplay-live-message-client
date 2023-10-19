import fetch, { HeadersInit } from "undici";
import { randomUUID } from "crypto";
import { APITypes } from "../types/ApiTypes.js";
import { CookieAgent } from "http-cookie-agent/undici";
import { CookieJar } from "tough-cookie";

export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";

export class VKPLApiService {
      public static async getSmilesSet(authToken: string, channelUrl: string): Promise<APITypes.TSmilesResponse> {
            const headers = { Authorization: `Bearer ${authToken}` };
            return await VKPLApiService.makeRequest<APITypes.TSmilesResponse>(`https://api.vkplay.live/v1/blog/${channelUrl}/smile/user_set/`, "GET", headers);
      }

      public static async getBlog(channelUrl: string): Promise<APITypes.TBlogResponse> {
            return await VKPLApiService.makeRequest<APITypes.TBlogResponse>(`https://api.vkplay.live/v1/blog/${channelUrl}`, "GET");
      }

      public static async getWebSocketToken(): Promise<APITypes.TTokenResponse> {
            const headers = { "X-From-Id": randomUUID() };
            return await VKPLApiService.makeRequest<APITypes.TTokenResponse>(`https://api.vkplay.live/v1/ws/connect`, "GET", headers);
      }

      public static async getUserCurrent(authToken: string): Promise<APITypes.TUser> {
            const headers = { Authorization: `Bearer ${authToken}` };
            return await VKPLApiService.makeRequest<APITypes.TUser>("https://api.vkplay.live/v1/user/current", "GET", headers);
      }

      public static async sendMessage(channel: string, authToken: string, body: string): Promise<APITypes.TMessageResponse> {
            const headers = { Authorization: `Bearer ${authToken}`, "Content-type": "application/x-www-form-urlencoded" };
            return await VKPLApiService.makeRequest<APITypes.TMessageResponse>(`https://api.vkplay.live/v1/blog/${channel}/public_video_stream/chat`, "POST", headers, undefined, body);
      }

      static async getToken(username: string, password: string): Promise<APITypes.AuthResponse> {
            const jar = new CookieJar();
            const agent = new CookieAgent({ cookies: { jar } });
            const body = new URLSearchParams({ "login": username, "password": password });
            await fetch.fetch("https://auth-ac.vkplay.ru/sign_in", {
                  method: "POST",
                  headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        origin: "https://account.vkplay.ru",
                        referer: "https://account.vkplay.ru",
                  },
                  body: body.toString(),
                  dispatcher: agent,
            });

            await fetch.fetch("https://account.vkplay.ru/oauth2/?redirect_uri=" +
                  "https%3A%2F%2Fvkplay.live%2Fapp%2Foauth_redirect_vkplay&client_id=vkplay.live&response_type=code&skip_grants=1", {

                  method: "GET",
                  headers: {

                        origin: "https://account.vkplay.ru",
                        referer: "https://account.vkplay.ru",
                  },
                  dispatcher: agent,
            })
            await fetch.fetch("https://vkplay.live", {
                  dispatcher: agent,
            });

            const cookies = await jar.getCookies("https://vkplay.live");
            const tokenCookie = cookies.find(c => c.key === "auth");

            if (!tokenCookie)
                  throw new Error("[api] Cannot get token cookie");

            const parsedToken = JSON.parse(decodeURIComponent(tokenCookie.value)) as APITypes.AuthResponse;

            return parsedToken;
      }

      private static async makeRequest<T>(url: string, method: HTTPMethod, headers?: HeadersInit, params?: URLSearchParams, body?: string, jar?: CookieJar): Promise<T> {
            const fetchOptions: fetch.RequestInit = {
                  headers,
                  method,
                  body,
                  dispatcher: jar ? new CookieAgent({ cookies: { jar } }) : undefined,
            };

            const finalUrl = `${url}?${new URLSearchParams(params)}`;

            const res = await fetch.fetch(finalUrl, fetchOptions);

            if (!res.ok)
                  throw new Error(`[api] Error in request: ${JSON.stringify({ url: finalUrl, body: await res.json() }, null, 5)}`);

            return await res.json() as T;
      }
}
