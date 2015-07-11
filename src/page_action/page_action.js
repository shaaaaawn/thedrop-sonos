'use strict';

var Q = require('Q');
var request = require('browser-request');
var Sonos = require('sonos').Sonos;

var SC_CLIENT_ID = '23e4216436888333b85bec82a5e7c075';
var CURRENT_ITEM = null;

var gotDropUrl = function(url) {
    console.log("start gotDropUrl - " + url);
    
    chrome.runtime.sendMessage({action: 'getDropDetails', url: url}, function(response) {
    if (response.error) {
        console.log("this wont work here");
      if (response.status) { return notATrackPage(); }
      return failedToLoad();
    }
    if (response.kind === 'stream') { var p = "2015-07-10";
        var soundcloud_id = response.data.p[0].soundcloud_id;
        console.log("soundcloud track id - " + soundcloud_id);
        var soundcloud_url = response.data.p[0].url; 
        console.log("soundcloud url - " + soundcloud_url);
        gotSoundCloudUrl(soundcloud_url);    
    } else if (response.kind === 'monthly') {
        var soundcloud_id = response.data.July[0].soundcloud_id;
        console.log("soundcloud track id - " + soundcloud_id);
        var soundcloud_url = response.data.July[0].url; 
        console.log("soundcloud url - " + soundcloud_url);
        gotSoundCloudUrl(soundcloud_url);
    } else if (response.kind === 'track') {
        var soundcloud_id = response.data.track.soundcloud_id;
        console.log("soundcloud track id - " + soundcloud_id);
        var soundcloud_url = response.data.track.url; 
        console.log("soundcloud url - " + soundcloud_url);
        gotSoundCloudUrl(soundcloud_url);
    }
    
    //gotSoundCloudTrack(response.data, kind);
      
  });
};
var gotSoundCloudUrl = function(url) {
  var kind, m = url.match(/soundcloud.com\/([^\/]+)\/likes$/);
  if (m) {
    if (m[1] === 'you') {
      return failure('Sorry, retrieving your likes is currently not supported.');
    }
    kind = 'list';
  }

  chrome.runtime.sendMessage({action: 'getUrlDetails', url: url}, function(response) {
    if (response.error) {
      if (response.status) { return notATrackPage(); }
      return failedToLoad();
    }
    gotSoundCloudTrack(response.data, kind); 
  });
};

var failure = function(message, displaySettings) {
  displaySettings = displaySettings || false;
  [].forEach.call(
    document.querySelectorAll('section.selected'),
    function(el) {
      el.classList.remove('selected');
    }
  );
  var failure_view = document.getElementById('sc_failure_view');
  failure_view.classList.add('selected');
  document.getElementById('failure__message').innerText = message;
  if (displaySettings) {
    failure_view.classList.add('has-settings');
  } else {
    failure_view.classList.remove('has-settings');
  }
};

var failedToLoad = function() {
  failure('Failed to load track details');
};

var notATrackPage = function() {
  failure('This doesn\'t look like a track page');
};

var gotSoundCloudTrack = function(data, kind) {
  kind = kind || data.kind;
  if (kind != 'track' && kind != 'playlist' && kind != 'list') { return notATrackPage(); }
  if (kind == 'list') {
    data = wrapPureTrackList(data);
      console.log(data);
  }

  CURRENT_ITEM = data;

  document.getElementById('track_view').classList.add('selected');

  var wrap = document.getElementById('track0');
  if (typeof data.title !== 'undefined') {
    var image_url = data.artwork_url || data.user.avatar_url;
    wrap.querySelector('.track__art img').src = image_url;
    wrap.querySelector('.track__username').innerText = data.user.username;
    wrap.querySelector('.track__title').innerText = data.title;
    wrap.querySelector('.soundcloud-logo').href = data.permalink_url;
  } else {
    wrap.classList.add('hidden');
  }

  if (data.streamable === false) {
    document.getElementById('actions').innerText = 'Sorry, this track has Sonos streaming disabled.';
  }

  if (kind == 'list' || kind == 'playlist') {
    gotSoundCloudPlaylist(data);
  }
};

var wrapPureTrackList = function (data) {
  return {kind: 'list', tracks: data};
};

var gotSoundCloudPlaylist = function(data) {
  // add track list
  document.getElementById('track_view').classList.add('is-playlist');
  var list = document.getElementById('playlist');
  var tpl = list.removeChild(list.querySelector('.compactTrack'));
  data.tracks.forEach(function(track) {
    var el = tpl.cloneNode(true);
    var image_url = track.artwork_url || track.user.avatar_url || data.user.avatar_url;
    el.querySelector('.track__art img').src = image_url;
    el.querySelector('.track__title').innerText = track.title;
    list.appendChild(el);
  });

  // rename button
  document.getElementById('add_to_queue').innerText = 'Add Playlist to Sonos Queue';
  document.getElementById('instaplay').disabled = true;
};

document.getElementById('add_to_queue').addEventListener('click', function(ev) {
  ev.preventDefault();
  if (CURRENT_ITEM === null) { return; }
  var self = this;
  self.classList.remove('success');
  self.classList.add('working');

  var done = function () {
    self.classList.remove('working');
    self.classList.add('success');
  };

  if (CURRENT_ITEM.kind == 'track') {
    addToQueue(CURRENT_ITEM).then(done).fail(createErrorFn('add track to queue'));
  } else {
    addToQueue(CURRENT_ITEM).then(done).fail(createErrorFn('add tracks to queue'));
  }
}, false);

document.getElementById('instaplay').addEventListener('click', function(ev) {
  ev.preventDefault();
  if (CURRENT_ITEM === null) { return; }
  var self = this;
  self.classList.remove('success');
  play(CURRENT_ITEM)
    .then(function() {
      self.classList.add('success');
    })
    .fail(createErrorFn('play track'));
}, false);

[].forEach.call(
  document.querySelectorAll('[rel="settings"]'),
  function(el) {
    el.addEventListener('click', function(ev) {
      ev.preventDefault();
      chrome.runtime.sendMessage({action: 'openSettings'});
    }, false);
  }
);

var createErrorFn = function(action) {
  return function (err) {
    var reason = 'Player is not reachable.';
    if (typeof err.code !== 'undefined') {
      reason = 'Player is not reachable. (' + err.code + ')';
    } else if (typeof err.message !== 'undefined') {
      reason = err.message;
    }
    failure('Couldn\'t ' + action + ': ' + reason, true);
  };
};

var play = function(track) {
  return Q.Promise(function(resolve, reject, notify) {
    chrome.runtime.sendMessage({action: 'play', track: track}, function(response) {
      if (response.error) {
        return reject(response);
      }
      resolve(response);
    });
  });
};

var addToQueue = function(track) {
  return Q.Promise(function(resolve, reject, notify) {
    chrome.runtime.sendMessage({action: 'addToPlaylist', track: track}, function(response) {
      if (response.error) {
        return reject(response);
      }
      resolve(response);
    });
  });
};

// get current url of page
chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
  if (tabs[0].url.indexOf('thedrop.club') > -1) {
    console.log("send url to gotSoundCloudURL - " + tabs[0].url);
      gotDropUrl(tabs[0].url);
      
  }
});