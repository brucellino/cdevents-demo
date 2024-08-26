// class cdEvent {
//   constructor(header, payload) {
//     this.event = Object();
//   }
// }

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

    function createChangeEvent(payload, headers) {
      // initialize the return object
      let msg = {
        context: {},
        subject: {},
      };
      let timestamp = new Date(payload["pull_request"]["updated_at"]).getTime();
      let context = {};
      let subject = {};
      context.version = "0.4.1";
      context.id = headers["x-github-delivery"];
      context.chainId = "";
      context.source = "github/" + payload["repository"]["full-name"];
      context.type = "dev.cdevents.created.0.3.0";
      context.timestamp = timestamp;
      context.schemaUri = "https://raw.githubusercontent.com/cdevents/spec/main/schemas/changecreated.json";
      context.links = [];


      subject.id = headers["x-github-delivery"];
      subject.source = "github/" + payload["repository"]["full-name"];
      subject.type = "change";
      subject.content = {
        description: payload["pull_request"]["title"],
        repository: {
          id: payload["repository"]["full_name"],
          source: "https://github.com/",
        },
      };
      msg['context'] = context;
      msg['subject'] = subject;

      return msg;
    };
    function updateChangeEvent(payload, headers) {
      let msg = {};
      return msg;
    };
    function abandonChangeEvent(payload, headers) {
      let msg = {};
      return msg;
    };
    function mergeChangeEvent(payload, headers) {
      let msg = {};
      return msg;
    };

    async function verifySignature(secret, header, payload) {
      // verifySignature is an async function which verifies the payload with a shared secret used to provide a signature in the header.

      let parts = header.split("=");
      // the hex-encoded github signature is in the second part of the headers
      let sigHex = parts[1];
      let algorithm = {
        name: "HMAC",
        hash: {
          name: "SHA-256",
        },
      };
      // convert the secret to bytes
      let keyBytes = encoder.encode(secret);
      let extractable = false;
      let key = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        algorithm,
        extractable,
        ["sign", "verify"]
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
      return equal;
    }

    let msg = {};
    let headersObject = Object.fromEntries(request.headers);
    // let headers = JSON.stringify(headersObject, null, 2)
    // console.log(`Headers: ${headers}`);

    if (request.method === "GET") {
      return new Response("OK", { status: 226 });
    } else if (request.method === "POST") {
      const payload = await request.clone().json();
      const secret = env.WEBHOOK_SECRET;
      // If we got the POST from Github
      if ("x-github-delivery" in headersObject) {
        console.log("Verifying payload.");
        const valid_payload = await verifySignature(
          secret,
          headersObject["x-hub-signature-256"],
          JSON.stringify(payload)
        );

        if (valid_payload) {
          console.log("Payload verified");
          var eventType;
          // Check event type
          const githubEvent = headersObject["x-github-event"];
          if (githubEvent == 'pull_request') {
            const action = payload["action"];
            /* change event types -
              - change created
              - change updated
              - change reviewed
              - change merged
              - change abandoned
            */
            switch (action) {
              case "opened":
                eventType = "created";
                msg = createChangeEvent(payload, headersObject);
                break;
              case "edited":
              case "labeled":
              case "milestoned":
              case "review_requested":
              case "synchronize":
              case "reopened":
              case "ready_for_review":
              case "review_request_removed":
              case "assigned":
              case "unassigned":
              case "unlabeled":
              case "unlocked":
                eventType = "updated";
                msg = updateChangeEvent(payload, headersObject);
              case "closed":
                // how was this PR closed? Merged or abandoned
                closeEvent = payload["pull_request"]["merged"];
                switch (closeEvent) {
                  case null:
                  case false:
                    eventType = "abandoned";
                    msg = abandonChangeEvent(payload, headersObject);
                    break;
                  case true:
                    eventType = "merged";
                    msg = mergeChangeEvent(payload, headersObject);
                    break;
                }
              default:
                // event not identified
                msg = {};
                break;
            }
            // event should trigger a payload
            console.log(`A cdEvent has occurred: ${githubEvent}`);
            // send to queue
            try {
              await env.QUEUE.send(msg);
            } catch (e) {
              console.log(`Failed top send message with ${e}`);
              return Response.json({ error: e.message }, { status: 500 });
            }
            return new Response("OK POST", { status: 201 });
          } else {
            return new Response("OK POST, no trigger", { status: 200 });
          } // not a triggering event
        } else {
          console.log("Github Payload not verified");
          return new Response("NO", { status: 422 });
        } // signature did not match.
      }
    }
  },
};
