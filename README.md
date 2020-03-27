# CQ-picfinder-robot-add-on

给Tsuk1ko的CQ-picfinder-robot V2.11做了几个小挂件，基本稳定，至少目前看起来很稳而且从没翻车  
如果有bug请复制pm2log中的错误信息并提交issus，我会尽快解决（可能）
  
[更新日志](https://github.com/Ninzore/CQ-picfinder-robot-add-on/blob/master/CHANGELOG.md)
   
   **注意！！！**
1. main基于V2.11.11修改，2.11.11可以直接复制main.js，~~2.11.11版以外的版本需要把main_edit.js里面的东西复制到main的337行左右~~ 
  改的地方太多了直接复制吧
2. 需要先安装[原版](https://github.com/Tsuk1ko/CQ-picfinder-robot)再复制这边的文件到文件夹  
3. 需要安装MongoDB，没装的参考官方教程https://docs.mongodb.com/manual/installation/ ，端口是默认端口不要改  
4. 需要npm install mongodb和seedrandom  
5. 把别的东西放到module/plugin里  

## 部件列表  
正在缓慢更新中
TODO:  Pixiv订阅，小游戏更新  

### 1. 看微博，B站动态  
用 “看看**谁谁上条**微博/B站”，谁谁是要看的人的名字，上条可以改，可以要求看置顶，上条，上上条，上上上条.....，也可以直接写第x条，x范围是0~9
也可以用 **看看微博/B站 url**，url为单条微博的网址，在微博app里，分享微博的时候选分享链接就好

### 2. 订阅微博，B博，Twitter
用 “订阅**谁谁**微博/B站/Twitter”就好，取消订阅用“取消订阅**谁谁**微博/B站/Twitter”，每5分钟检查一次  
用**查看微博/B站/Twitter订阅**来检查目前群里订阅了哪些账号  
注意Twitter订阅时需要使用用户id而不是名字，取消订阅时需要用名字~~(割裂的使用体验）~~  
  
### 3. 教说话  
***注意*** 每个群的问答库都是分卡的，私聊教说话暂时无效以后可能会有这方面的更新，可以学习图片   
基础操作1. @bot 并说 **我教你**xxx > yyy，就可以学会一个问答，一个关键词可以关联多个回应词，随机抽取  
基础操作2. @bot 并说 **忘记/忘掉** xxx 就能删除关键词以及所有回应  
基础操作3. @bot 并说 **回忆/想一想/想想** xxx 就能根据回应反查提问  
基础操作4. @bot 并说 **你学过什么** 会返回所有学过的句子和匹配模式，目前设置的仅有管理员和群主可用  
  
进阶操作1. 教学的格式可变为 @bot 我教你xxx>yyy>精确/模糊/正则  
进阶操作2. 遗忘的格式同上，也可变为 @bot忘掉/忘记xxx > 精确/模糊/正则，注意在模式为正则时为模糊匹配，  
^123$只需要输入123就行了  
  
### 4. Pixiv看图  
***看看p站***后接p站图片id或者包含id的url，如果该id有多图会自动合并发送  
  由于酷Q限制无法发送4M以上大小的图，此时会发送图片链接

### 5. 骰子  
可以扔出任意面数（<1000），任意个数(<10)的骰子，可以指定最小值，自动统计总分  
用法的话，参考  
.dice6  扔一个D6  
.dice8x5  扔5个D8  
.dice16,10  扔1个最低为10的D16  
.dice20x3,10  扔3个最低为10的D20  

### 6.简单直接宝可梦  
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
  
## Extra   
基于各种奇怪需求开发的部件，需要把extra文件夹中除了main的放到plugin里，并且替换之前的main  
1. 匹配句子发送音频，参考recordMsg文件  
2. 指挥机器人禁言，解除禁言，触发关键词禁言，参考zen文件  

## 以下内容因为版本更迭暂不支持  
### 2. 图片分类  
可以请求不同种类的P站图片，数据库为本地储存的MongoDB，setu_database里是我自己扒了10多个tag并手工删减了一些不太行的，可以用MongoDB恢复到数据库，不需要的话可以自己用pxer扒  

### 3. 看漫画  
实现了自动翻页，暂停自动翻页，跳页，手动翻页之类的功能  
可以和狗群员一起看漫画，没什么卵用，语句是 看看漫画  
需要指定本地漫画的地址（对你得把漫画下载到本地），从1.jpg开始

### 4. 获取少前新人/皮肤的大破图  
来源是少前台服官网，需要手动触发，语句为“康康新枪/皮肤”

### 6. 少前帮助  
问问题可以给出对应的NGA的网址链接  
（偷懒直接写main里面了）

### 7. 少前战区分数统计(能用，有bug，几率报错)  
也用了MongoDB...可以输入分数然后查看分数（写了一半！）
@机器人 然后用以下格式  
战区 游戏名称:xxxx；分数：xxxxxx；排行：xx  
（不用打百分号，注意用分号隔开每项内容）
