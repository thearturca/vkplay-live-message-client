import WebSocket from "ws";
import EventEmitter from "events";
import { APITypes } from "../types/ApiTypes.js";
import { TVKPLMessageClient } from "../types/libTypes.js";
import { VKPLApiService } from "./VKPLApiService.js";
import VKPLMessageClient from "../index.js";

export declare interface SocketManager
{
  on(event: 'message', listener: (newMessage: APITypes.TNewMessage) => void): this;
  on(event: 'reconnect', listener: () => void): this;
  on(event: 'open', listener: () => void): this;
  on(event: string, listener: Function): this;
}

export class SocketManager extends EventEmitter
{
  private socket: WebSocket;
  private currentMethodId: number = 0;
  private methods: vkplWsMethod<unknown>[] = [];

  constructor(private wsServerUrl: string)
  {
    super();
  }

  public connect()
  {
    this.socket = new WebSocket(this.wsServerUrl, { headers: { Origin: "https://vkplay.live" }});

    this.socket.onopen = (e) => this.onOpen(e);
    this.socket.onmessage = (e) => this.onMessage(e);
    this.socket.onclose = (e) => this.onClose(e);
    this.socket.onerror = (e) => this.onError(e);
  }

  public async onOpen(event: WebSocket.Event): Promise<void>
  {
    console.log("[open] Initializing connection to vkplay.live websocket");

    const wsToken = await VKPLApiService.getWebSocketToken();

    if (VKPLMessageClient.debugLog)
      console.warn("[debug:websocket] get websocket token", JSON.stringify(wsToken, null, 5))

    const payload: vkplWsPayload = 
    {
      "params": 
      {
        "token": wsToken.token ?? "",
        "name": "js"
      },
      "id": 0
    }

    await this.invokeMethod(payload, () => 
    {
      console.log("[open] Connected");
      this.emit("open");
    });
  }

  private checkMethod(methodId: number): void
  {
    const methodIndex: number = this.methods.findIndex(method => method.id === methodId);

    if (methodIndex === -1)
      return;

    const method: vkplWsMethod<unknown> | undefined = this.methods[methodIndex];

    if (method == undefined)
      return;

    method.callbBack(method.callBackParams);
    this.methods.splice(methodIndex, 1);
  }

  public async invokeMethod(payload: vkplWsPayload, callbBack: vkplWsCallback<unknown>, callBackParams?: unknown): Promise<void>
  {
    return new Promise((resolve, reject) =>
    {
      this.currentMethodId += 1;
      payload.id = this.currentMethodId;

      if (VKPLMessageClient.debugLog)
        console.warn("[debug:websocket] invoking vkplay live websocket method", JSON.stringify(payload, null, 4));

      this.methods.push({ id: payload.id, callbBack, callBackParams });
      this.socket.send(JSON.stringify(payload), (error) =>
      {
        if (error)
          reject(error);

        resolve();
      });
    });
  }

  public connectToChat(channel: TVKPLMessageClient.Channel): void
  {
      const connectToChatPaylod: vkplWsPayload = 
      {
        "method": 1,
        "params":
        {
          "channel": `public-chat:${channel.publicWebSocketChannel}`
        },
        "id":0
      };
      console.log(`[chat:${channel.blogUrl}] Connecting to channel chat...`)
      this.invokeMethod(connectToChatPaylod, () => console.log(`[chat:${channel.blogUrl}] Connected to channel chat`))
  }

  public onMessage(event: WebSocket.MessageEvent): void
  {
    const data = JSON.parse(event.data as string);

    if (VKPLMessageClient.debugLog)
      console.warn("[debug:websocket] new message", JSON.stringify(data, null, 4));

    if (data.id)
          this.checkMethod(data.id);

    const newMessage: APITypes.TNewMessage = data as APITypes.TNewMessage;

    if (newMessage.result.data && newMessage.result.data.data.type === "message")
          this.emit("message", newMessage);
  }

  public onClose(event: WebSocket.CloseEvent): void
  {
    if (event.wasClean) 
      console.log(`[close] Connection closed clean, code=${event.code} reason=${event.reason}`);
    else 
    {
      console.error('[close] Connection interrupted');
      console.log('[close] Trying to reconnect...');
      this.emit("reconnect");
    }
  }

  public onError(error: WebSocket.ErrorEvent): void
  {
    console.error(`[error]`, error);
  }
}

type vkplWsMethod<T,> = { id: number, callbBack: vkplWsCallback<T>, callBackParams: T };

type vkplWsCallback<T,> = (params: T) => void;;

type vkplWsPayload = { params: any, method?: number, id: number };
