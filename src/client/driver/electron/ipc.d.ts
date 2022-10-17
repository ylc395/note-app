export declare const IPC_CHANNEL = "fakeHttp";
export interface IpcRequest {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string>;
}
export interface IpcResponse<T = unknown> {
    status: number;
    body?: T;
    headers?: Record<string, string>;
}
