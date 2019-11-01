// ==UserScript==
// @name         Sebzer
// @namespace    http://p1m.org/
// @version      0.1.6
// @description  Средство экспорта библиографических записей из eLIBRARY.RU (СЕБЗЕР). Добавляет в eLIBRARY.RU возможности экспорта библиографических записей, подобные таковым в PubMed. В настоящее время поддерживается экспорт только со страниц выдачи, только с ограничением по типу публикации «статьи в журналах» и только в формате BibTeX.
// @author       Павел Желнов
// @match        http*://elibrary.ru/*
// @grant        none
// @require      https://code.jquery.com/jquery-latest.min.js
// @require      https://cdn.rawgit.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js
// @require      https://cdn.rawgit.com/larsgw/citation.js/archive/citation.js/citation-0.4.0-10.min.js
// ==/UserScript==

(function() {
    'use strict';
    var elibrary = "https://elibrary.ru";
    const Cite = require('citation-js');
    const record = new Cite();
    var canvas = '<div id="sebzer-canvas"></div>';
    var style = "width: 400; text-align: justify";
    var button = '<div id="sebzer-button-canvas" style="text-align: center"><button id="sebzer-button">';
    button += 'Экспортировать в файл (BibTeX)';
    button += '</button></div>';
    var eSebzerNote = '<p id="sebzer-esebzernote" class="sebzer-error">';
    eSebzerNote += 'Сообщение от СЕБЗЕР:';
    eSebzerNote += '</p>';
    var eNotArticleNote = '<p id="sebzer-enotarticlenote" class="sebzer-error">';
    eNotArticleNote += 'В выдаче обнаружены записи с типом публикации, отличным от «статьи в журналах». Обращаем внимание, что такие записи не будут полноценно распарсены. Для исключения таких записей можно в параметрах поисках снять галочки со всех остальных типов публикации.';
    eNotArticleNote += '</p>';
    var eNotSearchNote = '<p id="sebzer-enotsearchnote" class="sebzer-error">';
    eNotSearchNote += 'Это не поисковая выдача, поэтому экспорт записей с этой страницы не будет возможен. Вы сможете выгрузить эти записи, если добавите их в какую-либо подборку публикаций, так как экспорт содержимого подборок также возможен.';
    eNotSearchNote += '</p>';
    var e = { notSearch: false, notArticle: false };
    var mime = "application/x-bibtex;charset=utf-8";
    var filename = 'elibrary_ru';
    var ext = "bib";
    var ref_regex = /^(.+)\. (\d{4})\. (Т\.? ([\d\wА-я.\-\(\) ]+)\. )?(№\.? ([\d\wА-я.\-\(\) ]+)\. )?(С)\. ([\d\w\-]+)\.$/i;
    var au_regex = /^(.*?) ?([^ ]+?)\.?$/i;
    var bib_regex = /^@\w+{.*,$/gmi;

    $(document).ready(function() {
        $('#restab').before(canvas);
        $('#sebzer-canvas').attr("style", style);
        if ($('#thepage').prop('outerHTML').toLowerCase().indexOf('всего найдено публикаций:') === -1)
            e.notSearch = true;
        else {
            $('tr').filter(function(){
                return this.id.match(/^a\d+$/g);
            })
            .children().filter('td[align="left"]').each(function(){
                var bibjson = {type: "misc"};
                var bibkey = $(this).parent().attr('id');;
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
                            var firstname = au[2].replace(/[^a-za-я\d]+/gi,' ');
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
                bibtex = bibtex.replace(bib_regex, label);
                record.add(bibtex);
            });
        }

        for (var note in e) {
            if (e[note]) {
                $('#sebzer-canvas').append(eSebzerNote);
                break;
            }
        }

        if(e.notSearch)
            $('#sebzer-canvas').append(eNotSearchNote);
        else {
            if(e.notArticle)
                $('#sebzer-canvas').append(eNotArticleNote);

            $('#sebzer-canvas').append(button);
            $('#sebzer-button').click(function () {
                var text = record.format('bibtex');
                var blob = new Blob([text], {type: mime});
                saveAs(blob, filename+"."+ext);
            });
        }
    });
})();