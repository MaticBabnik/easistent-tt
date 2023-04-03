import { Config } from "./config";
import School from "./School";
import { request, gql } from "graphql-request";
const query = gql`
    mutation sendData($data: String!, $secret: String!) {
        sendData(data: $data, secret: $secret)
    }
`;

export default function main(cfg: Config) {
    console.log("Staring client");

    const school = new School(
        cfg.schoolId as number,
        cfg.schoolPublicId as string
    );
    school.setup();
    school.on("parsing-done", () => {
        request(cfg.masterUrl as string, query, {
            secret: cfg.secret,
            data: JSON.stringify(school.getData()),
        })
            .then((data) => {
                console.log(data);
            })
            .catch((err) => {
                console.error(err);
            });
    });
}
