import fs from "fs-extra";
import path from "path";
import logger from "./logger";
import MD5 from "js-md5";
import axiosDirect from "axios";
import {axiosProxied} from "./axiosProxied";

async function download(url, useProxy = false) {
    const axios = useProxy ? axiosProxied : axiosDirect;
    let name = MD5(url);
    logger.info(["下载文件", url, "目标文件名", name].join(", "));
    
    //如果已经存在则直接返回路径
    for (let ext of ["jpeg", "mp4"]) {
        let tmpdir = ext == "jpeg" ? "tmp/pic" : "tmp/video";
        if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");
        if (!fs.existsSync(tmpdir)) fs.mkdirSync(tmpdir);
        
        let tmp = path.join(tmpdir, `${name}.${ext}`);
        if (fs.existsSync(tmp)) {
            logger.info("已存在文件: " + tmp);
            return path.join(__dirname, "../", tmp);
        }
    }
    
    const response = await axios({
        url: url,
        method: "GET",
        responseType: "stream",
        timeout: 3000,
    }).catch(err => {
        logger.warn("下载资源失败:", url, err);
        return false;
    });

    if (response) {
        const mimeType = response.headers["content-type"].split("/")[1];
        let mypath = "";
        let filename = `${name}.${mimeType}`;

        if (["jpeg", "png", "gif"].some(t => t == mimeType)) mypath = path.join(__dirname, "../tmp/pic", filename);
        else if (mimeType == "mp4") mypath = path.join(__dirname, "../tmp/video", filename);
        else {
            logger.warn("不支持下载的文件格式: " + mimeType, url);
            return false;
        };

        const writer = fs.createWriteStream(mypath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", () => {
                logger.info("下载资源成功: " + filename);
                resolve(mypath);
            });
            writer.on("error", err => {
                logger.warn("下载资源失败: " + url, err);
                reject(err);
            });
        });
    } else {
        logger.warn("下载资源失败:", url, err);
        return false;
    }
}

export {download};