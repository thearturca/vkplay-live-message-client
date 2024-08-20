import { EventEmitter } from "eventemitter3";
import { VKPLClientInternal } from "../types/internal.js";
import VKPLMessageClient from "../index.js";
import { VkWsTypes } from "../types/api.v2.js";
import { VkplApi } from "./VkplApi.js";
import WebSocket from "ws";

type CentrifugeClientEventMap = {
      'message': [newMessage: VkWsTypes.WsMessage<VkWsTypes.ChatMessage>]
      'reconnect': []
      'reward': [data: VkWsTypes.WsMessage<VkWsTypes.CpRewardDemandMessage>]
      'channel-info': [data: VkWsTypes.WsMessage<VkWsTypes.ChannelInfo>]
      'stream-status': [data: VkWsTypes.WsMessage<VkWsTypes.StreamStatus>]
}

export class CentrifugeClient<T extends string> extends EventEmitter<CentrifugeClientEventMap> {
      private socket: WebSocket;
      private currentMethodId: number = 0;
      private methods: vkplWsMethod<unknown>[] = [];

      constructor(
            private wsServerUrl: string,
            private api: VkplApi<T>,
      ) {
            super();
      }

      public connect(): Promise<void> {
            return new Promise((resolve, reject) => {
                  if (this.socket) {
                        this.socket.close();
                  }

                  this.socket = new WebSocket(this.wsServerUrl, { headers: { Origin: "https://live.vkplay.ru" } });

                  this.socket.onopen = async (e): Promise<void> => {
                        await this.onOpen(e).catch(reject);
                        resolve();
                  };
                  this.socket.onmessage = (e): void => this.onMessage(e);
                  this.socket.onclose = (e): Promise<void> => this.onClose(e);
                  this.socket.onerror = (e): void => this.onError(e);
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

            const wsToken = await this.api.getWebSocketConnectToken();

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
      }

      private resolveMethod<T extends Record<string, unknown>>(wsMessage: VkWsTypes.WsMethodResponse<T>): void {
            const methodIndex: number = this.methods.findIndex(method => method.id === wsMessage.id);

            if (methodIndex === -1)
                  return;

            const method: vkplWsMethod<unknown> | undefined = this.methods[methodIndex];

            if (!method)
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

      public async connectToChat(channel: VKPLClientInternal.Channel): Promise<unknown> {
            const paylod: VkWsTypes.Method<VkWsTypes.SubscribeMethod> = {
                  "subscribe": {
                        "channel": `public-chat:${channel.publicWebSocketChannel}`
                  },
                  "id": 0
            };
            console.log(`[chat:${channel.blogUrl}] Connecting to channel chat...`)
            const res = await this.invokeMethod(paylod);
            console.log(`[chat:${channel.blogUrl}] Connected to channel chat`);
            return res;
      }

      public async connectToReedem(channel: VKPLClientInternal.Channel, wsSubscribeToken: string): Promise<unknown> {
            const paylod: VkWsTypes.Method<VkWsTypes.SubscribeMethod> = {
                  "subscribe": {
                        "channel": `channel-info-manage:${channel.publicWebSocketChannel}`,
                        "token": wsSubscribeToken,
                  },
                  "id": 0
            };

            console.log(`[chat:${channel.blogUrl}] Connecting to channel reedem...`)
            const res = await this.invokeMethod(paylod);
            console.log(`[chat:${channel.blogUrl}] Connected to channel reedem`);
            return res;
      }

      public async connectToChannelInfo(channel: VKPLClientInternal.Channel): Promise<unknown> {
            const paylod: VkWsTypes.Method<VkWsTypes.SubscribeMethod> = {
                  "subscribe": {
                        "channel": `channel-info:${channel.publicWebSocketChannel}`,
                  },
                  "id": 0
            };

            console.log(`[chat:${channel.blogUrl}] Connecting to channel info...`)
            const res = await this.invokeMethod(paylod);
            console.log(`[chat:${channel.blogUrl}] Connected to channel info`);
            return res;
      }

      public onMessage(event: WebSocket.MessageEvent): void {
            if (event.data === "{}") {
                  this.socket.send("{}");
                  return;
            }

            const data: Record<string, unknown> = JSON.parse(event.data as string);

            if (VKPLMessageClient.debugLog)
                  console.warn("[debug:websocket] new message", JSON.stringify(data, null, 4));

            if ("id" in data)
                  this.resolveMethod(data as VkWsTypes.WsMethodResponse<{}>);

            const chatMessage = data as VkWsTypes.WsMessage<VkWsTypes.ChatMessage>;

            if (chatMessage.push?.pub.data && chatMessage.push?.pub?.data.type === "message")
                  this.emit("message", chatMessage);

            const rewardMessage = data as VkWsTypes.WsMessage<VkWsTypes.CpRewardDemandMessage>;

            if (rewardMessage.push?.pub && rewardMessage.push?.pub?.data.type === "cp_reward_demand")
                  this.emit("reward", rewardMessage);

            const channelInfo = data as VkWsTypes.WsMessage<VkWsTypes.ChannelInfo>;

            if (channelInfo.push?.pub && channelInfo.push?.pub?.data.type === "stream_online_status")
                  this.emit("channel-info", channelInfo);

            const streamStatus = data as VkWsTypes.WsMessage<VkWsTypes.StreamStatus>;

            if (streamStatus.push?.pub && (streamStatus.push?.pub?.data.type === "stream_end" || streamStatus.push?.pub?.data.type === "stream_start"))
                  this.emit("stream-status", streamStatus);
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
