import { describe, expect, test } from "vitest";
import type { APITypes } from "../types/api.js";
import { VkplMessageParser } from "./VkplMessageParser.js";

describe("Message service", () => {
      const messageService = new VkplMessageParser(new Map<string, string>([["Tlen", "6cbbcf8a-58cc-4afb-857a-e3f89f6049a6"]]));

      test("serialize message", () => {
            const message = "это паста Tlen Tlen RatJam RatJam https://github.com/ [скрытая ссылка](https://boosty.to) [скрытая ссылка 2](https://boosty.to) [](https://boosty.to)";

            expect(messageService.serialize(message)).toEqual([
                  {
                        type: 'text',
                        content: '["это паста ","unstyled",[]]',
                        modificator: ''
                  },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  {
                        type: 'smile',
                        id: '6cbbcf8a-58cc-4afb-857a-e3f89f6049a6',
                        name: 'Tlen'
                  },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  {
                        type: 'smile',
                        id: '6cbbcf8a-58cc-4afb-857a-e3f89f6049a6',
                        name: 'Tlen'
                  },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  {
                        type: 'text',
                        content: '["RatJam RatJam ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["https://github.com/","unstyled",[]]',
                        url: 'https://github.com/'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["скрытая ссылка","unstyled",[]]',
                        url: 'https://boosty.to'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["скрытая ссылка 2","unstyled",[]]',
                        url: 'https://boosty.to'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["https://boosty.to","unstyled",[]]',
                        url: 'https://boosty.to'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
            ]);
      });

      test("deserialize message", () => {
            const message = [
                  {
                        type: 'text',
                        content: '["это паста ","unstyled",[]]',
                        modificator: ''
                  },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  {
                        type: 'smile',
                        id: '6cbbcf8a-58cc-4afb-857a-e3f89f6049a6',
                        name: 'Tlen'
                  },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  {
                        type: 'smile',
                        id: '6cbbcf8a-58cc-4afb-857a-e3f89f6049a6',
                        name: 'Tlen'
                  },
                  { type: 'text', content: '', modificator: 'BLOCK_END' },
                  {
                        type: 'text',
                        content: '["RatJam RatJam ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["https://github.com/","unstyled",[]]',
                        url: 'https://github.com/'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["скрытая ссылка","unstyled",[]]',
                        url: 'https://boosty.to'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["скрытая ссылка 2","unstyled",[]]',
                        url: 'https://boosty.to'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
                  {
                        explicit: false,
                        type: 'link',
                        content: '["https://boosty.to","unstyled",[]]',
                        url: 'https://boosty.to'
                  },
                  {
                        type: 'text',
                        content: '[" ","unstyled",[]]',
                        modificator: ''
                  },
            ] satisfies APITypes.TMessageBlock[];

            const deserializedMessage = VkplMessageParser.deserialize(message);
            expect(deserializedMessage.text).toEqual("это паста Tlen Tlen RatJam RatJam https://github.com/ скрытая ссылка скрытая ссылка 2 https://boosty.to");
            expect(deserializedMessage.smiles.length).toEqual(2);
            expect(deserializedMessage.mentions.length).toEqual(0);
            expect(deserializedMessage.links.length).toEqual(4);
      });
});
