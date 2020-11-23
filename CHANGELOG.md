# 更新日志
  
## 2020

### 11/20 v1.4.8
* Remove: 把广播功能删了

### 11/20 v1.4.7
* Twitter
  * fix: 好像之前proxy并未起效
* 注: package新增https-proxy-agent，注意安装

### 11/18 v1.4.6
* Translate
  * feat: 适配腾讯翻译新的鉴权机制
  * fix: 翻译文字未对特殊字符进行转义
  * chore: 暴露翻译接口以供别的引用使用

### 11/15 v1.4.5
* Twitter
  * Update: Twitter整体改版（未经过大量验证）
* Bilibili
  * Fix: 有时无法获取专栏封面

### 11/14 v1.4.0
* Bilibili
  * feat: 增加对直播间的解析

### 10/29 v1.3.9
* Twitter
  * feat: 增加proxy设置
* config file
  * feat: 增加proxy设置栏

### 10/25 v1.3.8
* pokemon
  * Fix: 一堆数据库调用错误
* 更新mongodb版本

### 10/24 v1.3.7
* nbnhhsh
  * Update: 加回来了，改了一下用法

### 10/18 v1.3.6
* pokemon
  * Fix: 
      1. 地点错误
      2. 对战结算错误
  * Update: 更改低保模式为自动

### 10/15
* weibo:
  * Update: 支持/status的网址

### 10/12  v1.3.5 
* pokemon:
  * Fix (修到了至少能正常玩的程度): 
    *. 和储存箱交换宝可梦时会造成列表异常，数值出现null
    *. 对战时的逻辑修正
    *. 捕捉时的逻辑修正
    *. 不正确的数据库调用
  * Update:
    *. 自助修复逻辑更新，能正确修复空值
    *. 对战时添加随机要素
    *. 移除不必要的库
    *. 代码美化
  * Add:
    *. 低保政策
    *. 对战时如果有一方数据错误，会提示修正

### 10/09 
* translate:
  * Update: 
    *. 翻译列表会返回本组所有而不是全部，并且会at出来
    *. 对7到10位QQ号都会响应，以前是9到10位
    *. 正则改善

### 10/08 v1.3.4  
* translate:
  * Add: 现在可以一键清空组内所有定向翻译

### 10/07 v1.3.3  
* main:
  * Fix: 引用了错误的函数
* bilibili
  * Fix: 使用了undefined的变量，添加判断

### 10/05 v1.3.2 
* 支持在config中修改新人入群和退群提示

