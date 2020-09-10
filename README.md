# Wecab 

### Web Content Aggregation Bot 网络内容聚合机器人  
#### 最好的综合型订阅制机器人  
前身是给[CQ-picfinder-robot](https://github.com/Tsuk1ko/CQ-picfinder-robot)做的小挂件（已完全脱离）  
如果有bug请复制pm2log中的错误信息并提交issus，我会尽快解决（可能） 
觉得好用不妨点个Star谢谢  

[Wiki](https://github.com/Ninzore/Wecab/wiki)  
[更新日志](https://github.com/Ninzore/Wecab/blob/master/CHANGELOG.md)

## 特色  
1. 所有不需要申请任何api，包括微博，B站，twitter，翻译，即插即用  
2. 群组分离，互不干扰  

**注意！！！**  
# MongoDB不好安装
 windows系统安装教程
 https://www.runoob.com/mongodb/mongodb-window-install.html
 
 linux-Ubuntu 18.04.4 LTS 
* wget -O mongodb-linux-x86_64-ubuntu1804-4.2.9.tar https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1804-4.2.9.tgz
* tar -zxvf mongodb-linux-x86_64-ubuntu1804-4.2.9.tar
* cd mongodb-linux-x86_64-ubuntu1804-4.2.9
* sudo cp /home/user/coolq/mongodb-linux-x86_64-ubuntu1804-4.2.9/bin/* /usr/local/bin/
* sudo mkdir -p /var/lib/mongo
* sudo mkdir -p /var/log/mongodb
* sudo chown 777 /var/lib/mongo     # Or substitute another user 我不清楚权限问题，755大概也行
* sudo chown 777 /var/log/mongodb   # Or substitute another user
* mongod --dbpath /var/lib/mongo --logpath /var/log/mongodb/mongod.log --fork

docker版 https://github.com/shitianshiwa/docker-wine-go-cqhttp

需要安装MongoDB，没装的参考官方教程https://docs.mongodb.com/manual/installation/ ，端口是默认端口不要改，然后使用mongorestore将dump文件夹中的东西恢复到mongodb中，这样才能使用小游戏功能，当然如果不用的话也可以，删除main中所有pokemon相关的语句就行  
pixiv功能是基于pixiv.cat的，默认已注释掉

## 部件列表  
正在缓慢更新中  
TODO:  
1. Pixiv订阅  
2. 接入RSSHub 
3. 从MongoDB换到SQLite
4. 小游戏更新(不存在的)  

### 1. 看微博，B站，twitter动态  
用 “看看**谁谁上条**微博/B站/twitter/推特”，谁谁是要看的人的名字，上条可以改，可以要求看置顶，上条，上上条，上上上条.....，也可以直接写第x条，x范围是0~9  
反微博小程序，会自动把微博小程序内容给抓出来，造福PC用户  
也可以用 **看看 url**，url为单条微博/B站/twitter的网址，在app里，选分享链接就好，支持b23短链接  
twitter可以在后面加>截图以使用自动截图功能，如果有字变成方块了，你可能需要安装字体，推荐安装一套Google Noto Fonts（截图已没）  

### 2. 订阅微博，B博，twitter
用 “订阅**谁谁**微博/B站/twitter”就好，取消订阅用“取消订阅**谁谁**微博/B站/twitter”，每5分钟检查一次  
用**查看微博/B站/twitter订阅**来检查目前群里订阅了哪些账号  
取消订阅时使用正则匹配，所以可以不用打全称  
在订阅微博时，可以在后面加>全部，或只看图，或>仅转发，这样就只会发送对应的内容，什么都不写默认只看原创  
在订阅B站动态时，可以在后面加>全部，或只看图，仅转发，仅原创，视频更新，什么都不写默认只看原创  
在订阅twitter时，可以在后面加>全部，或只看图，仅转发，什么都不写默认只看原创  
可以使用url进行订阅（目前仅限微博），url为用户主页或者单条微博的链接，例https://m.weibo.cn/u/1366356590 或 https://m.weibo.cn/1366356590/4490781240576326    
  
twitter相关功能在开机后会尝试测试twitter连接，如果无法连接时不会工作的  
  
### 3. 教说话 （没开） 
***注意*** 每个群的问答库都是分卡的，私聊教说话暂时无效以后可能会有这方面的更新，可以学习图片   
基础操作1. @bot 并说 **我教你**xxx > yyy，就可以学会一个问答，一个关键词可以关联多个回应词，随机抽取  
基础操作2. @bot 并说 **忘记/忘掉** xxx 就能删除关键词以及所有回应  
基础操作3. @bot 并说 **回忆/想一想/想想** xxx 就能根据回应反查提问  
基础操作4. @bot 并说 **你学过什么** 会返回所有学过的句子和匹配模式，目前设置的仅有管理员和群主可用  
  
进阶操作1. 教学的格式可变为 @bot 我教你xxx>yyy>精确/模糊/正则  
进阶操作2. 遗忘的格式同上，也可变为 @bot忘掉/忘记xxx > 精确/模糊/正则，注意在模式为正则时为模糊匹配，  
^123$只需要输入123就行了  
@bot 并说**教学成果**可以查看计数
  
### 4. 教复读 （没开）
@bot 并说 **复读**xxx，就可以学会复读  
@bot 并说 **不准复读**xxx，就可以砸掉复读机  
和上面一样也可以@bot 复读xxx>精确/模糊/正则  
@bot 并说**教学成果**可以查看计数  

### 5. Pixiv看图 （没开）
***看看p站***后接p站图片id或者包含id的url，如果该id有多图会自动合并发送，最多同时发送9张  
  由于酷Q限制无法发送4M以上大小的图，此时会发送图片链接

### 6. 翻译  
**翻译>** 后接需要翻译的外语句子，自动识别语言并翻译成中文  
**中译x>** x为目标语言，可以是日韩英法德俄，后接中文，会翻译为目标语言  
目前使用腾讯翻译

### 7. 骰子（没开）  
可以扔出任意面数（<1000），任意个数(<10)的骰子，可以指定最小值，自动统计总分  
用法的话，参考  
.dice6  扔一个D6  
.dice8x5  扔5个D8  
.dice16,10  扔1个最低为10的D16  
.dice20x3,10  扔3个最低为10的D20  

### 8.简单直接宝可梦 （没开）  
**注意！！！** 使用前必须先将下载dump然后用mongorestore存进mongoDB  
   首先一切操作都需要‘捕捉’后才能进行，所有首先进行‘捕捉’吧   
   旅行：使用旅行可以在丰源地区的52个区域中随机旅行到一个地方  
   对战：有了宝可梦之后首先就想要对战呢，@一个人然后说对战就可以对战了，获胜可以得到战利品哦  
   我现在在哪：检查当前自己的所在位置，忘了自己在什么地方的时候用吧  
   查看对战列表：可以查看当前用来对战的6只宝可梦  
   查看电脑：查看电脑来检查自己所拥有的不在列表中的宝可梦吧   
   用xxx换掉xxx：可以把电脑中的宝可梦和对战列表中的对换，用它来变化自己的对战列表吧  
   进入友好商店：进入商店可以查看自己持有的物品，查看当前商品价格  
   我要买x个xxx：进商店当然就是要买东西啦，说这句话来买东西吧，是要花钱的哦，用对战来赚取金钱吧  
   自助修复：有时抽风了的话，可以用这条指令尝试修复，说不定能好   
   除了对战，其他功能都可以私聊进行，使用***宝可梦帮助***就能查看帮助(废话   
   这游戏bug频出  
  
  
## Extra   
基于各种奇怪需求开发的部件，需要把extra文件夹中除了main的放到plugin里，并且替换之前的main  
1. 匹配句子发送音频，参考recordMsg文件  
2. 指挥机器人禁言，解除禁言，触发关键词禁言，参考zen文件  
3. 能不能好好说话，来自[nbnhhsh项目](https://github.com/itorr/nbnhhsh) 现在因为太吵了就注释掉了

## 以下内容因为版本更迭暂不支持  
### 1. twitter截图, 烤制
已脱离

### 3. 图片分类  
可以请求不同种类的P站图片，数据库为本地储存的MongoDB，setu_database里是我自己扒了10多个tag并手工删减了一些不太行的，可以用MongoDB恢复到数据库，不需要的话可以自己用pxer扒  

### 4. 看漫画  
实现了自动翻页，暂停自动翻页，跳页，手动翻页之类的功能  
可以和狗群员一起看漫画，没什么卵用，语句是 看看漫画  
需要指定本地漫画的地址（对你得把漫画下载到本地），从1.jpg开始

### 5. 获取少前新人/皮肤的大破图  
来源是少前台服官网，需要手动触发，语句为“康康新枪/皮肤”

### 6. 少前帮助  
问问题可以给出对应的NGA的网址链接  
（偷懒直接写main里面了）

### 7. 少前战区分数统计(能用，有bug，几率报错)  
也用了MongoDB...可以输入分数然后查看分数（写了一半！）
@机器人 然后用以下格式  
战区 游戏名称:xxxx；分数：xxxxxx；排行：xx  
（不用打百分号，注意用分号隔开每项内容）
