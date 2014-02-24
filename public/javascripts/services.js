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
    var videoListName = '';
    var curPlayingIdx = 0, selectedIdx = false;

    function loadVideo(idx) {
        if (idx < videoList.length) {
            if (!player) {
                initPlayer();
                selectedIdx = idx;
                return;
            }
            player.loadVideoById(videoList[idx].id.videoId);
            curPlayingIdx = idx;
        }
    }

    function loadNext() {
        if (selectedIdx !== false) {
            loadVideo(selectedIdx);
            selectedIdx = false;
        } else {
            curPlayingIdx++;
            loadVideo(curPlayingIdx);
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            loadNext();
        }
    }
    function initPlayer() {
        if (apiReady && !playerReady) {
            player = new YT.Player('ytIframe', {
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }
    }
    $rootScope.$on('$locationChangeSuccess',function() {
        if ($location.$$path != "/play") {
            playerReady = false;
        }
    });
    function onPlayerReady() {
        if (selectedIdx !== false) {
            loadVideo(selectedIdx);
            selectedIdx = false;
        } else {
            curPlayingIdx = 0;
            loadVideo(curPlayingIdx);
        }
        playerReady = true;

    }

    this.iFrameTplLoaded = function () {
        initPlayer();
    };
    function getVideoIdx(video) {
        for (var i= 0, len= videoList.length; i<len; i++) {
            if (videoList[i].id.videoId === video.id.videoId) {
                return i;
            }
        }
        return -1;
    }
    this.addToQueue = function (video) {
        var idx = getVideoIdx(video);
        if (idx !== -1) {
            return;
        }
        videoList.push(video);
        if (videoList.length === 1) {
            if ($location.$$path !== '/play') {
                $location.path('/play');
            } else {
                initPlayer();
            }
        }
    };
    this.removeFromQueue = function (idx) {
        if (curPlayingIdx > idx) {
            curPlayingIdx--;
        } else {
            if (curPlayingIdx === idx) {
                loadNext();
            }
        }
        videoList.splice(idx,1);
    };
    this.play = function (idx, forcePlay) {
        selectedIdx = idx;
        if ($location.$$path !== '/play') {
            $location.path('/play');
        } else {
            if (forcePlay || selectedIdx !== curPlayingIdx) {
                loadNext();
            } else {
                selectedIdx = false;
            }
        }
    };
    this.loadVideoList = function(list, name) {
        videoListName = name;
        videoList = list;
        this.play(0, true);
    };
    this.getList = function () {
        return {list: videoList, name: videoListName};
    };


}]);

ytModule.service('LocalStorageService',  ['$rootScope', function ($rootScope) {
    var listsKey = "all_lists";
    var allLists = JSON.parse(localStorage.getItem(listsKey)) || [];
    function broadcastListChanged() {
        $rootScope.$broadcast('savedListChanged');
    }
    function getListIdxByName(name) {
        for (var i = 0, len = allLists.length; i < len; i++) {
            if (allLists[i].name === name) {
                return i;
            }
        }
        return -1;
    }

    this.saveList = function (name, list) {
        var idx = getListIdxByName(name);
        if (idx !== -1) {
            allLists[idx].list = list;
        } else {
            allLists.push({name: name, list: list});
        }
        broadcastListChanged();
    };
    this.getList = function (name) {
        var idx = getListIdxByName(getListIdxByName(name));
        if (idx !== -1) {
            return allLists[idx].list;
        }
        return [];
    };

    this.removeFromList = function($index) {
        allLists.splice($index,1);
        broadcastListChanged();
    };
    this.getLists = function () {
        return angular.copy(allLists);
    };
    function persist() {
        localStorage.setItem(listsKey, JSON.stringify(allLists));
    }

    $(window).unload(persist);
}]);
