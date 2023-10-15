import fetch, { HeadersInit } from "node-fetch";
import { randomUUID } from "crypto";
import { APITypes } from "../types/ApiTypes.js";

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

      private static async makeRequest<T>(url: string, method: HTTPMethod, headers?: HeadersInit, params?: URLSearchParams, body?: string): Promise<T> {
            const fetchOptions = {
                  headers,
                  method,
                  body
            }
            const finalUrl = `${url}?${new URLSearchParams(params)}`;

            const res = await fetch(finalUrl, fetchOptions);

            if (!res.ok)
                  throw new Error(`[api] Error in request: ${JSON.stringify({ url: finalUrl, body: await res.json() }, null, 5)}`);

            return await res.json() as T;
      }
}
