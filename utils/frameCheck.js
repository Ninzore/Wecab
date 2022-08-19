import logger from "./logger" //日志功能
import {promisify} from "util";
const exec = promisify(require('child_process').exec);

export async function frameCheck(file, limit = 300) {
    let cmd = file.endsWith(".gif")
        ? `ffmpeg -hide_banner -i "${file}" -f null -`
        : `ffmpeg -hide_banner -i "${file}" -map 0:v:0 -c copy -f null -`;

    return exec(cmd).then(async res => {
        let frames = /frame=\s(\d+)\sfps/.exec(res.stderr)[1];
        return frames <= limit;
    }).catch(err => {
        logger.error("gifCheck " + err);
        return false;
    });
}
