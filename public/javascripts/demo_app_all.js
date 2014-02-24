/**
 * Created by pinha_000 on 2/23/14.
 */
//Used this for all js
var youTubeKey = 'AIzaSyCAq5lj3JNoROznKdnK6aWOzQXHj555PXI';

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
delete window.tag;
delete window.firstScriptTag;
//YT API init
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var apiReady = false;
function onYouTubeIframeAPIReady() {
    apiReady = true;
}
var myDemoAppModule = angular.module('myDemoApp', ['ngRoute','youtube']);
myDemoAppModule.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/play', {
                templateUrl: '../views/play.view.html'
            }).
            when('/home', {
                templateUrl: '../views/home.view.html'
            }).
            otherwise({
                redirectTo: '/home'
            });
    }]);
myDemoAppModule.controller('MainController', ['$scope', function ($scope) {
    $scope.hiThere = "Hello app";
}]);

myDemoAppModule.directive('home', [function () {
    var dir = {};
    dir.templateUrl = "../templates/home.tpl.html";
    dir.restrict = 'E';
    dir.replace = true;
    dir.link = function (scope, el) {

    };
    return dir;
}]);


myDemoAppModule.directive('searchBar', ['YouTubeApi', 'YTPlayerController', '$timeout', function (ytApi, ytController, $timeout) {
    var dir = {};
    dir.templateUrl = "../templates/search.tpl.html";
    dir.restrict = 'E';
    dir.replace = true;
    dir.link = function (scope, el) {
        var timeoutPromise;
        var searchDelay = 350;
        function searchYT(val) {
            ytApi.search(val)
                .then(function(results) {
                    scope.list = results.data.items;
                });
        }

        scope.list = [];
        scope.load = function() {
            return ytApi.getMore().success(function(results) {
                scope.list = scope.list.concat(results.items);
            })
        };
        scope.hasMore = function() {
            return ytApi.hasMore();
        };
        scope.addItem = function(item, $evt) {
            $evt.stopPropagation();
            ytController.addToQueue(item);
        };
        function hideSearchDropDown() {
            scope.hideSearchDropDown = true;
            scope.$apply();
        }
        scope.unHide = function($event) {
            scope.hideSearchDropDown = false;
            $event.stopPropagation();
        };

        scope.$watch('ytSearch',function(newVal, oldVal) {
            if (!newVal) {
                scope.list = [];
                scope.hasSearchTerm = false;
                return;
            }
            scope.hideSearchDropDown = false;
            scope.hasSearchTerm = true;
            if (timeoutPromise) {
                $timeout.cancel(timeoutPromise);
            }
            timeoutPromise = $timeout(function() {
                if (newVal === '') {
                    scope.list = [];
                } else {
                    searchYT(newVal);
                }
            },searchDelay);
        });

        $('body').bind('click.search',hideSearchDropDown);
        scope.$on('$destroy',function() {
            $('body').unbind('.search')
        });

    };
    return dir;
}]);

myDemoAppModule.directive('stretchToFill', [function () {
    var dir = {};
    dir.restrict = 'A';
    dir.link = function (scope, el) {
        var $el = $(el);
        var maxWidth = $el.parent().width();
        var maxHeight = $el.parent().height();
        $el.css({height: maxHeight + 'px', width: maxWidth + 'px'});
    };
    return dir;
}]);


myDemoAppModule.directive('lazyLoadList',[function() {
    var dir = {};
    dir.replace = true;
    dir.restrict = 'E';
    dir.transclude = true;
    dir.templateUrl = "../templates/lazy.load.list.tpl.html";
    dir.scope = true;
    dir.link = function(scope,el,attr) {
        scope.get = scope.$eval(attr['getMore']);
        scope.hasMore = scope.$eval(attr['hasMore']);
        scope.max = angular.isNumber(attr['max']) ? parseFloat(attr['max']) : 50;
        var fetching = false;
        var handleScroll = function(evt) {
            if (fetching) {
                return;
            }
            var percentageScrolled = (evt.target.scrollTop + $(evt.target).height()) / evt.target.scrollHeight;
            if (percentageScrolled >= 0.85 && scope.list.length < scope.max) {
                fetching = true;
                scope.get().success(function() {
                    fetching = false;
                });
            }
        };

        el.bind('scroll',handleScroll);
    };
    return dir;
}]);

myDemoAppModule.directive('videoList',['YTPlayerController', function(ytController) {
    var dir = {};
    dir.replace = true;
    dir.restrict = 'E';
    dir.templateUrl = "../templates/video.list.tpl.html";
    dir.link = function(scope,el) {
        scope.videos = ytController.getList();
    };
    return dir;
}]);

myDemoAppModule.controller('IFrameController',['YTPlayerController',function(ytController) {
    ytController.iFrameTplLoaded();
}]);