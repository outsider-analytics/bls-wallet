import {
  Provider,
  TransactionRequest,
  TransactionResponse,
} from "https://cdn.skypack.dev/@ethersproject/abstract-provider@5.4.0?dts";
import {
  Signer,
  TypedDataDomain,
  TypedDataField,
  TypedDataSigner,
} from "https://cdn.skypack.dev/@ethersproject/abstract-signer@5.4.0?dts";
import { Bytes } from "https://cdn.skypack.dev/@ethersproject/bytes@5.4.0?dts";
import {
  Network,
  Networkish,
} from "https://cdn.skypack.dev/@ethersproject/networks@5.4.0?dts";
import { Deferrable } from "https://cdn.skypack.dev/@ethersproject/properties@5.4.0?dts";
import { AccessList } from "https://cdn.skypack.dev/@ethersproject/transactions@5.4.0?dts";
import { ConnectionInfo } from "https://cdn.skypack.dev/@ethersproject/web@5.4.0?dts";
import { BaseProvider, Event } from "./base-provider.d.ts";
export declare class JsonRpcSigner extends Signer implements TypedDataSigner {
  readonly provider: JsonRpcProvider;
  _index: number;
  _address: string;
  constructor(
    constructorGuard: any,
    provider: JsonRpcProvider,
    addressOrIndex?: string | number,
  );
  connect(provider: Provider): JsonRpcSigner;
  connectUnchecked(): JsonRpcSigner;
  getAddress(): Promise<string>;
  sendUncheckedTransaction(
    transaction: Deferrable<TransactionRequest>,
  ): Promise<string>;
  signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>;
  sendTransaction(
    transaction: Deferrable<TransactionRequest>,
  ): Promise<TransactionResponse>;
  signMessage(message: Bytes | string): Promise<string>;
  _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
  ): Promise<string>;
  unlock(password: string): Promise<boolean>;
}
declare class UncheckedJsonRpcSigner extends JsonRpcSigner {
  sendTransaction(
    transaction: Deferrable<TransactionRequest>,
  ): Promise<TransactionResponse>;
}
export declare class JsonRpcProvider extends BaseProvider {
  readonly connection: ConnectionInfo;
  _pendingFilter: Promise<number>;
  _nextId: number;
  _eventLoopCache: Record<string, Promise<any>>;
  get _cache(): Record<string, Promise<any>>;
  constructor(url?: ConnectionInfo | string, network?: Networkish);
  static defaultUrl(): string;
  detectNetwork(): Promise<Network>;
  _uncachedDetectNetwork(): Promise<Network>;
  getSigner(addressOrIndex?: string | number): JsonRpcSigner;
  getUncheckedSigner(addressOrIndex?: string | number): UncheckedJsonRpcSigner;
  listAccounts(): Promise<Array<string>>;
  send(method: string, params: Array<any>): Promise<any>;
  prepareRequest(method: string, params: any): [string, Array<any>];
  perform(method: string, params: any): Promise<any>;
  _startEvent(event: Event): void;
  _startPending(): void;
  _stopEvent(event: Event): void;
  static hexlifyTransaction(transaction: TransactionRequest, allowExtra?: {
    [key: string]: boolean;
  }): {
    [key: string]: string | AccessList;
  };
}
export {};
//# sourceMappingURL=json-rpc-provider.d.ts.map
