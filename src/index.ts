import { APITypes } from "./types/ApiTypes.js";
import { MessageService } from "./services/MessageService.js";
import { TVKPLMessageClient } from "./types/libTypes.js";
import { MapApiToLibService } from "./services/MapApiToLibService.js";
import EventEmitter from "events";
import { SocketManager } from "./services/SocketManager.js";
import { VKPLApiService } from "./services/VKPLApiService.js";

export declare interface VKPLMessageClient
{
  on(event: 'message', listener: TVKPLMessageClient.MessageEvent): this;
  on(event: string, listener: Function): this;
}

export class VKPLMessageClient extends EventEmitter
{
  private wsServerUrl: string = "wss://pubsub.vkplay.live/connection/websocket";
  private authToken: string;

  private socketManager: SocketManager;
  private messageService: MessageService;

  private _channels: string[];
  public channels: TVKPLMessageClient.Channel[] = [];

  public availableSmiles: Map<string, string> = new Map();


  constructor(config: TVKPLMessageClient.Config)
  {
    super();

    this.authToken = config.authToken ?? "";
    this._channels = config.channels;
    this.wsServerUrl = config.wsServer ?? this.wsServerUrl;
    this.socketManager = new SocketManager(this.wsServerUrl);
    this.socketManager.connect();

    this.socketManager.on("message", (message) => this.onMessage(message));
  }

  private onMessage(message: APITypes.TNewMessage): void
  {
    const channel: TVKPLMessageClient.Channel | undefined = this.findChannelById(message.result.channel.split(":")[1]);

    if (channel == undefined)
      return;

    const mappedMessage: TVKPLMessageClient.ChatMessage = MapApiToLibService.mapTNewMessageToChatMessage(message, channel);
    this.emit("message", 
    {
      ...mappedMessage, 
      sendMessage: async (text: string) => this.sendMessage(text, mappedMessage.channel.blogUrl), 
      reply: async (text: string) => this.sendMessage(text, mappedMessage.channel.blogUrl, mappedMessage.user.id)
    });
    console.log(`[chat:${channel.blogUrl}] ${mappedMessage.user.nick}: ${mappedMessage.message.text}`);
}

  public findChannelById(name: string): TVKPLMessageClient.Channel | undefined
  {
    return this.channels.find((channel => channel.publicWebSocketChannel === name));
  }

  public async connect(): Promise<void>
  {
    for (const channelName of this._channels)
    {
      const channel: TVKPLMessageClient.Channel = MapApiToLibService.mapTBlogResponseToChannel(await VKPLApiService.getBlog(channelName));
      this.channels.push(channel);
    }

    if (this.authToken !== "" && this.channels.length)
    {
      const smilesSet: APITypes.TSmilesResponse = await VKPLApiService.getSmilesSet(this.authToken, this.channels[0].blogUrl);

      for (const set of smilesSet.data.sets)
        for (const smile of set.smiles)
          this.availableSmiles.set(smile.name, smile.id);

      this.messageService = new MessageService(this.authToken, this.availableSmiles);
    }
    else
      console.error("[chat] Cannot get list of smiles because of no auth token nor channels provided");

    for (const channel of this.channels)
      this.socketManager.connectToChat(channel);
  }

  public async sendMessage(message: string, channel: string, mentionUserId?: number): Promise<void>
  {
    await this.messageService.sendMessage(message, channel, mentionUserId)
  }
}
