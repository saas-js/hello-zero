import { useQuery, useZero } from "@rocicorp/zero/react";
import { Schema } from "./schema";
import { ChangeEvent } from "react";
import "./App.css";

function App() {
  const z = useZero<Schema>();
  const dax = useQuery(z.query.user.where("name", "Dax").one());
  const cool = useQuery(z.query.user.where("name", "!=", "Dax"));
  const mediums = useQuery(z.query.medium);
  const messages = useQuery(
    z.query.message
      .related("sender", (sender) => sender.one())
      .related("replies", (replies) =>
        replies
          .related("sender", (sender) => sender.one())
          .related("medium", (medium) => medium.one())
          .orderBy("timestamp", "asc")
      )
      .related("medium", (med) => med.one())
      .orderBy("timestamp", "asc")
  );

  // If initial sync hasn't completed, these can be empty.
  if (!dax || !mediums.length || !cool.length) {
    return null;
  }

  // TODO: ZQL needs is / is-not null.
  // Then this could go in the query above.
  const requests = messages.filter((message) => message.replyToID === null);

  const randBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min) + min);
  const randInt = (max: number) => randBetween(0, max);
  const randID = () => Math.random().toString(36).slice(2);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const prevSize = requests.length;
    const newSize = parseInt(e.currentTarget.value);
    const requestsOpts = [
      "Hey guys, is the zero package ready yet?",
      "I tried installing the package, but it's not there.",
      "The package does not install...",
      "Hey Nate, can you ask Aaron when the npm package will be ready?",
      "npm npm npm npm npm",
      "n --- p --- m",
      "npm wen",
      "npm package?",
    ];
    const responseOpts = [
      "It will be ready next week",
      "We'll let you know",
      "It's not ready - next week",
      "Aaron says next week",
      "Didn't we say next week",
      "I could send you a tarball, but it won't work",
    ];
    if (newSize < prevSize) {
      for (let i = newSize; i < prevSize; i++) {
        z.mutate.message.delete({ id: messages[i].id });
      }
    } else if (newSize > prevSize) {
      for (let i = prevSize; i <= newSize; i++) {
        const id = randID();
        const numReplies = randBetween(-2, 2);
        const mediumID = mediums[randInt(mediums.length)].id;
        const timestamp = randBetween(1727395200000, 1728180000000);
        z.mutate.message.create({
          id,
          senderID: dax.id,
          mediumID,
          body: requestsOpts[randInt(requestsOpts.length)],
          timestamp,
          // TODO: You should be able to omit optional fields.
          replyToID: undefined,
        });
        for (let j = 0; j < numReplies; j++) {
          z.mutate.message.create({
            id: randID(),
            senderID: cool[randInt(cool.length)].id,
            mediumID,
            body: responseOpts[randInt(responseOpts.length)],
            timestamp: timestamp + randBetween(60 * 1000, 60 * 60 * 1000),
            replyToID: id,
          });
        }
      }
    }
  };

  const dateStr = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          background: "rgba(36, 36, 36, 0.9)",
          padding: "1rem",
          width: "100%",
        }}
      >
        <h2>Poast</h2>
        <input
          type="range"
          onChange={handleChange}
          style={{ width: 250 }}
          defaultValue={0}
          max={50}
        />
      </div>
      {requests.length === 0 ? (
        <h3>
          <em>No posts found 😢</em>
        </h3>
      ) : (
        <table border={1} cellSpacing={0} cellPadding={6}>
          <thead>
            <tr>
              <th>Sender</th>
              <th>Medium</th>
              <th>Message</th>
              <th>Sent</th>
            </tr>
          </thead>
          {requests.map((message) => (
            <tbody key={message.id}>
              <tr>
                <td align="left">{message.sender?.name}</td>
                <td align="left">{message.medium?.name}</td>
                <td align="left">{message.body}</td>
                <td align="right">{dateStr(message.timestamp)}</td>
              </tr>
              {message.replies.map((reply) => (
                <tr key={reply.id}>
                  <td align="left">↪ {reply.sender?.name}</td>
                  <td align="left">{reply.medium?.name}</td>
                  <td align="left">{reply.body}</td>
                  <td align="right">{dateStr(message.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      )}
    </>
  );
}

export default App;
