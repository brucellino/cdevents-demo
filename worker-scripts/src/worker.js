// class cdEvent {
//   constructor(header, payload) {
//     this.event = Object();
//   }
// }
export default {
  async fetch(request, env) {
    const githubTriggerEvents = [
      "check_run",
      "issue_comment",
      "issues",
      "label",
      "pull_request",
      "pull_request_review",
      "push",
      "registry_package",
      "release",
      "workflow_job",
      "workflow_run",
    ];
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

    function constructCDEvent(type, payload, headers) {
      // This constructs a SCM event:
      // https://github.com/cdevents/spec/blob/v0.4.1/source-code-version-control.md

      // create the variable that we will use to return the event.
      // We do not yet know what kind of event it is specifically
      // but since it's coming from github, we can assume it's an
      // scm type of event.
      let cdEvent = {
        context: {
          version: "0.4.1",
          id: headers["x-github-delivery"],
          chainId: "",
          source: `https://github.com/${payload["repo"]["full_name"]}`,
          type: "",
          timestamp: "",
          schemaUri: "",
          links: [],
        },
        subject: {
          id: "",
          source: "",
          type: "",
          content: {},
        },
      };
      console.log("constructing CD Event from Github Event");
      // constructCDEvent(event) depending on what kind of event occurred.
      cdEvent.context.id = headers["x-github-delivery"];
      cdEvent.context.source = payload["repository"]["full_name"];
      // cdEvent.context.source = githubEvent.
      switch (githubEvent) {
        case "pull_request":
          // handlePullRequest -> created, reviewed, updated, merged, abandoned
          cdEvent.context.type = "change";

          break;
        case "pull_request_review":
          break;
        case "push":
          // check branch
          console.log("A push event occurred. We may need to transport this.");

        case "registry_package":
          break;
        case "release":
          break;
        default:
          console.log("Hit the default somehow. this should not be possible.");
          break;
      } // switch on type of event
      const source = "https://github.com/";
      const type = "";

      const repository = {
        name: payload["repository"]["full_name"],
        type: "repository",
      };
      const branch = {};
      const context = {};

      // const cdEvent = {
      //   id: headers["x-github-delivery"],
      //   type: "",
      //   source: source,
      //   timestamp: "",
      //   version: "",
      // };

      return cdEvent;
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
          // Check event type
          const githubEvent = headersObject["x-github-event"];

          if (githubTriggerEvents.includes(githubEvent)) {
            msg = constructCDEvent(payload, headersObject);
            // event should trigger a payload
            console.log(`A cdEvent has occurred: ${githubEvent}`);
            // send to queue
            try {
              // await env.QUEUE.send(payload);
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
