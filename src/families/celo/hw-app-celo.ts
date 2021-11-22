import Eth from "@ledgerhq/hw-app-eth";
import { splitPath, foreach } from "@ledgerhq/hw-app-eth/lib/utils";
import { decode, encode } from "rlp";

/**
 * Copied from celo-web-wallet, which in turn reused hw-app-eth/src/Eth.js
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export class CeloApp extends Eth {
  constructor(transport: any) {
    super(transport);
  }

  signTransaction(
    path: string,
    rawTxHex: string
  ): Promise<{
    s: string;
    v: string;
    r: string;
  }> {
    const paths = splitPath(path);
    const rawTx = Buffer.from(rawTxHex, "hex");
    const toSend: Buffer[] = [];
    let offset = 0;
    let response: any;

    const rlpTx = decode(rawTx);
    let rlpOffset = 0;
    if (rlpTx.length > 6) {
      const rlpVrs = encode(rlpTx.slice(-3));
      rlpOffset = rawTx.length - (rlpVrs.length - 1);
    }

    while (offset !== rawTx.length) {
      const maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;
      if (rlpOffset != 0 && offset + chunkSize == rlpOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize--;
      }
      const buffer = Buffer.alloc(
        offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize
      );
      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }

    return foreach(toSend, (data, i) =>
      this.transport
        .send(0xe0, 0x04, i === 0 ? 0x00 : 0x80, 0x00, data)
        .then((apduResponse: any) => {
          response = apduResponse;
        })
    ).then(
      () => {
        const v = response.slice(0, 1).toString("hex");
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");

        return { v, r, s };
      },
      (e) => {
        throw e;
      }
    );
  }
}
