interface Env {
  SCM_QUEUE: Queue;
  KV_APP: KVNamespace;
}

export default {
  async fetch(request: Request, env): Promise<Response> {
    let encoder = new TextEncoder();
    function hexToBytes(hex) {
      // hexToBytes is a function which takes a hex value and converts it to bytes

      let len = hex.length / 2;
      // Create a new byte array of the size of the length
      let bytes = new Uint8Array(len);

      let index = 0;
      for (let i = 0; i < hex.length; i += 2) {
        let c = hex.slice(i, i + 2);
        let b = parseInt(c, 16);
        // update the bytes array
        bytes[index] = b;
        index += 1;
      }
      return bytes;
    }

    function rawHtmlResponse(html: string) {
      // rawHtmlResponse is a function which simply returns an html response
      return new Response(html, {
        headers: { "content-type": "text/html;charset=UTF-8", },
      });
    }

    async function verifySignature(secret, header, payload) {
      // verifySignature is an async function which verifies the payload with a shared secret used to provide a signature in the header.

      let parts = header.split("=");
      // the hex-encoded github signature is in the second part of the headers
      let sigHex = parts[1];

      let algorithm = {
        name: "HMAC", hash: {
          name: "SHA-256"
        }
      };

      // convert the secret to bytes
      let keyBytes = encoder.encode(secret);
      let extractable = false;
      let key = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        algorithm, extractable, ["sign", "verify"]
      );

      let sigBytes = hexToBytes(sigHex);
      let dataBytes = encoder.encode(payload);
      // If the data is signed by the same key, we can verify the payload
      let equal = await crypto.subtle.verify(
        algorithm.name,
        key,
        sigBytes,
        dataBytes
      );

      // return true if verified, false if not
      return equal;

    }

    // now read the actual request
    async function readRequestBody(request) {
      return true;
    }

    let headers = JSON.stringify([...request.headers], null, 2);
    console.log(`Headers: ${headers}`);
    if (request.method === "GET") {
      return new Response("OK", { status: 226 });
    }
    else if (request.method === "POST") {
      console.log("POST")
      // Get the webhook secret from KV

       const secret = await env.KV_APP.get('webhook_secret')
      await env.SCM_QUEUE.send(request.body)
      return new Response("OK POST", { status: 201})
    }
  },
} satisfies ExportedHandler<Env>;
