import { useMemo, useState } from "react";

import {
  ColumnDef,
  createColumnHelper
} from '@tanstack/react-table'

import { Typography } from "../components/Typography";
import { Data, tableData } from "../data";

import Table from "../components/Table";

const columnHelper = createColumnHelper<Data>();

const Leaderboard = () => {
  const columns = useMemo<ColumnDef<Data>[]>(() => [
    columnHelper.accessor("id", {
      cell: info => <span className="font-bold dark:text-gray-50">{info.getValue()}</span>
    }),
    columnHelper.accessor("nickname", {
      header: () => <span>Nickname</span>,
      cell: info => <i>{info.getValue()}</i>,
    }),
    columnHelper.accessor("email", {
      header: () => "Email",
      cell: info => info.renderValue(),
    }),
    columnHelper.accessor("total_games", {
      header: () => <span>Total games</span>,
    }),
    columnHelper.accessor("wins", {
      header: "Wins",
    }),
    columnHelper.accessor("online", {
      header: "Status",
      cell: info => {
        const isOnline = info.getValue();
        return (isOnline ? 
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-success-500 mr-2"></div>
            <span className='text-success-500'>Online</span> 
          </div>
          :
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-error-500 mr-2"></div>
            <span className='text-error-500'>Offline</span> 
          </div>
        )
      },
    }),
  ], []);

  const [data] = useState(() => [...tableData])

  return (
    <>
      <Typography variant="h5">
        Leaderboard
      </Typography>

      <div className="h-[92%]">
        <Table columns={columns} data={data} />
      </div>
    </>
  )
};

export default Leaderboard;