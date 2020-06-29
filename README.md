TheDrop on Sonos Chrome Extension
==================
**Deprecated - TheDrop Shut Down**

Chrome Extension that adds the ability to add tracks and playlists from TheDrop.club straight to your Sonos queue. Based on the Add to Sonos Queue Extension by <a href="https://github.com/robbi5">robbi5</a>


![Screenshot]()

Download
--------
Get it from the Chrome Web Store: (coming soon)

<!--

[![Available in the Chrome Web Store](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png)](https://chrome.google.com/webstore/detail/add-to-sonos-queue/mjlgdiclanhcloangjbhpmoagbhmjlgc)
-->

Permissions
-----------
* `https://api.soundcloud.com/*` - connection to the soundcloud api to get track information
* `http://*/MediaRenderer/AVTransport/Control` - needed for sending the soundcloud track to your sonos
* `http://*/xml/device_description.xml` - needed to test if the entered player ip is a sonos device
* `declarativeContent` - triggers the visibility of the button only on soundcloud.com
* `activeTab` - reads the soundcloud track url if the button was clicked

Development
-----------
Install [node.js](http://nodejs.org/) and [browserify](http://browserify.org/).

Install [Grunt](http://gruntjs.com/) and plugins with `npm install`.

Change things in `src`, use `grunt` to compile and copy to `dist/`.

Use the [Chrome Apps & Extensions Developer Tool](https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc) to load `dist/` as unpacked extension.

Dependencies
---------
[node-sonos](https://github.com/bencevans/node-sonos),
[Browserify](http://browserify.org),
[browser-request](https://github.com/iriscouch/browser-request),
[chrome-bootstrap](https://github.com/roykolak/chrome-bootstrap),
[zepto.js](http://zeptojs.com),
[mutation-summary](https://code.google.com/p/mutation-summary/)

License
-------
MIT
