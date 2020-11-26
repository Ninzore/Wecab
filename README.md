# Wecab 

### Web Content Aggregation Bot 网络内容聚合机器人  
#### 最好的综合型订阅制机器人  
前身是给[CQ-picfinder-robot](https://github.com/Tsuk1ko/CQ-picfinder-robot)做的小挂件（已完全脱离）  
如果有bug请复制pm2log中的错误信息并提交issus，我会尽快解决（可能） 
觉得好用不妨点个Star谢谢  

[Wiki](https://github.com/Ninzore/Wecab/wiki)  
[更新日志](https://github.com/Ninzore/Wecab/blob/master/CHANGELOG.md)

## 特色  
1. 所有不需要申请任何api，包括微博，B站，Twitter，翻译，即插即用  
2. 群组分离，互不干扰  

**注意！！！**  
**近期会支持嵌入式数据库**如果不想用MongoDB的人可以等一阵子(可能你们得等久点了...)  
  
目前需要安装MongoDB，没装的参考官方教程https://docs.mongodb.com/manual/installation/ ，端口是默认端口不要改，然后使用mongorestore将dump文件夹中的东西恢复到mongodb中，这样才能使用小游戏功能，当然如果不用的话也可以，删除main中所有pokemon相关的语句就行  

## 部件列表  
正在缓慢更新中  
TODO:  
1. Pixiv订阅  
2. 接入RSSHub 
3. 从MongoDB换到SQLite或者LevelDB

### 1. 看微博，B站，Twitter动态  
用 “看看**谁谁上条**微博/B站/Twitter/推特”，谁谁是要看的人的名字，上条可以改，可以要求看置顶，上条，上上条，上上上条.....，也可以直接写第x条，x范围是0~9  
反微博小程序，会自动把微博小程序内容给抓出来，造福PC用户  
也可以用 **看看 url**，url为单条微博/B站/Twitter的网址，在app里，选分享链接就好，支持b23短链接  

### 2. 订阅微博，B博，Twitter
每当有新内容时会转发到群内  
  
### 3. 教说话  
教bot对任意关键词做出反应 精确/模糊/正则  
  
### 4. 教复读  
教bot复读任意语句 精确/模糊/正则  

### 5. Pixiv看图  
***看看p站***后接p站图片id或者包含id的url，如果该id有多图会自动合并发送，最多同时发送9张  

### 6. 翻译  
**翻译>** 后接需要翻译的外语句子，自动识别语言并翻译成中文  
**中译x>** x为目标语言，可以是日韩英法德俄，后接中文，会翻译为目标语言  
目前使用腾讯翻译

### 7. 骰子  
可以扔出任意面数（<1000），任意个数(<10)的骰子，可以指定最小值，自动统计总分  
用法的话，参考  
.dice6  扔一个D6  
.dice8x5  扔5个D8  
.dice16,10  扔1个最低为10的D16  
.dice20x3,10  扔3个最低为10的D20  

### 8.简单直接宝可梦  
**注意！！！** 使用前必须先将下载dump然后用mongorestore存进mongoDB  
一个极度简化版的群内对战游戏
