/**
 * Created by pinha_000 on 2/23/14.
 */

var ytModule = angular.module('youtube', []);

ytModule.service('YouTubeApi', ['$http', function ($http) {
    var searchUrlPrefix = 'https://www.googleapis.com/youtube/v3/search?type=video&part=snippet&q=';
    var searchSuffix = '&key=AIzaSyCAq5lj3JNoROznKdnK6aWOzQXHj555PXI';
    var maxResults = 10;
    var nextPageToken, curPage, resultsCount, maxAvailableResults, lastSearch;
    this.setMaxResults = function (max) {
        //google's max is 50
        if (max > 50) {
            max = 50;
        }
        //no reason to get less than 5
        if (max < 5) {
            max = 5;
        }
        maxResults = max;
    };
    function addMaxQuery() {
        return "&maxResults=" + maxResults;
    }

    function addPageToken() {
        return "&pageToken=" + nextPageToken;
    }

    this.search = function (query) {
        var promise = $http.get(searchUrlPrefix + query + searchSuffix + addMaxQuery());
        promise.success(function (result) {
            curPage = 1;
            resultsCount = result.pageInfo.resultsPerPage;
            maxAvailableResults = result.pageInfo.totalResults;
            nextPageToken = result.nextPageToken;
            lastSearch = query;
        });
        return promise;
    };
    this.hasMore = function () {
        return resultsCount <= maxAvailableResults;
    };
    this.getMore = function () {
        if (!this.hasMore()) {
            return;
        }
        var promise = $http.get(searchUrlPrefix + lastSearch + searchSuffix + addMaxQuery() + addPageToken());
        promise.success(function (results) {
            curPage++;
            resultsCount += results.pageInfo.resultsPerPage;
            nextPageToken = results.nextPageToken;
        });
        return promise;
    };
}]);

ytModule.service('YTPlayerController', ['$location', '$rootScope', function ($location, $rootScope) {
    var videoList = [];
    var player;
    var playerReady = false;
    var curPlayingIdx = 0;

    function loadNext() {
        if (curPlayingIdx < videoList.length) {
            player.loadVideoById(videoList[curPlayingIdx].id.videoId);
            curPlayingIdx++;
        }
    }
    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            loadNext();
        }
    }
    function initPlayer() {
        if (apiReady) {
            console.log(document.getElementById('ytIframe'));
            player = new YT.Player('ytIframe', {
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }
    }
    function onPlayerReady() {
        curPlayingIdx = 0;
        player.loadVideoById(videoList[curPlayingIdx].id.videoId);
        playerReady = true;
        curPlayingIdx++;
    }
    this.iFrameTplLoaded = function() {
      initPlayer();
    };
    this.addToQueue = function (video) {
        videoList.push(video);
        if (videoList.length === 1) {
            if ($location.$$path !== '/play') {
                $location.path('/play');
            } else {
                initPlayer();
            }
        }
    };
    this.removeFromQueue = function (id) {

    };
    this.play = function (id) {

    };

    this.playAll = function () {

    };
    this.getList = function () {
        return videoList;
    };


}]);
