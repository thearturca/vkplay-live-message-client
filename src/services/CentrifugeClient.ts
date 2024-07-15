import WebSocket from "ws";
import EventEmitter from "events";
import { VkWsTypes } from "../types/api.v2.js";
import { TVKPLMessageClient } from "../types/internal.js";
import { VkplApi } from "./VKPLApiService.js";
import VKPLMessageClient from "../index.js";

export declare interface CentrifugeClient {
      on(event: 'message', listener: (newMessage: VkWsTypes.WsMessage<VkWsTypes.ChatMessage>) => void): this;
      on(event: 'reconnect', listener: () => void): this;
      on(event: 'reward', listener: (data: VkWsTypes.WsMessage<VkWsTypes.CpRewardDemandMessage>) => void): this;
      on(event: string, listener: Function): this;
}

export class CentrifugeClient extends EventEmitter {
      private socket: WebSocket;
      private currentMethodId: number = 0;
      private methods: vkplWsMethod<unknown>[] = [];
      public wsToken: string | undefined;

      constructor(private wsServerUrl: string) {
            super();
      }

      public connect(): Promise<void> {
            return new Promise((resolve, reject) => {
                  if (this.socket) {
                        this.socket.close();
                  }

                  this.socket = new WebSocket(this.wsServerUrl, { headers: { Origin: "https://live.vkplay.ru" } });

                  this.socket.onopen = async (e) => {
                        await this.onOpen(e).catch(reject);
                        resolve();
                  };
                  this.socket.onmessage = (e) => this.onMessage(e);
                  this.socket.onclose = (e) => this.onClose(e);
                  this.socket.onerror = (e) => this.onError(e);
            });
      }

      public disconnect(): void {
            if (this.socket) {
                  this.socket.close();
                  this.socket.removeAllListeners();
            }
      }

      public async onOpen(_: WebSocket.Event): Promise<void> {
            console.log("[open] Initializing connection to live.vkplay.ru websocket");

            const wsToken = await VkplApi.getWebSocketConnectToken(this.wsToken);

            if (VKPLMessageClient.debugLog)
                  console.warn("[debug:websocket] get websocket token", JSON.stringify(wsToken, null, 5))

            const payload: VkWsTypes.Method<VkWsTypes.ConnectMethod> = {
                  connect: {
                        token: wsToken.token ?? "",
                        name: "js"
                  },
                  id: 0
            };

            await this.invokeMethod(payload);
            console.log("[open] Connected");
            this.emit("open");
      }

      private checkMethod<T extends Record<string, unknown>>(wsMessage: VkWsTypes.WsMethodResponse<T>): void {
            const methodIndex: number = this.methods.findIndex(method => method.id === wsMessage.id);

            if (methodIndex === -1)
                  return;

            const method: vkplWsMethod<unknown> | undefined = this.methods[methodIndex];

            if (method == undefined)
                  return;

            method.callbBack(wsMessage.result);
            this.methods.splice(methodIndex, 1);
      }

      public async invokeMethod<T extends Record<string, unknown>>(payload: VkWsTypes.Method<T>): Promise<unknown> {
            return new Promise((resolve, reject) => {
                  this.currentMethodId += 1;
                  payload.id = this.currentMethodId;

                  if (VKPLMessageClient.debugLog)
                        console.warn("[debug:websocket] invoking live.vkplay.ru websocket method", JSON.stringify(payload, null, 4));

                  this.methods.push({ id: payload.id, callbBack: resolve });
                  this.socket.send(JSON.stringify(payload), (error) => {
                        if (error)
                              reject(error);
                  });
            });
      }

      public async connectToChat(channel: TVKPLMessageClient.Channel): Promise<unknown> {
            const connectToChatPaylod: VkWsTypes.Method<VkWsTypes.SubscribeMethod> = {
                  "subscribe": {
                        "channel": `public-chat:${channel.publicWebSocketChannel}`
                  },
                  "id": 0
            };
            console.log(`[chat:${channel.blogUrl}] Connecting to channel chat...`)
            const res = await this.invokeMethod(connectToChatPaylod);
            console.log(`[chat:${channel.blogUrl}] Connected to channel chat`);
            return res;
      }

      public async connectToReedem(channel: TVKPLMessageClient.Channel, wsSubscribeToken: string): Promise<unknown> {
            const connectToReedemPaylod: VkWsTypes.Method<VkWsTypes.SubscribeMethod> = {
                  "subscribe": {
                        "channel": `channel-info-manage:${channel.publicWebSocketChannel}`,
                        "token": wsSubscribeToken,
                  },
                  "id": 0
            };

            console.log(`[chat:${channel.blogUrl}] Connecting to channel reedem...`)
            const res = await this.invokeMethod(connectToReedemPaylod);
            console.log(`[chat:${channel.blogUrl}] Connected to channel reedem`);
            return res;
      }

      public onMessage(event: WebSocket.MessageEvent): void {
            if (event.data == "{}") {
                  this.socket.send("{}");
                  return;
            }

            const data: Record<string, unknown> = JSON.parse(event.data as string);

            if (VKPLMessageClient.debugLog)
                  console.warn("[debug:websocket] new message", JSON.stringify(data, null, 4));

            if ("id" in data)
                  this.checkMethod(data as VkWsTypes.WsMethodResponse<{}>);

            const chatMessage = data as VkWsTypes.WsMessage<VkWsTypes.ChatMessage>;

            if (chatMessage.push?.pub.data && chatMessage.push?.pub?.data.type === "message")
                  this.emit("message", chatMessage);

            const rewardMessage = data as VkWsTypes.WsMessage<VkWsTypes.CpRewardDemandMessage>;

            if (rewardMessage.push?.pub && rewardMessage.push?.pub?.data.type === "cp_reward_demand")
                  this.emit("reward", rewardMessage);
      }

      public async onClose(event: WebSocket.CloseEvent): Promise<void> {
            if (event.wasClean)
                  console.log(`[close] Connection closed clean, code=${event.code} reason=${event.reason}`);
            else {
                  console.error('[close] Connection interrupted');
                  console.log('[close] Trying to reconnect...');
                  await this.connect();
                  this.emit("reconnect");
            }
      }

      public onError(error: WebSocket.ErrorEvent): void {
            console.error(`[error]`, error);
      }
}

type vkplWsMethod<T> = { id: number, callbBack: vkplWsCallback<T> };

type vkplWsCallback<T> = (params: T) => void;
