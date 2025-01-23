import { useState, MouseEvent, useRef } from "react";
import Cookies from "js-cookie";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { escapeLike } from "@rocicorp/zero";
import { Schema } from "../schema";
import { randomMessage } from "../test-data";
import { randInt } from "../rand";
import { useInterval } from "../use-interval";
import { formatDate } from "../date";
import { createFileRoute } from "@tanstack/react-router";
import { Box, createListCollection, Field, HStack, Input, Text } from "@chakra-ui/react";
import { Button, EmptyState, GridList, Select } from "@saas-ui/react";

export const Route = createFileRoute("/")({
  component: () => <App />,
}); 

function App() {
  const z = useZero<Schema>();
  const [users] = useQuery(z.query.user);
  const [mediums] = useQuery(z.query.medium);

  const [filterUser, setFilterUser] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");

  const all = z.query.message;
  const [allMessages] = useQuery(all);

  let filtered = all
    .related("medium", (medium) => medium.one())
    .related("sender", (sender) => sender.one())
    .orderBy("timestamp", "desc");

  if (filterUser) {
    filtered = filtered.where("senderID", filterUser);
  }

  if (filterText) {
    filtered = filtered.where("body", "LIKE", `%${escapeLike(filterText)}%`);
  }

  const [filteredMessages] = useQuery(filtered);

  const hasFilters = filterUser || filterText;
  const [action, setAction] = useState<"add" | "remove" | undefined>(undefined);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const deleteRandomMessage = () => {
    if (allMessages.length === 0) {
      return false;
    }
    const index = randInt(allMessages.length);
    z.mutate.message.delete({ id: allMessages[index].id });

    return true;
  };

  const addRandomMessage = () => {
    z.mutate.message.insert(randomMessage(users, mediums));
    return true;
  };

  const handleAction = () => {
    if (action === "add") {
      return addRandomMessage();
    } else if (action === "remove") {
      return deleteRandomMessage();
    }

    return false;
  };

  useInterval(
    () => {
      if (!handleAction()) {
        setAction(undefined);
      }
    },
    action !== undefined ? 1000 / 60 : null
  );

  const INITIAL_HOLD_DELAY_MS = 300;
  const handleAddAction = () => {
    addRandomMessage();
    holdTimerRef.current = setTimeout(() => {
      setAction("add");
    }, INITIAL_HOLD_DELAY_MS);
  };

  const handleRemoveAction = (e: MouseEvent | React.TouchEvent) => {
    if (z.userID === "anon" && "shiftKey" in e && !e.shiftKey) {
      alert("You must be logged in to delete. Hold shift to try anyway.");
      return;
    }
    deleteRandomMessage();

    holdTimerRef.current = setTimeout(() => {
      setAction("remove");
    }, INITIAL_HOLD_DELAY_MS);
  };

  const stopAction = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setAction(undefined);
  };

  const editMessage = (
    e: MouseEvent,
    id: string,
    senderID: string,
    prev: string
  ) => {
    if (senderID !== z.userID && !e.shiftKey) {
      alert(
        "You aren't logged in as the sender of this message. Editing won't be permitted. Hold the shift key to try anyway."
      );
      return;
    }
    const body = prompt("Edit message", prev);
    z.mutate.message.update({
      id,
      body: body ?? prev,
    });
  };

  const toggleLogin = async () => {
    if (z.userID === "anon") {
      await fetch("/api/login");
    } else {
      Cookies.remove("jwt");
    }
    location.reload();
  };

  // If initial sync hasn't completed, these can be empty.
  if (!users.length || !mediums.length) {
    return null;
  }

  const user = users.find((user) => user.id === z.userID)?.name ?? "anon";

  const userCollection = createListCollection({
    items: users
  });

  return (
    <>
      <HStack px="4" py="2">
        <HStack flex="1">
          <Button
            onMouseDown={handleAddAction}
            onMouseUp={stopAction}
            onMouseLeave={stopAction}
            onTouchStart={handleAddAction}
            onTouchEnd={stopAction}
          >
            Add Messages
          </Button>
          <Button
            onMouseDown={handleRemoveAction}
            onMouseUp={stopAction}
            onMouseLeave={stopAction}
            onTouchStart={handleRemoveAction}
            onTouchEnd={stopAction}
          >
            Remove Messages
          </Button>
          <em>(hold down buttons to repeat)</em>
        </HStack>
        <HStack
          justifyContent="end"
        >
          {user === "anon" ? "" : `Logged in as ${user}`}
          <Button onMouseDown={() => toggleLogin()}>
            {user === "anon" ? "Login" : "Logout"}
          </Button>
        </HStack>
      </HStack>

      <Box px="4" py="2">

        <HStack mb="4">
      <Field.Root>
        <Field.Label>From</Field.Label>
        <Select.Root
          collection={userCollection}
            onValueChange={({value}) => setFilterUser(value[0])}
            
          >
            <Select.Trigger>
              <Select.ValueText />  
            </Select.Trigger>
            <Select.Content>
            {userCollection.items.map((user) => (
              <Select.Item key={user.id} item={user}>
                {user.name}
              </Select.Item>
            ))}
            </Select.Content>
          </Select.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Contains</Field.Label>
          <Input
            type="text"
            placeholder="message"
            onChange={(e) => setFilterText(e.target.value)}
          />
        </Field.Root>
        </HStack>
 
      <Box>
        <Text fontSize="sm" color="fg.muted">
          {!hasFilters ? (
            <>Showing all {filteredMessages.length} messages</>
          ) : (
            <>
              Showing {filteredMessages.length} of {allMessages.length}{" "}
              messages. Try opening{" "}
              <a href="/" target="_blank">
                another tab
              </a>{" "}
              to see them all!
            </>
          )}
        </Text>
      </Box>
      {filteredMessages.length === 0 ? (
        <EmptyState title="No posts found 😢" />
      ) : (
        <GridList.Root>
            {filteredMessages.map((message) => (
              <GridList.Item key={message.id}>
                <GridList.Cell flex="1">
                {message.sender?.name}
                </GridList.Cell>
                <GridList.Cell flex="1" lineClamp={2} width="400px">
                {message.body}
                </GridList.Cell>
                <GridList.Cell width="120px">
                {message.medium?.name}
                </GridList.Cell>
                <GridList.Cell color="fg.muted" width="150px">
                {formatDate(message.timestamp)}
                </GridList.Cell>
                <GridList.Cell>
                  <Button onClick={(e) => editMessage(e, message.id, message.senderID, message.body)}>Edit</Button>
                </GridList.Cell>
              </GridList.Item>
            ))}
          </GridList.Root>
      )}
      </Box>
    </>
  );
}
