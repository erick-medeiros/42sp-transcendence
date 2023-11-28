import { useState } from "react";
import { Link, useFetcher } from "react-router-dom";
import { Alert, Button, Card, Input, Typography } from "../components";
import { FiLock } from "react-icons/fi";

const LoginTFACheck = () => {
  const fetcher = useFetcher();
  const [tfaCode, setTfaCode] = useState("");

  return (
    <div className={"w-screen h-screen overflow-hidden dark bg-gray-700"}>
      <div className="h-full grid justify-center items-center">
        <div className="max-w-md">
          {fetcher.data && fetcher.data.message && (
            <Alert severity={fetcher.data.status} className="w-full mb-2">
              {fetcher.data.message.toString()}
            </Alert>
          )}
          <Card>
            <Card.Title>
              <Typography variant="h6">Two Factor Authentication</Typography>
            </Card.Title>
            <Card.Body className="!px-10 pb-5">
              <fetcher.Form method="POST">
                <Input
                  type="text"
                  LeadingIcon={<FiLock />}
                  helperText="Enter the code generated by your authentication app"
                  placeholder=""
                  name="tfaCode"
                  value={tfaCode}
                  onChange={(e) => setTfaCode(e.target.value)}
                  required={true}
                />
                <div className="flex justify-center mt-4">
                  <Button variant="primary" type="submit" className="px-10">
                    Confirm
                  </Button>
                </div>
              </fetcher.Form>
            </Card.Body>
            <Card.Footer position="center">
              <Link to="/login/tfa-recover">
                <Typography variant="md">Use a recovery code</Typography>
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginTFACheck;
