/**
 * Created by Bryan Yang at 2015/10/09.
 */

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var dota = require('./detail');
var equip = require('./equip');

var url = "http://www.dota2.com.cn/items/images/tango_lg.png";

if (0) {
    request(url).pipe((fs.createWriteStream('tango_lg.png')));
}

//dota.initTables(['heros', 'skills']);

//dota.initTables(['equips']);

if (0) {
    request(url, function(error, res, body) {
        if (!error && res.statusCode == 200) {
            var $ = cheerio.load(body);
            //力量 0,3  敏捷1,4 智力 2,5
            var a_heros = $('ul.hero_list').eq(2).add($('ul.hero_list').eq(5)).find('a.heroPickerIconLink');

            //var a_heros = $('ul.hero_list').find('a.heroPickerIconLink');
            var hrer_hrefs = [];
            _.forEach(a_heros, function(a) {
                hrer_hrefs.push($(a).attr('href'));
            });
            console.log(hrer_hrefs.length);

            async.eachLimit(hrer_hrefs, 5, dota.getHero, function(err) {
                console.log('完毕！')
            });

        }
    })
}

if (1) {

    var equips = equip.all;
    var values = _.values(equips);
    
    fs.exists('equips', function(exists) {
        if (!exists) {
            fs.mkdir('equips', function() {
                async.eachLimit(values, 5, equip.getEquip, function(err) {
                    console.log('完毕！')
                });
            });
        } else {
            async.eachLimit(values, 5, equip.getEquip, function(err) {
                console.log('完毕！')
            });
        }

    })
}