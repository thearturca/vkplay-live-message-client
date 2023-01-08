import { randomUUID } from "crypto";
import fetch from "node-fetch";
import { APITypes } from "../types/ApiTypes.js";

export class VKPLApiService
{
      public static async getSmilesSet(authToken: string, channelUrl: string): Promise<APITypes.TSmilesResponse>
      {
            return await (await fetch(`https://api.vkplay.live/v1/blog/${channelUrl}/smile/user_set/`, { headers: {Authorization: `Bearer ${authToken}`}})).json() as APITypes.TSmilesResponse;
      }

      public static async getBlog(channelUrl: string): Promise<APITypes.TBlogResponse>
      {
            return await (await fetch(`https://api.vkplay.live/v1/blog/${channelUrl}`)).json() as APITypes.TBlogResponse;
      }

      public static async getWebSocketToken(): Promise<APITypes.TTokenResponse>
      {
            return await (await fetch("https://api.vkplay.live/v1/ws/connect", { headers: {"X-From-Id": randomUUID() }})).json() as APITypes.TTokenResponse;
      }
}
