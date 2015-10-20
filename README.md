# 项目介绍

nodejs程序，用来爬去完美的DOTA资料库，用request模块来发送请求，用cheerio模块来解析文档。将爬到的英雄资料存放到sqlite数据库 *dota.db*
方便安卓使用。将爬取的图片文件本地缓存（也可以只抓取图片url,这样后期使用时需要网络环境）。

**运行：** `node pa.js`

##程序运行：
![img](https://github.com/BryanYang/Dota-Heros-/blob/master/pa.png)

> 如果程序有其他问题，请参照代码中注释。解析文档部分，请参照页面 [撼地神牛](http://db.dota2.com.cn/hero/earthshaker/)


