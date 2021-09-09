// ==UserScript==
// @name         Sebzer
// @namespace    https://p1m.org/
// @version      0.2.7
// @description  Средство экспорта библиографических записей из eLIBRARY.RU (СЕБЗЕР). Добавляет в eLIBRARY.RU возможности экспорта библиографических записей, подобные таковым в PubMed. В настоящее время поддерживается экспорт только со страниц выдачи, только с ограничением по типу публикации «статьи в журналах» и только в формате BibTeX.
// @author       Павел Желнов
// @match        http*://*.elibrary.ru/*
// @grant        none
// @require      https://cdn.rawgit.com/eligrey/FileSaver.js/v2.0.2/dist/FileSaver.min.js
// @require      https://cdn.jsdelivr.net/npm/citation-js@0.4.10/build/citation.min.js
// ==/UserScript==

$(function() {
    'use strict';
    var elibrary = "https://elibrary.ru";
    const Cite = require('citation-js');
    const record = new Cite();
    var sebzer_bibtex = function () {
        var text = record.format('bibtex');
        var blob = new Blob([text], {type: mime});
        saveAs(blob, filename+"."+ext);
    };
    var canvas = '<div id="sebzer-canvas"></div>';
    var style = "width: 630px; text-align: justify; padding: 10px; margin: 10px; background-color: #555555; color: white";
    var button = '<div id="sebzer-button-canvas"><table><tr><td width="15%" align="center" valign="top"><a id="sebzer-button-pic" href="javascript:sebzer_bibtex()" style="color: white"><img src="images/but_orange.gif" width="15" height="15" hspace="3" border="0"></a></td><td width="85%" align="left" valign="middle"><a id="sebzer-button-text" href="javascript:sebzer_bibtex()" style="color: white">';
    button += 'Экспортировать в файл (BibTeX)';
    button += '</a></td></tr></table></div>';
    var eSebzerNote = '<div id="sebzer-esebzernote" style="font-weight: bold; color: #F26C4F"><p style="text-indent: 0">';
    eSebzerNote += 'СРЕДСТВО ЭКСПОРТА БИБЛИОГРАФИЧЕСКИХ ЗАПИСЕЙ';
    eSebzerNote += '</p></div>';
    var eNotArticleNote = '<div id="sebzer-enotarticlenote"><p style="text-indent: 0">';
    eNotArticleNote += 'В выдаче обнаружены записи с типом публикации, отличным от «статьи в журналах». Обращаем внимание, что такие записи не будут полноценно распарсены. Для исключения таких записей можно в параметрах поиска снять галочки со всех остальных типов публикации.';
    eNotArticleNote += '</p></div>';
    var eNotSearchNote = '<div id="sebzer-enotsearchnote"><p style="text-indent: 0">';
    eNotSearchNote += 'Это не поисковая выдача, поэтому экспорт записей с этой страницы, если таковые на ней имеются, не будет возможен. Вы сможете выгрузить эти записи, если добавите их в какую-либо подборку публикаций, так как экспорт содержимого таких подборок — возможен.';
    eNotSearchNote += '</p></div>';
    var eItemAspNote = '<div id="sebzer-enotsearchnote"><p style="text-indent: 0">';
    eItemAspNote += 'Экспорт со страниц отдельных записей не поддерживается. Чтобы преодолеть это ограничение, добавьте эту запись в какую-либо подборку и затем выгрузьте содержимое этой подборки.';
    eItemAspNote += '</p></div>';
    var e = { notSearch: false, itemAsp: false, popUpWindow: false, notArticle: false };
    var mime = "application/x-bibtex;charset=utf-8";
    var filename = 'elibrary_ru';
    var ext = "bib";
    var ref_regex = /^(.+)\. (\d{4})\. (Т\.? ([\d\wА-я.\-\(\) ]+)\. )?(№\.? ([\d\wА-я.\-\(\) ]+)\. )?(С)\. ([\d\w\-]+)\.$/i;
    var au_regex = /^(.*?) ?([^ ]+?)\.?$/i;
    var bib_regex = /^@\w+{.*,$/gmi;

    if (!$('#thepage').length || $('#thepage').prop('outerHTML').toLowerCase().search(/всего найдено публикаций:\s+<\/font>/) === -1) {
        e.notSearch = true;
        var pagename = location.pathname.substring(1);
        switch(pagename) {
            case 'item.asp':
                e.itemAsp = true;
                break;

            case 'itembox_item_add2.asp':
            case 'itembox_item_add.asp':
                e.popUpWindow = true;
                break;
        }
    }
    else $('tr').filter(function(){
            return this.id.match(/^a\d+$/g);
        })
        .children().filter('td[align="left"]').each(function(){
            var bibjson = {type: "misc"};
            var bibkey = $(this).parent().attr('id');
            var hasAuthor = ($('font',this).has('i').length == 1) ? true : false;
            if (hasAuthor) {
                var author = [];
                var austr = $(this).children().has('i').not(':has(b)').text().replace('et al.','').trim();
                var auarr = austr.split(', ');
                auarr.forEach(function(val, i) {
                    var au = val.match(au_regex);
                    var name;
                    if (au[1]) {
                        var lastname = au[1];
                        var firstname = au[2].replace(/[^a-za-я\d]+/gi,'. ')+".";
                        name = lastname + ', ' + firstname;
                        author.push({
                            lastname: lastname,
                            firstname: firstname,
                            name: name
                        });
                    }
                    else {
                        name = au[2];
                        author.push({
                            lastname: name,
                            firstname: name,
                            name: name
                        });
                    }
                });
                bibjson.author = JSON.parse(JSON.stringify(author));
            }
            var hasTitle = ($(this).has('b').length) ? true : false;
            if (hasTitle)
                bibjson.title = $(this).children().has('b').text().trim();
            var hasRef = ($(this).children().not(':has(i),:has(b)').length) ? true : false;
            if (hasRef) {
                var refstr = $(this).children().not(':has(i),:has(b)').text().replace(/\s+/g,' ').trim();
                var refarr = refstr.match(ref_regex);
                if (refarr) {
                    bibjson.type = "article";
                    bibjson.journal = {name: refarr[1]};
                    bibjson.year = refarr[2];
                    if (refarr[4])
                        bibjson.journal.volume = refarr[4].replace(/^(\d+).*$/,"$1");
                    if (refarr[6])
                        bibjson.journal.issue = refarr[6].replace(/^(\d+).*$/,"$1");
                    bibjson.journal.pages = refarr[8].replace('-','--');
                    if (!hasAuthor)
                        bibjson.author = [{name: "Б.а."}];
                    if (!hasTitle)
                        bibjson.title = "Б.н.";
                }
                else {
                    e.notArticle = true;
                    bibjson.note = refstr;
                    if (refstr.match(/^\d{4}$/))
                        bibjson.year = refstr;
                }
            }
            var hasUrl = ($(this).children().eq(0).has('[href]')) ? true : false;
            if (hasUrl) {
                var url = elibrary + $(this).children().eq(0).attr('href');
                var link = [{url: url}];
                bibjson.link = link;
            }
            var bibtex = new Cite(bibjson).format('bibtex');
            var label = "@" + bibjson.type + "{" + bibkey + ",";
            bibtex = bibtex.replace(bib_regex, label).replace(/\{\\[^\}]+}/g,'�');
            record.add(bibtex);
        });

    if (!e.popUpWindow) {
        $('table').before(canvas);
        $('#sebzer-canvas').attr("style", style);
        $('#sebzer-canvas').append(eSebzerNote);
        if(e.notSearch) {
            var note = (e.itemAsp) ? eItemAspNote : eNotSearchNote;
            $('#sebzer-canvas').append(note);
        }
        else {
            if(e.notArticle)
                $('#sebzer-canvas').append(eNotArticleNote);

            $('#sebzer-canvas').append(button);
            $('#sebzer-button-pic').click(sebzer_bibtex);
            $('#sebzer-button-text').click(sebzer_bibtex);
        }
    }
});
