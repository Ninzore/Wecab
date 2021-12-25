#!/bin/bash

###############################################################################################
# 仅ubuntu20.04可用，其他版本需修改mongodb部分的url                                                #
# 脚本安装的mongodb版本为4.4.2，如果需要安装最新版请卸载脚本安装的mongodb并参考mongodb官方文档重新安装     #
# 或在运行脚本前按照官方文档修改脚本mongodb部分                                                      #
# 因为cqhttp的限制，暂时无法通过脚本达成首次启动时更新cqhttp的目的，同时也无法通过脚本来首次启动cqhttp      #
# cqhttp版本为v1.0.0-beta8-fix2，如有新版请根据需求手动更新                                         #
# 脚本仅安装wecab和cqhttp，安装完成后需手动启动                                                     #
###############################################################################################
########################################################################
#                            version:0.0.1                             #
########################################################################

# screen_cq=$"cq"
# screen_wecab=$"wecab"
# CMD_UPDATE=$"sudo ./go-cqhttp update"
# CMD_CQ=$"sudo ./go-cqhttp faststart"
# CMD_WECAB=$"sudo npm run start"

sudo apt-get install git screen gnupg
cd /home
#install&start mongodb
sudo apt-get autoremove mongodb
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org=4.4.2 mongodb-org-server=4.4.2 mongodb-org-shell=4.4.2 mongodb-org-mongos=4.4.2 mongodb-org-tools=4.4.2
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl status mongod
sudo systemctl enable mongod
#install cqhttp v1.0.0-beta8-fix2
read -p "请输入cqhttp安装路径（绝对路径）:" CQ_PATH
cd $CQ_PATH
sudo mkdir cqhttp & cd cqhttp
sudo wget https://github.com/Mrs4s/go-cqhttp/releases/download/v1.0.0-beta8-fix2/go-cqhttp_linux_amd64.tar.gz
sudo tar -zxvf go-cqhttp_linux_amd64.tar.gz
sudo rm go-cqhttp_linux_amd64.tar.gz LICENSE README.md
sudo chmod +x go-cqhttp
#install wecab
read -p "请输入wecab安装路径（绝对路径）:" WECAB_PATH
cd $WECAB_PATH
cp config.default.json config.json
sudo apt-get install npm
sudo npm i pm2
sudo npm i