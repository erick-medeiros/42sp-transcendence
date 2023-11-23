import { Link, useLoaderData } from "react-router-dom";
import { User } from "../types";
import { Avatar } from "../components/Avatar";
import Table from "../components/Table";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Data } from "../data/tableData";
import { Button } from "../components/Button";
import { BsFillChatDotsFill } from "react-icons/bs";
import { Typography } from "../components/Typography";
import { InviteGameButton } from "../components";

const columnHelper = createColumnHelper<User>();

export default function Friends() {
  const loaderData = useLoaderData() as User[];
  const data = loaderData;

  const columns = [
    columnHelper.accessor("nickname", {
      cell: (info) => (
        <Link
          to={`/profile/${info.row.original.id}`}
          className="flex items-center"
        >
          <Avatar
            className="mr-2"
            seed={info.row.original.login}
            size="sm"
            src={info.row.original.avatarUrl}
          />
          {info.getValue()}
        </Link>
      ),
    }),

    columnHelper.accessor("id", {
      header: "Actions",
      cell: (props) => {
        return (
          <div className="flex space-x-1">
            <Link to={`/chats/with/${props.row.original.id}`}>
              <Button
                variant="info"
                size="sm"
              >
                Chat
              </Button>
            </Link>
            <InviteGameButton user={props.row.original} />
          </div>
        )
      }
    }),
  ];

  return (
    <>
      <Typography variant="h5" className="mb-6">
        Friends
      </Typography>

      <Table
        columns={columns as unknown as ColumnDef<Data>[]}
        data={data as unknown as Data[]}
      />
    </>
  );
}
