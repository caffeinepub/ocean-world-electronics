// Stub: ICP StorageClient removed. Image uploads use Firebase Storage or base64.
export class StorageClient {
  async upload(_file: File): Promise<string> {
    return "";
  }
  async getUrl(_id: string): Promise<string> {
    return "";
  }
}
