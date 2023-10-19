import EventEmitter from "events";
import { APITypes } from "./types/ApiTypes.js";
import { MessageService } from "./services/MessageService.js";
import { TVKPLMessageClient } from "./types/libTypes.js";
import { MapApiToLib } from "./services/MapApiToLibService.js";
import { SocketManager } from "./services/SocketManager.js";
import { VKPLApiService } from "./services/VKPLApiService.js";

declare interface VKPLMessageClient {
      on(event: 'message', listener: TVKPLMessageClient.MessageEvent): this;
      on(event: string, listener: Function): this;
}

class VKPLMessageClient extends EventEmitter {
      private wsServerUrl: string = "wss://pubsub.vkplay.live/connection/websocket";
      private authToken: string;
      private credentials?: {
            login: string,
            password: string,
      };
      public static debugLog: boolean;

      private socketManager: SocketManager;
      private messageService: MessageService;

      private _channels: string[];
      public channels: TVKPLMessageClient.Channel[] = [];

      public availableSmiles: Map<string, string> = new Map();

      constructor(config: TVKPLMessageClient.Config) {
            super();

            VKPLMessageClient.debugLog = config.debugLog ?? false;
            this.authToken = "token" in config.auth ? config.auth.token : "";

            if ("login" in config.auth)
                  this.credentials = { ...config.auth };

            this._channels = config.channels;
            this.wsServerUrl = config.wsServer ?? this.wsServerUrl;
            this.socketManager = new SocketManager(this.wsServerUrl);

            this.socketManager.on("message", (message) => this.onMessage(message));
            this.socketManager.on("reconnect", () => this.onReconnect());
      }

      private onMessage(message: APITypes.TNewMessage): void {
            const channel: TVKPLMessageClient.Channel | undefined = this.findChannelById(message.channel.split(":")[1]);

            if (channel == undefined)
                  return;

            const mappedMessage: TVKPLMessageClient.ChatMessage = MapApiToLib.mapTNewMessageToChatMessage(message, channel);
            this.emit("message",
                  {
                        ...mappedMessage,
                        sendMessage: async (text: string) => this.sendMessage(text, mappedMessage.channel.blogUrl),
                        reply: async (text: string) => this.sendMessage(text, mappedMessage.channel.blogUrl, mappedMessage.user.id)
                  });
            console.log(`[chat:${channel.blogUrl}] ${mappedMessage.user.nick}: ${mappedMessage.message.text}`);
      }

      public findChannelById(id: string): TVKPLMessageClient.Channel | undefined {
            return this.channels.find(channel => channel.publicWebSocketChannel === id);
      }
      public findChannelByName(name: string): TVKPLMessageClient.Channel | undefined {
            return this.channels.find(channel => channel.blogUrl === name);
      }

      private async connectToChat(): Promise<void> {
            for (const channel of this.channels)
                  await this.socketManager.connectToChat(channel);
      }

      private async onReconnect(): Promise<void> {
            this.connectToChat();
      }

      private async getToken(): Promise<void> {
            if (!this.credentials)
                  return;

            const token = await VKPLApiService.getToken(this.credentials?.login ?? "", this.credentials?.password ?? "");

            if (token.accessToken)
                  this.authToken = token.accessToken;
      }

      public async connect(): Promise<void> {
            if (!this.authToken && this.credentials) {
                  await this.getToken();
            }

            for (const channelName of this._channels) {
                  const channel: TVKPLMessageClient.Channel = MapApiToLib.mapTBlogResponseToChannel(await VKPLApiService.getBlog(channelName));
                  this.channels.push(channel);
            }

            if (this.authToken !== "" && this.channels.length) {
                  const smilesSet: APITypes.TSmilesResponse = await VKPLApiService.getSmilesSet(this.authToken, this.channels[0].blogUrl);

                  if (VKPLMessageClient.debugLog)
                        console.warn("[debug:chat] Get smiles set", JSON.stringify(smilesSet, null, 5))

                  for (const set of smilesSet.data.sets)
                        for (const smile of set.smiles)
                              this.availableSmiles.set(smile.name, smile.id);

                  this.messageService = new MessageService(this.authToken, this.availableSmiles);
            }
            else
                  throw new Error("[chat] Cannot get list of smiles because of no auth token nor channels provided");

            await this.socketManager.connect();
            await this.connectToChat();
      }

      public async sendMessage(message: string, channel: string, mentionUserId?: number): Promise<void> {
            await this.messageService.sendMessage(message, channel, mentionUserId)
      }
}

export default VKPLMessageClient;
