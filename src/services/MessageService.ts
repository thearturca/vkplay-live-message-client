import fetch from "node-fetch";
import VKPLMessageClient from "../index.js";
import { APITypes } from "../types/ApiTypes.js";
import { TVKPLMessageClient } from "../types/libTypes.js";
import { VKPLApiService } from "./VKPLApiService.js";

export class MessageService
{
      constructor(private authToken: string, public smiles: Map<string, string>)
      {
      }

      public async sendMessage(message: string, channel: string, mentionUser?: number): Promise<void>
      {
            try
            {
                  const serializedMessage = { data: JSON.stringify(this.serializeMessage(message, mentionUser)) };
                  await VKPLApiService.sendMessage(channel, this.authToken, new URLSearchParams(serializedMessage).toString())
                  .then((res) => 
                  {
                        if (VKPLMessageClient.debugLog)
                              console.warn("[debug:send-message] ", JSON.stringify(res, null, 4));
                  });
            }
            catch (e)
            {
                  console.error(e);
            }
      }

      public serializeMessage(message: string, mentionId?: number): APITypes.TMessageBlock[]
      {
            const serializedMessage: APITypes.TMessageBlock[] = [];

            if (mentionId)
                  serializedMessage.push(...this.getMentionBlock(mentionId));

            const splitedMessage: string[] = message.split(" ");
            let textStack: string = "";
            for (const word of splitedMessage)
                  if (this.smiles.has(word))
                  {
                        serializedMessage.push(...this.getTextBlock(textStack));
                        textStack = " ";

                        serializedMessage.push(...this.getSmileBlock(word, this.smiles.get(word)!));
                  }
                  else
                        textStack += word + " ";
            
            if (textStack != "")
                  serializedMessage.push(...this.getTextBlock(textStack));

            return serializedMessage;
      }

      private getSmileBlock(word: string, smileId: string): APITypes.TMessageBlock[]
      {
            return [ 
                  { type: "text", content: "", modificator: "BLOCK_END" },
                  { type: "smile", id: smileId, name:  word},
                  { type: "text", content: "", modificator: "BLOCK_END" },
            ];
      }

      private getTextBlock(text: string): APITypes.TMessageBlock[]
      {
            return [{ type: "text", content: JSON.stringify([text, "unstyled", []]), modificator: "" }];
      }

      private getBlockEnd(): APITypes.TMessageBlock[]
      {
            return [{ type: "text", content: "", modificator: "BLOCK_END" }];
      }

      private getMentionBlock(userId: number): APITypes.TMessageBlockMention[]
      {
            return [{ type: "mention", id: userId }]
      }

      public static deserializeMessage(message: APITypes.TMessageBlock[]): TVKPLMessageClient.DeserializedMessage
      {
            const deserializedMessage: TVKPLMessageClient.DeserializedMessage = { smiles: [], text: "", mention: undefined };

            for (const block of message)
            switch (block.type)
            {
                  case 'mention':
                        const blockAsBlockMention: APITypes.TMessageBlockMention = block as APITypes.TMessageBlockMention;
                        deserializedMessage.mention = 
                        { 
                              displayName: blockAsBlockMention.displayName, 
                              name: blockAsBlockMention.name, 
                              nick: blockAsBlockMention.nick, 
                              userId: blockAsBlockMention.id 
                        };

                        if ((block as APITypes.TMessageBlockMention).displayName)
                              deserializedMessage.text = deserializedMessage.text.trim() + " " + blockAsBlockMention.displayName + ", ";

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

            return deserializedMessage;
      }
}
