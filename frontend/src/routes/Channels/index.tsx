import { useContext, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Chat } from "../../types";

import Table from "../../components/Table";
import { Typography } from "../../components";
import { Data } from "../../data";
import { AuthContext } from "../../contexts";

import ActionChannelButton from "./ActionChannelButton";

const columnHelper = createColumnHelper<Chat>();

export default function Channels() {
  const { currentUser } = useContext(AuthContext);
  const chats = useLoaderData() as Chat[];
  const channels = chats.filter((chat) => chat.type !== "direct");

  const columns = useMemo<ColumnDef<Chat>[]>(
    () => [
      columnHelper.accessor("createdByUser", {
        header: "Owner",
        cell: (props) => {
          const member = props.row.original.users.find(
            (user) => user.userId === props.getValue()
          );

          return <span>{member.user.nickname ?? "Deleted user"}</span>;
        },
      }),
      columnHelper.accessor("access", {
        header: "Access",
        cell: (props) => <span>{props.getValue()}</span>,
      }),
      columnHelper.accessor("id", {
        header: "Actions",
        cell: (props) => {
          const users = props.row.original.users;
          const id = props.getValue();
          const access = props.row.original.access;
          const isOwner = props.row.original.createdByUser === currentUser.id;
          const isMember = users.some((user) => user.userId === currentUser.id);

          return (
            <ActionChannelButton
              id={id}
              access={access}
              isMember={isMember}
              isOwner={isOwner}
            />
          );
        },
      }),
    ],
    [currentUser.id]
  );

  return (
    <>
      <Typography variant="h5">Channels</Typography>
      <div className="mt-6">
        <Table
          columns={columns as unknown as ColumnDef<Data>[]}
          data={channels as unknown as Data[]}
        />
      </div>
    </>
  );
}