### 10/02  
* Twitter:
  * Fix: Twitter图片格式问题 [#18](https://github.com/Ninzore/Wecab/issues/18)

### 9/27  v1.3.1
* bilibili:
  * Add: 新增订阅账号的开播和下播提醒

### 9/22  v1.3.0
* weibo:
  * Update: 优化对网址的识别
  * Add: 使用链接转发失败时会提示
* bilibili:
  * Add: 现在会正确解析专栏动态了
  * Fix: 修复无法找到置顶动态
* pixivImage:
  * Update: 提高单图大小上限到25MB

### 9/21  v1.2.9
* 我有一个朋友:
  * Update: 现在文字周边有外框了
  * Fix: 错误的异步调用导致未能成功返回值
* Fix mongo bugs

### 9/20  v1.2.8
* Update: 微博:
  * 更新反小程序
  * 支持PC网页版链接
* Update: B站动态:
  * 支持移动版链接
  * 优化转发文本排版
* Fix: B站动态:
  * 有时不能正确获取名字
  * 将不是文章的动态显示为发布文章

### 9/19  v1.2.7
* Update: 我有一个朋友:
  * 不再需要底图
  * 更新正则
  * 限制长度为18

### 9/17  v1.2.6
* Add: 新增 我有一个朋友 出图功能

### 9/12  v1.2.5
* Update: 新增关键词触发率调整
* Update: 补上之前不小心删了的教学功能
* Update: 其他小调整

### 9/06  v1.2.4
* Update: 现在不会翻译buff不能跨组了
* Update: 定向翻译改为使用回复形式进行
* Fix: 转义正则错误

### 9/03  v1.2.3
* Update: 更新package
* Update: 更新config格式
* Update: 调整对config的引用

### 9/02  v1.2.2
* Update: 支持使用at挂buff，增加对日语和中文的判断

### 8/31  v1.2.1
* Add: 添加定向翻译功能

### 8/13  v1.2.0
* Add: 建立等式功能
* Fix: 教学模块细微调整适应go-cqhttp

### 8/01  v1.1.9
* Fix: 调用了未引用的函数

### 7/31  v1.1.8
* Fix: 调用了不存在的文件

### 7/26  v1.1.7
* Fix: 转发b23短链时，如果重定向目标为视频会报错
* Add: 转发b23短链时，如果重定向目标为视频则会发送视频链接

### 7/24  v1.1.6
* Add: 现在Twitter会转发投票内容以及更丰富的card内容
* Update: Twitter模块其他小改进

### 7/22  v1.1.5
* Update: 转发时会给出gif动图而不是mp4链接（过大时仍然会给出链接）

### 7/20  v1.1.4
* Update: 删除twitter查看置顶（目前有问题）

### 7/17  v1.1.3
* 加入helpZen（禁言）模块

### 7/16
* Delete: 删除extra文件夹（没用）

### 7/14  v1.1.2
* Fixed: 看看xxTwitter有时会无效的bug

### 7/10  V1.1.1
* Fixed: 不加选项时添加订阅出错，订阅转发时url出错

### 7/07  V1.1.0
* Added: Twitter订阅时的可选项更多，添加（包含转发，不要转发，仅回复，包含回复，不要回复）  
* Change: 修改Twitter订阅查询机制  
* 注：更新后与旧版本**不兼容**  
[commit](https://github.com/Ninzore/Wecab/commit/1091153a7c6b02c3f820b59d9c8c79da54a870ef)

### 7/06  
* Fixed: 图片太大时会使用小图，并提示  
[commit](https://github.com/Ninzore/Wecab/commit/1091153a7c6b02c3f820b59d9c8c79da54a870ef)

### 7/05  
* Fixed: 如果在检查区间发送多条Twitter，只会发送最新一条的bug，现在会正确发送所有新内容  
[commit](https://github.com/Ninzore/Wecab/commit/9c3e7b515c4f76b1123f2d86fa0890f7ceef7bef)

### 7/01  v1.0.0
* New: 完全脱离CQ-picfinder,不依赖原项目

### 6/29
* Added: 添加一键清空该群所有Twitter订阅  [commit](https://github.com/Ninzore/Wecab/commit/d17cee9c7f701500c0ae03040dc8766cd7bb54ba)
* Fixed: 不准复读图片时的错误  [commit](https://github.com/Ninzore/Wecab/commit/867d96d7f0d02a8dba8247d1f385175d69b181e0)

### 6/28
* Added: 添加一键清空该群所有B站订阅  
[commit](https://github.com/Ninzore/Wecab/commit/aa15b8048bf0e3857e5ecc0649be829514759006)

### 6/24
* Added: 添加一键清空该群所有微博订阅  
* Fixed: html正则未完全匹配  
[commit](https://github.com/Ninzore/Wecab/commit/6d051b1a6ecce1be0a43f8393701650805812516)

### 6/23
* Fixed: 微博html正则未完全匹配

### 6/22
* Added: 新增对问答和复读进行计数  
* Changed: 问答和复读收取图片时也变为url

### 6/19
* Others: 微博多加几个catch 

### 6/18
* Added: 加入复读  

### 6/16
* Changed: 改变微博刷新机制防止触发反爬虫

### 6/14
* Fixed: 上次更新导致了无法触发图片的bug，修复
* Changed: 教学部分发送图片时全部改为网络链接，避免删除酷Q缓存导致无法回复图片

### 6/13
* Changed: 教学时收录的图片改为网络地址

### 6/11
* Fixed: 解决无法烤制某些回复推的bug

### 6/10
* Changed: 将“看看B站”简略为“看看”  
* Added: 支持b23短链接  

### 6/09
* Fixed: 修复烤推时无法找到node的错误    

### 6/04
* Added: 烤推支持覆盖原文  

### 6/03
* Added:  添加对Twitter移动版mobile.twitter网址的识别   
* Changed: 简化twitter指令  
   1. 取消看看xxTwitter>链接，现在默认发送链接  
   2. 取消看看xxTwitter>截图，转为使用twitter截图url  
   3. 看看Twitter url改为 看看url，方便使用  
  
### 6/02
* Fixed: 解决检查连接性出错的bug  

### 6/01
* Fixed: 解决在设置为'仅原创'时仍然会发送转发内容的bug  

### 5/29
* Fixed: 解决无法获取cookie的问题  
* Fixed: 解决订阅设定为‘仅原创’时依然会有转发twitter的问题  

### 5/27
* Fixed: 解决截图不完整的bug  
* Fixed: 解决有时页脚没有被正确删除的bug  

### 5/26
  * 准备脱离原[CQ-Picfinder-Robot](https://github.com/Tsuk1ko/CQ-picfinder-robot)  

### 5/23
  * 增加B站动态订阅设置  

### 5/17
  * 烤推功能分离为单独模块
  * 支持twitter原生emoji

### 5/14
  * 修改烤推模块逻辑以及命令语法    

### 5/13
  * 解决在某些时候无法识别烤推时的选项的bug  

### 5/12  
  * 微博些许修改，显示更多错误信息  

### 5/11
  * 烤推支持烤制回复推    

### 5/10
  * 修复无法正确转发Bilibili发布新文章动态的bug  

### 5/09
  * 解决更新后订阅内容不发送的bug   

### 5/08
  * extra 的main随原版更新main到2.12.4   

### 5/07
  * 随原版更新main到2.12.4   

### 5/06
  * 加入了能不能好好说话模块   

### 5/02
  * 支持烤推时直接在原Twitter页面上插入html    

### 4/29
  * 支持烤推时使用简单语句或者CSS装饰原Twitter  

### 4/28
  * 加入烤推功能  

### 4/27
  * 现在Twitter会发送原图了  
  * 处理当Twitter订阅选项为仅原创时仍然会发送转推内容的bug  
  * 修改了截图时的选择器避免在有的Twitter产生bug  

### 4/26
  * 新增Twitter截图功能  

### 4/25
  * 新增翻译功能 

### 4/24
  * 解决在碰到转推时不能显示全部内容的问题，以及更改了转推时的文字格式  

### 4/23
  * weibo.js 修正一个正则错误，以及增加没有获取到微博时间线时的处理  

### 4/22
  * Twitter可选订阅模式  

### 4/21
  * Twitter连接机制优化
  * Twitter模块多个bug修正
    1. 无法正确显示订阅  
    2. 订阅后无法自动转发  

### 4/20
  * 完全重写Twitter模块，抛弃之前使用的RSSHub（更新太慢了    

### 4/08
  * 新增使用url订阅微博账号功能

### 4/04
  * 完全重构微博模块，支持订阅时选项    

### 3/26
  * 新增Twitter订阅功能  
  * 微博catch err bug处理

### 3/25
  * 添加学习的回忆全部功能，仅有管理员和群主能够使用

### 3/23
  * 解决未停止传播的问题
  * 稍微修整代码看起来更简洁

### 3/22
  * 问答功能现在能够学习发送图片了

### 3/20
  * 修bug
  
### 3/18
  * 更新至2.11.10 
  * 新增Extra  
  * 1. 禁言，解除禁言，关键词禁言  
  * 2. 发送音频  
  
### 3/07
  * pixiv看图支持多图发送
  * 微博模块bug修复
  
### 3/07
  * 更新至2.11.7

### 3/05
  * 新增Pixiv看图功能
  * 宝可梦捕捉bug修复
  
### 2/22
  * 微博和B站转发会将图片和文字合并发送了
  
### 2/21
  * 将插件的判断语句全部移入到插件本体，大幅减少main行数，看起来更好看了  
  * 问答功能新增了“回忆功能”，根据回应反查提问
  
### 2/20
  * 支持本体更新到v2.11.6
  * 问答系统支持设置匹配模式
  * bug修正
  
### 2/18
  * 新增问答系统

### 远古更新
  * 不想写了...
