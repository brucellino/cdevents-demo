export default {
  async fetch(request, env) {
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

    async function verifySignature(secret, header, payload) {
      // verifySignature is an async function which verifies the payload with a shared secret used to provide a signature in the header.

      let parts = header.split("=");
      // the hex-encoded github signature is in the second part of the headers
      let sigHex = parts[1];
      let algorithm = {
        name: "HMAC",
        hash: {
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

      console.log(equal)

      // return true if verified, false if not
      return equal;
    }

    let headersObject = Object.fromEntries(request.headers);
    let headers = JSON.stringify(headersObject, null, 2)

    // console.log(`Headers: ${headers}`);

    if (request.method === "GET") {
      return new Response("OK", { status: 226 });
    }

    else if (request.method === "POST") {
      const payload = await request.clone().text();
      const secret = env.WEBHOOK_SECRET;
      // If we got the POST from Github
      if ('x-github-delivery' in headersObject) {
        console.log("Verifying payload.")
        const valid_payload = await verifySignature(
          secret,
          headersObject['x-hub-signature-256'],
          payload
        );

        if (valid_payload) {
          console.log("Payload verified")
          try {
            await env.QUEUE.send(payload)
          } catch (e) {
            console.log(`Failed top send message with ${e}`)
            return Response.json({error: e.message }, {status: 500})
          }

          return new Response("OK POST", { status: 201 })
        } else {
          console.log("Github Payload not verified")
          return new Response("NO", { status: 422 })
        }
      }
    }
  },
};
