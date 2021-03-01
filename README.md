# PTPlaylist

This project is designed to help with the following scenario:
1) You have a playlist of videos on YouTube.
2) Videos from your playlist disappear; either the channel they're associated with is dead or they remove the video (for whatever reason).
3) You have no way of recovering information about these missing videos.

## Solution:
Instead of storing YouTube playlists as playlists on YouTube, store them as plain text search queries!
Using search queries as playlist entries preserves intent. You may not get exactly the video you were hoping for, but it's better than not knowing what the item in the playlist was in the first place.

This application is fairly simple. It splits text input up into individual search queries, then when it's time to play the entry, it searches YouTube and plays the top search result. So the output is only as good (or specific) as the input search query, limited by YouTube's own search algorithms of course.

## Usage:
I deploy this via Web Deploy in Visual Studio. If you want to run this, you'll need to plug in your own YouTubeV3 enabled API key into the Web.config. 

More info on getting that setup can be found here: https://developers.google.com/youtube/v3
