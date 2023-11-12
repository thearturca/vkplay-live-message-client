import VKPLMessageClient from "../index.js";
import { APITypes } from "../types/ApiTypes.js";
import { TVKPLMessageClient } from "../types/libTypes.js";
import { VKPLApiService } from "./VKPLApiService.js";

export class MessageService {
      constructor(private authToken: string, public smiles: Map<string, string>) {
      }

      public async sendMessage(message: string, channel: string, mentionUsers?: number[], threadId?: number): Promise<APITypes.TMessageResponse> {
            const serializedMessage = { data: JSON.stringify(this.serializeMessage(message, mentionUsers)) };
            const body = new URLSearchParams(serializedMessage);

            if (threadId)
                  body.set("reply_to_id", threadId.toString());

            const res = await VKPLApiService.sendMessage(channel, this.authToken, body.toString());

            if (VKPLMessageClient.debugLog)
                  console.warn("[debug:send-message] ", JSON.stringify(res, null, 4));

            return res;
      }

      public serializeMessage(message: string, mentionIds?: number[]): APITypes.TMessageBlock[] {
            const serializedMessage: APITypes.TMessageBlock[] = [];

            if (mentionIds)
                  for (const mentionId of mentionIds)
                        serializedMessage.push(...this.getMentionBlock(mentionId));

            const splitedMessage: string[] = message.split(" ");
            let textStack: string = "";

            for (const word of splitedMessage)
                  if (this.smiles.has(word)) {
                        serializedMessage.push(...this.getTextBlock(textStack));
                        textStack = " ";

                        serializedMessage.push(...this.getSmileBlock(word, this.smiles.get(word)!));
                  }
                  else {
                        textStack += word + " ";
                  }

            if (textStack != "")
                  serializedMessage.push(...this.getTextBlock(textStack));

            return serializedMessage;
      }

      private getSmileBlock(word: string, smileId: string): APITypes.TMessageBlock[] {
            return [
                  this.getBlockEnd(),
                  { type: "smile", id: smileId, name: word },
                  this.getBlockEnd(),
            ];
      }

      private getTextBlock(text: string): APITypes.TMessageBlock[] {
            return [{ type: "text", content: JSON.stringify([text, "unstyled", []]), modificator: "" }];
      }

      private getBlockEnd(): APITypes.TMessageBlock {
            return { type: "text", content: "", modificator: "BLOCK_END" };
      }

      private getMentionBlock(userId: number): APITypes.TMessageBlockMention[] {
            return [{ type: "mention", id: userId }]
      }

      public static deserializeMessage(message: APITypes.TMessageBlock[]): TVKPLMessageClient.DeserializedMessage {
            const deserializedMessage: TVKPLMessageClient.DeserializedMessage = {
                  smiles: [],
                  text: "",
                  mentions: [],
            };

            for (const block of message)
                  switch (block.type) {
                        case 'mention':
                              const blockAsBlockMention: APITypes.TMessageBlockMention = block as APITypes.TMessageBlockMention;
                              deserializedMessage.mentions.push({
                                    displayName: blockAsBlockMention.displayName,
                                    name: blockAsBlockMention.name,
                                    nick: blockAsBlockMention.nick,
                                    userId: blockAsBlockMention.id
                              });

                              if ((block as APITypes.TMessageBlockMention).displayName)
                                    deserializedMessage.text = deserializedMessage.text.trim() + " " + blockAsBlockMention.displayName;

                              break;

                        case 'text':
                              deserializedMessage.text = deserializedMessage.text.trim() + " " + (block.content && block.content.length > 0 ? JSON.parse(block.content)[0] : "");
                              break;

                        case 'smile':
                              deserializedMessage.smiles.push(block as APITypes.TMessageBlockSmile);
                              deserializedMessage.text = deserializedMessage.text.trim() + " " + (block as APITypes.TMessageBlockSmile).name
                              break;

                        default:
                              break;
                  };

            deserializedMessage.text = deserializedMessage.text.trim();

            return deserializedMessage;
      }
}
