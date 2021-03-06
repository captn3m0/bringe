_define('rottenTomatoes', [window, 'util', 'bringe'], function (window, util, bringe) {
    function searchMovie(q, callback) {
        var url = "https://www.rottentomatoes.com/api/private/v2.0/search/?limit=10&q=" + q;
        $.ajax({
            url: url,
            success: function (result) {
                if (typeof result != "object") {
                    try {
                        result = JSON.parse(result);
                    } catch (e) {
                        result = {};
                    }
                }
                if (result.movieCount) {
                    result.movies = util.filter(result.movies, function (movie) {
                        if (movie.meterScore) {
                            return true;
                        }
                    });
                    result.movieCount = result.movies.length;
                }
                callback(true, result);
            },
            error: function (result) {
                callback(false);
            }
        });
    }

    function getSeasonNumber(link) {
        if (link[link.length - 1] === '/') {
            link = link.slice(0, -1);
        }
        var parts = link.split("/"),
            seasonPart = parts[parts.length - 1],
            no;
        if (seasonPart[0] === 's') {
            no = parseInt(seasonPart.substr(1));
            if (no > 0) {
                return no;
            }
        }
        return null;
    }

    function loadRottenTomatoesEpisodesList(season, id, episodeFunc) {
        var link = "https://www.rottentomatoes.com/api/private/v2.0/tvSeason/" + id + "/episodes?offset=0&limit=50";
        if (bringe.page != "serie") return;
        $.ajax({
            url: link,
            success: function (result) {
                if (bringe.page != "serie") return;
                if (typeof result != "object") {
                    try {
                        result = JSON.parse(result);
                    } catch (e) {
                        result = [];
                    }
                }
                var episodes = [];
                for (var i = 0; i < result.length; i++) {
                    result[i].url = 'http://www.rottentomatoes.com' + result[i].url;
                    var episode = {
                        episodeNo: result[i].episodeNumber, title: result[i].title, date: result[i].airDate,
                        synopsis: result[i].synopsis, links: {rotten: result[i].url}
                    };
                    if (result[i].tomatometer && result[i].tomatometer.value) {
                        episode.ratings = {rotten: result[i].tomatometer.value};
                    } else {
                        episode.ratings = {};
                    }
                    if (season.imdbEpisodes) {
                        episode.ratings.imdb = season.imdbEpisodes[result[i].episodeNumber];
                    }
                    episodes.push(episode);
                }
                season.episodes = episodes;
                episodeFunc(true);
            }
        });
    }

    function loadRottenTomatoesMovie(movie, link, func) {
        if (bringe.page != "movie") return;
        $.ajax({
            url: link,
            success: function (result) {
                if (bringe.page != "movie") return;
                var parser = new DOMParser(),
                    doc = parser.parseFromString(result, "text/html"),
                    myDoc = $(doc),
                    img,
                    spans,
                    name,
                    role, i;
                var cast = myDoc.find(".cast-item");
                movie.cast = [];
                for (i = 0; i < cast.length && i < 12; i++) {
                    var member = cast[i];
                    img = $(member).find("img").attr("src");
                    spans = $(member).find("span");
                    if (spans[0])
                        name = spans[0].textContent.trim();
                    if (spans[1])
                        role = spans[1].textContent.trim();
                    var person = {name: name || '', role: role || '', image: img};
                    movie.cast.push(person);
                }
                var coverImageDiv = myDoc.find(".heroImage");
                if (coverImageDiv.length > 0) {
                    var coverImage = coverImageDiv[0].style.backgroundImage;
                    coverImage = coverImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                }
                if (util.isSet(coverImage)) {
                    movie.coverImage = coverImage || "";
                }
                var mainImageDiv = myDoc.find("#movie-image-section img");
                if (mainImageDiv.length > 0) {
                    var mainImage = mainImageDiv.attr("src");
                }
                if (util.isSet(mainImage)) {
                    movie.image = mainImage || "";
                }
                var year = myDoc.find("#heroImageContainer .year");
                if (year.length) {
                    year = year.html().trim().replace(/\(|\)/g, "");
                    movie.year = parseInt(year);
                }
                var movieInfoList = myDoc.find("ul.content-meta.info"),
                    oneInfo, label, value, infoList = [];
                if (movieInfoList) {
                    movieInfoList = movieInfoList.find("li.meta-row");
                    for (i = 0; i < movieInfoList.length; i++) {
                        oneInfo = movieInfoList[i];
                        label = $(oneInfo).find(".meta-label").text().trim();
                        value = $(oneInfo).find(".meta-value").text().trim();
                        infoList.push({label: label, value: value});
                    }
                    movie.infoList = infoList;
                }
                var audienceScore = myDoc.find(".audience-score .meter-value span").text().trim();
                if (audienceScore) {
                    movie.audienceScore = audienceScore;
                }
                var movieSynopsis = myDoc.find("#movieSynopsis").text().trim();
                movie.movieSynopsis = movieSynopsis;
                func(true, movie);
            },
            error: function () {
                func(false);
            }
        });
    }

    function loadRottenTomatoesSerie(serie, link, func) {
        if (bringe.page != "serie") return;
        $.ajax({
            url: link,
            success: function (result) {
                if (bringe.page != "serie") return;
                var parser = new DOMParser(),
                    doc = parser.parseFromString(result, "text/html"),
                    myDoc = $(doc),
                    img,
                    spans,
                    name,
                    role, i;
                var cast = myDoc.find(".cast-item");
                serie.cast = [];
                for (i = 0; i < cast.length && i < 12; i++) {
                    var member = cast[i];
                    img = $(member).find("img").attr("src");
                    spans = $(member).find("span");
                    if (spans[0])
                        name = spans[0].textContent.trim();
                    if (spans[1])
                        role = spans[1].textContent.trim();
                    var person = {name: name || '', role: role || '', image: img};
                    serie.cast.push(person);
                }
                var coverImageDiv = myDoc.find(".heroImage");
                if (coverImageDiv.length > 0) {
                    var coverImage = coverImageDiv[0].style.backgroundImage;
                    coverImage = coverImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                }
                serie.coverImage = coverImage || "";
                var mainImageDiv = myDoc.find("#tv-image-section img");
                if (mainImageDiv.length > 0) {
                    var mainImage = mainImageDiv.attr("src");
                }
                if (util.isSet(mainImage)) {
                    serie.image = mainImage || "";
                }
                var serieSynopsis = myDoc.find("#movieSynopsis").text().trim();
                if (serieSynopsis) {
                    serie.synopsis = serieSynopsis;
                }
                var audienceScore = myDoc.find(".audience-score .meter-value span").text().trim();
                if (audienceScore) {
                    serie.ratings.audienceScore = audienceScore;
                }
                var serieInfoList, movieInfo, subtle, oneInfo, tds, label, value, infoList = [];
                movieInfo = myDoc.find("#series_info .movie_info");
                if (movieInfo.length > 0) {
                    movieInfo.find("#movieSynopsis").remove();
                    serieInfoList = movieInfo.find("div");
                    for (i = 0; i < serieInfoList.length; i++) {
                        oneInfo = serieInfoList[i];
                        subtle = $(oneInfo).find(".subtle");
                        if (subtle.length > 0) {
                            label = subtle.text().trim();
                            subtle.remove();
                            value = $(oneInfo).text().trim();
                            infoList.push({label: label, value: value});
                        }
                    }
                }
                serieInfoList = myDoc.find("#detail_panel tr");
                for (i = 0; i < serieInfoList.length; i++) {
                    oneInfo = serieInfoList[i];
                    tds = $(oneInfo).find("td");
                    label = $(tds[0]).text().trim();
                    value = $(tds[1]).text().trim();
                    infoList.push({label: label, value: value});
                }
                serie.infoList = infoList;
                var seasons = [], oneSeason, seasonNumber, image, mediaBody, rottenLink, seasonName, meterValue, consensus, info, seasonId;
                var seasonsList = myDoc.find("#seasonList .seasonItem");
                for (i = 0; i < seasonsList.length; i++) {
                    oneSeason = $(seasonsList[i]);
                    seasonId = oneSeason.attr("id").replace("season", "");
                    image = oneSeason.find(".posterImage").attr("src");
                    mediaBody = oneSeason.find(".media-body");
                    link = oneSeason.find("a");
                    rottenLink = link.attr("href");
                    seasonName = link.text().trim();
                    seasonNumber = getSeasonNumber(rottenLink);
                    if (seasonNumber) {
                        rottenLink = "http://www.rottentomatoes.com" + rottenLink;
                        meterValue = mediaBody.find(".meter-value").text().trim();
                        consensus = mediaBody.find(".consensus").text().trim();
                        info = mediaBody.find(".season_info").text().trim();
                        seasons.push({
                            seasonNo: seasonNumber, title: seasonName, info: info, image: image,
                            consensus: consensus, links: {rotten: rottenLink},
                            ratings: {rotten: meterValue}, metaData: {rottenId: seasonId}
                        });
                    }
                }
                serie.seasons = seasons;
                func(true);
            },
            error: function () {
                func(false);
            }
        });
    }

    function loadRottenTomatoesSeason(season, link, func, episodeFunc) {
        if (bringe.page != "serie") return;
        $.ajax({
            url: link,
            success: function (result) {
                if (bringe.page != "serie") return;
                var parser = new DOMParser(),
                    doc = parser.parseFromString(result, "text/html"),
                    myDoc = $(doc),
                    img,
                    spans,
                    name,
                    role, i;
                var cast = myDoc.find(".cast-item");
                season.metadata = season.metadata || {};
                season.metadata.rottenId = season.metadata.rottenId || myDoc.find("meta[name='seasonID']").attr("content");
                season.cast = [];
                for (i = 0; i < cast.length && i < 12; i++) {
                    var member = cast[i];
                    img = $(member).find("img").attr("src");
                    spans = $(member).find("span");
                    if (spans[0])
                        name = spans[0].textContent.trim();
                    if (spans[1])
                        role = spans[1].textContent.trim();
                    var person = {name: name || '', role: role || '', image: img};
                    season.cast.push(person);
                }
                var mainImageDiv = myDoc.find("#tvPosterLink img");
                if (mainImageDiv.length > 0) {
                    var mainImage = mainImageDiv.attr("src");
                }
                if (util.isSet(mainImage)) {
                    season.image = mainImage || season.image || "";
                }
                var seasonSynopsis = myDoc.find("#movieSynopsis").text().trim();
                if (seasonSynopsis) {
                    season.synopsis = seasonSynopsis;
                }
                var audienceScore = myDoc.find(".audience-score .meter-value span").text().trim();
                if (audienceScore) {
                    season.ratings.audienceScore = audienceScore;
                }
                var seasonInfoList, oneInfo, label, value, infoList = [];
                seasonInfoList = myDoc.find("section.movie_info li");
                for (i = 0; i < seasonInfoList.length; i++) {
                    oneInfo = seasonInfoList[i];
                    label = $(oneInfo).find(".meta-label").text().trim();
                    value = $(oneInfo).find(".meta-value").text().trim();
                    infoList.push({label: label, value: value});
                }
                season.infoList = infoList;
                loadRottenTomatoesEpisodesList(season, season.metadata.rottenId, episodeFunc);
                func(true);
            },
            error: function () {
                func(false);
            }
        });
    }


    function loadRottenTomatoesEpisode(episode, link, func) {
        if (bringe.page != "serie") return;
        $.ajax({
            url: link,
            success: function (result) {
                if (bringe.page != "serie") return;
                var parser = new DOMParser(),
                    doc = parser.parseFromString(result, "text/html"),
                    myDoc = $(doc),
                    img,
                    spans,
                    name,
                    role, i;
                var cast = myDoc.find(".cast-item");
                episode.cast = [];
                episode.image = myDoc.find('#tv-image-section img').attr("src");
                var audienceScore = myDoc.find(".audience-score .meter-value span").text().trim();
                if (audienceScore) {
                    episode.ratings.audienceScore = audienceScore;
                }
                for (i = 0; i < cast.length && i < 12; i++) {
                    var member = cast[i];
                    img = $(member).find("img").attr("src");
                    spans = $(member).find("span");
                    if (spans[0])
                        name = spans[0].textContent.trim();
                    if (spans[1])
                        role = spans[1].textContent.trim();
                    var person = {name: name || '', role: role || '', image: img};
                    episode.cast.push(person);
                }
                var episodeInfoList, oneInfo, label, value, infoList = [];
                episodeInfoList = myDoc.find("ul.content-meta li.meta-row");
                for (i = 0; i < episodeInfoList.length; i++) {
                    oneInfo = episodeInfoList[i];
                    label = $(oneInfo).find(".meta-label").text().trim();
                    value = $(oneInfo).find(".meta-value").text().trim();
                    infoList.push({label: label, value: value});
                }
                episode.infoList = infoList;
                func(true);
            },
            error: function () {
                func(false);
            }
        });
    }

    function getMovie(movie, func) {
        var rottenLink = "https://www.rottentomatoes.com" + movie.url;
        movie.rottenlink = rottenLink;
        loadRottenTomatoesMovie(movie, rottenLink, func);
    }

    function getSerie(serie, func) {
        if (serie.links && serie.links.rotten) {
            loadRottenTomatoesSerie(serie, serie.links.rotten, func);
        }
    }

    function getSeason(season, func, episodeFunc) {
        if (season.links && season.links.rotten) {
            loadRottenTomatoesSeason(season, season.links.rotten, func, episodeFunc);
        }
    }

    function getEpisode(episode, func) {
        if (episode.links && episode.links.rotten) {
            loadRottenTomatoesEpisode(episode, episode.links.rotten, func);
        }
    }

    return {
        searchMovie: searchMovie,
        getMovie: getMovie,
        getSerie: getSerie,
        getSeason: getSeason,
        getEpisode: getEpisode
    }
});
