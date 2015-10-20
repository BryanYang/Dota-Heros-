var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('dota.db');

require('./lib');

exports.getHeroFullImg = function(href,cb){
    //http://www.dota2.com.cn/images/heroes/night_stalker_full.png
    //http://db.dota2.com.cn/hero/night_stalker/
    var img_name = href.trim('/').split('/').last()+'_full.png';

    var imgSrc = 'http://www.dota2.com.cn/images/heroes/' + img_name;
    request(imgSrc).pipe(fs.createWriteStream('imgs/' + img_name));
    setTimeout(function(){
        cb(null);
    },5000)
    
}

exports.getHero = function(href, cb) {
    request(href, function(error, res, body) {
        if (!error && res.statusCode == 200) {
            var $ = cheerio.load(body);
            var imgSrc = $('img.hero_b').attr('src');

            request(imgSrc).pipe((fs.createWriteStream('imgs/' + imgSrc.split('/').last())));
            var story = $('div.story_box').text().trim().replace(/\s/g, '');
            var name_cn = $('div.hero_name').text().trim();
            var name_en = imgSrc.split('/').last().trimSuf();
            var infos = $('ul.info_ul p.info_p');
            var gongji = infos.eq(0).text().trim();
            var dingwei = infos.eq(1).text().replace(/\s/g, '');
            var zhenying = infos.eq(2).text().trim();
            var jiancheng = infos.eq(3).text().trim();

            var zhuangbei = [];
            for (i = 0; i < 4; i++) {
                var zb = $('ul.equip_ul').eq(i).find('img.equip_s');
                var zbStr = zb.map(function(i, item) {
                    return $(item).attr('src').split('/').last().trimSuf();
                });
                zbStr = Array.prototype.join.call(zbStr);
                zhuangbei.push(zbStr);
            }
            /*
            * 装备
            [ 'clarity_lg,tango_lg,flask_lg,gauntlets_lg,branches_lg', 
			  'magic_stick_lg,boots_lg,bracer_lg,energy_booster_lg',
			  'magic_wand_lg,arcane_boots_lg,blink_lg,tpscroll_lg',
			  'ultimate_scepter_lg,veil_of_discord_lg,shivas_guard_lg,sheepstick_lg,heart_lg,octarine_core_lg' ]
  			*/

            //英雄适配
            var matchHeros = [];
            var lis = $('ul.match_ul').eq(0).find('li');
            lis.each(function(i, li) {
                var a = $(li).children('a');
                matchHeros.push(a.text() + '|' + a.attr('href').trim('/').split('/').last());
            });

            //相同类型英雄
            var sameHeros = [];
            var lis = $('ul.match_ul').eq(1).find('li');
            lis.each(function(i, li) {
                var a = $(li).children('a');
                sameHeros.push(a.text() + '|' + a.attr('href').trim('/').split('/').last());
            });


            var stmt = db.prepare(insert_hero);
            stmt.run([name_en, name_cn,'智力',gongji, dingwei, zhenying, jiancheng, zhuangbei[0], zhuangbei[1], zhuangbei[2], zhuangbei[3], matchHeros.join(), sameHeros.join(),story])
            stmt.finalize();
            console.log('插入英雄:' + name_cn);

            var skills = [];
            var dd = $('div.skill_box dd');
            var stmt = db.prepare(insert_skill);
            dd.each(function(i, d) {
                var img_src = $(d).find('img').attr('src');
                if(img_src.indexOf('暗夜魔王恐吓目标') != -1){

                }else{
                	request(img_src).pipe((fs.createWriteStream('imgs/' + img_src.split('/').last())));
                }
                var skill = {};
                skill.name_en = img_src.split('/').last().trimSuf();
                skill.name_cn = $(d).find('p.skill_intro span').text();
                skill.info = $(d).find('p.skill_intro').text().substr(skill.name_cn.length);
                skill.color_green = $(d).find('p.color_green').text();
                skill.xiaohao = $(d).find('div.xiaohao_wrap .icon_xh').text();
                skill.lengque = $(d).find('div.xiaohao_wrap .icon_lq').text();
                skill.hero = name_en;
                otherInfos = $(d).find('ul.skill_ul li');
                var other = otherInfos.map(function(i, item) {
                    return $(item).text();
                });
                skill.otherInfos = Array.prototype.join.apply(other, ['|']);
                stmt.run(skill.name_en, skill.name_cn, skill.info, skill.color_green, skill.xiaohao, skill.lengque,skill.hero,skill.otherInfos);
                console.log('插入技能:' + skill.name_cn);
            });

            stmt.finalize();
           
            cb(null);

        }
    })
}

var createTables = {};
createTables.heros = 'CREATE TABLE `heros` (`name_en`	TEXT,`name_cn`	TEXT,`type` TEXT,`attack`	TEXT,`position`	TEXT,`camp`	TEXT,`name2`	TEXT,`equip_first`	TEXT,`equip_low`	TEXT,`equip_mid`	TEXT,`equip_heigh`	TEXT,`match_heros`	TEXT,`same_heros`	TEXT,`story` TEXT)';
createTables.skills = 'CREATE TABLE `skills` (`name_en` TEXT,`name_cn` TEXT,`info` TEXT,`color_green` TEXT,`cost` INTEGER,`count_down` INTEGER,`hero` TEXT,`otherInfos` TEXT  )';

var insert_hero = 'INSERT INTO heros VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
var insert_skill = 'INSERT INTO skills VALUES (?,?,?,?,?,?,?,?)';

exports.initTables = function(tables) {
    _.forEach(tables, function(t) {
        db.serialize(function() {
            db.all("select name from sqlite_master where type='table' and name='" + t + "' ", function(err, row) {
                if (row.length > 0) {
                    db.run('DROP TABLE ' + t, function() {
                        db.run(createTables[t]);
                        console.log('初始化表'+t);
                    });
                } else {
                    db.run(createTables[t]);
                    console.log('初始化表'+t);
                }
            });
        });
    })
}

/*
initTables(['heros', 'skills']);

getHero('http://db.dota2.com.cn/hero/earthshaker/');

*/

/*
fs.exists('imgs', function(exists) {
    if (!exists) {
        fs.mkdir('imgs', function() {
            getHero('http://db.dota2.com.cn/hero/earthshaker/');
        });
    } else {
        getHero('http://db.dota2.com.cn/hero/earthshaker/');
    }

})

*/