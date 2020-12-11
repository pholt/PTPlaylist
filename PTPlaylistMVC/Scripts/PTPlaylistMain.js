// TODO: Database storing searches and videoIds to avoid searching "unnecessarily"?
// TODO: Add table for playlist objects. Make drag 'n' droppable. Make songs removable. 
// TODO: If video not found, show error?
// TODO: Scrolling with spacebar still happening

// ------------------------- GLOBAL DATA STRUCTURES -----------------------------
var player; 			// Object handling youtube video player usage.
var playlist = []; 		// List of videoIds for the player to play.
var playedVideos = []; 	// List of videoIds that have been played.
var currentVideo; 		// The currently-playing videoId.

var apiKey = "AIzaSyDsAmVRl5Gh6erfNjNQ-DBpeKa-5ukIcxc";

// ------------------------- DOCUMENT FUNCTIONS -----------------------------
$(function() {
	document.getElementById("query").readOnly = false;
	
	// Add listener for spacebar: pauses or plays video.
	if (document.addEventListener) {
		document.addEventListener("keyup", onKeyUp, false);
	} else {
		document.onkeyup = onKeyUp;
	}
});

// Listen for key events.
function onKeyUp(evt) {
	if (evt = evt ? evt : window.event ? event : null) {
		switch (evt.keyCode) {
			case 32: //spacebar
				// Don't interrupt typing input
				if (!($("#query").is(':focus'))) {
					document.getElementsByTagName("body")[0].focus();
					evt.preventDefault();
					onSpaceBarUp();
					return false;
				}
				break;

			default:
				break;
		}
	}
}

// Pauses/plays video when spacebar is hit.
function onSpaceBarUp() {
	if (player && currentVideo != null && currentVideo[1] != null) {
		var state = player.getPlayerState();
		if (state == 1) { // Is playing
			pauseVideo();
		} else if (state == 2) { // Is paused
			playVideo();
		} else { // Anything else?
			console.log("Spacebar hit, but the player state was: " + state);
		}
	}
}

// ------------------------- MAIN -----------------------------
// Sets up our youtube player object. Assigns listeners.
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', 
	{
		height: '390',
		width: '640',
		videoId: '',
		events: 
		{
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

// Called when the video player is ready.
function onPlayerReady(event) {
	//event.target.playVideo();
}

// Called when the video player state changes.
// event.data contains youtube player state.
/* 
Data enum for possible values of "event.data":
	-1 = unstarted
	0 = ended
	1 = playing
	2 = paused
	3 = buffering
	4 = ???
	5 = video cued
*/
function onPlayerStateChange(event) {
	if (event.data == 0) {
		nextVideo();
	} else if (event.data == 5) {
		playVideo();
	}
}

// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
	$('#search-button').attr('disabled', false);
}

// Separates inputs and adds them to the playlist.
// Called when the "Add to Playlist" button is pressed.
function search() {
	const input = $('#query').val().replace("-", " "); // Pesky dashes mess up the input.
	const inputDelimiterSelect = document.getElementById("inputDelimeterSelect");
	// Use newline regex if we have the first index, otherwise, go get the value
	const delimiter = inputDelimiterSelect.selectedIndex == 0 ? delimeter = /\n/ : inputDelimiterSelect.options[inputDelimiterSelect.selectedIndex].value; 
	const separatedValues = input.split(delimiter); // Get array of values.
	
	if($('#shuffleCheck').prop('checked')) {
		shuffleArray(separatedValues);
	}
	
	for (var i = 0; i < separatedValues.length; i++) {
		if (separatedValues[i] != null && separatedValues[i].trim() != "") { // Skip empty strings
			if ($('#addFrontCheck').prop('checked')) {
				playlist.unshift([separatedValues[i], null]); // Add to beginning of playlist
			} else {
				playlist.push([separatedValues[i], null]); // Add to end of playlist
			}
		}
	}
	
	showPlaylist();
	
	if (!currentVideo) { // If we haven't been told to play a video ever...
		// Attempt to play a video
		nextVideo();
	}
	
	$('#query').val(""); // Clear input field so users don't accidentally add the same input twice.
}

// Queries the YouTube API for the video id then sets the currentVideo id.
function queryForVideoId(input) {
	if (input) {
		var url = 'https://www.googleapis.com/youtube/v3/search';

		// Create request
		var request = {
			q: input,
			part: 'snippet',
			maxResults: 1,
			safeSearch: 'none',
			type: 'video',
			videoEmbeddable: 'true',
			key: apiKey
		};

		results = $.getJSON(url, request, handleYoutubeSearchResult);
	}
}

function handleYoutubeSearchResult(result) {
	if (result != null &&
		result.items != null &&
		result.items[0] != null &&
		result.items[0].id != null) {
		setCurrentVideoId(result.items[0].id.videoId);
	} else {
		// Not found. Do something?
		nextVideo(0);
	}
}

// Sets the currentVideo to the input value
function setCurrentVideoId(input) {
	if (currentVideo && input != null && input != "")
	{
		currentVideo = [currentVideo[0], input];
		cueYoutubeVideo(currentVideo);
	}
}

// Places playlist text into the playlistPreview element.
function showPlaylist() {
	var buildString = "";
	for (let playedVideoIndex = 0; playedVideoIndex < playedVideos.length; playedVideoIndex++) {
		buildString = buildString + (playedVideos[playedVideoIndex][0].trim()) + '\r\n';
	}
	
	if (currentVideo != null && currentVideo[0] != null) {
		buildString = buildString + currentVideo[0].trim() + '\r\n';
	}
	
	for (let i = 0; i < playlist.length; ++i) {
		buildString = buildString + (playlist[i][0].trim()) + '\r\n';
	}

	document.getElementById("playlistPreview").innerHTML = buildString;
	showCurrentSong();
}

// Highlights the currently playing song in the playlistPreview element.
function showCurrentSong() {
	if (currentVideo) {
		// Highlight text in preview box to show user where in the playlist we are.
		document.title = (currentVideo[0] + " | PTPlaylist");
		
		const a = document.createElement('a');
		const linkText = document.createTextNode(currentVideo[0] + " | " + currentVideo[1]);
		a.appendChild(linkText);
		a.title = currentVideo[0];
		a.href = "https://www.youtube.com/watch?v=" + currentVideo[1];
		document.getElementById('videoLabel').innerHTML = '';
		document.getElementById('videoLabel').appendChild(a);
			
		const preview = document.getElementById("playlistPreview"); 
		const startIndexOfVideoText = preview.value.indexOf(currentVideo[0]);
		const endIndexOfVideoText = startIndexOfVideoText + currentVideo[0].length;
		preview.setSelectionRange(startIndexOfVideoText, endIndexOfVideoText);
		if (playedVideos != null && playedVideos.length > 0) {
			// TODO: Goes too far if there is an entry taking up more than one line! Truncate?
			preview.scrollTop = (playedVideos.length) * 16; // 16 is text size plus margins in the text area. Perhaps this could be calculated...
		} else {
			preview.scrollTop = 0;
		}
	}
}

// Shuffles the playlist!
function shufflePlaylist() {
	shuffleArray(playlist, showPlaylist);
}

// Empties the playlist!
function clearPlaylist() {
	playlist = [];
	playedVideos = [];
	$('#playlistPreview').attr("value", currentVideo[0] + " | " + currentVideo[1]);
}

// Sets the size of the video player
// Minimum height and width are 180 x 180 according to YouTube API usage requirements
function setPlayerSize(width, height) {
	if (width < 180){
		width = 180;
	}
	
	if (height < 180){
		height = 180;
	}

	player.setSize(width, height);
}

// ------------------------- UTILITIES -----------------------------
/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 * https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
 */
function shuffleArray(a, callback) {
    let j, x, i;
    for (i = a.length; i; i--) 
	{
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
	
	if (callback)
	{
		callback();
	}
}

/*
// Shuffles two arrays
function shuffleParallelArrays(a, b)
{
	if (a.length != b.length) return;
	
	var j, x, y, i;
    for (i = a.length; i; i--) 
	{
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
		y = b[i - 1];
        a[i - 1] = a[j];
		b[i - 1] = b[j];
        a[j] = x;
		b[j] = y;
    }
}
*/

// Outputs the contents of a dictionary structure to console.
function logDictionary(dictionary)
{
	for(var key in dictionary)
	{
		if (dictionary.hasOwnProperty(key))
		{
			console.log(key + "->" + dictionary[key]);
		}
	}
}

// ------------------------- YOUTUBE VIDEO PLAYER FUNCTIONS -----------------------------

// Internal function for stopping player video.
function stopVideo() {
	if (player) {
		player.stopVideo();
	}
}

// Internal function for playing currently queued video.
function playVideo() {
	if (player) {
		showCurrentSong();
		player.playVideo();	
	}
}

// internal function for pausing currently queued video.
function pauseVideo() {
	if (player) {
		player.pauseVideo();
	}
}

function nextVideo() {
	if (player && playlist != null) {
		// push current video to playedVideos
		if (currentVideo != null) {
			playedVideos.push(currentVideo);
		}
		
		if (playlist.length > 0) {
			// get next video
			currentVideo = playlist.shift();
			cueYoutubeVideo(currentVideo);
		}
	}
}

function previousVideo() {
	if (playedVideos != null && playedVideos.length  > 0 && player) {
		// unshift current video to front of playlist
		playlist.unshift(currentVideo);
		// pop current video from back of playedVideos
		currentVideo = playedVideos.pop();
		cueYoutubeVideo(currentVideo);
	}
}

function restartPlaylist() {
	if (player) {
		// put currentVideo back into playlist
		// dump all from playedVideos back to playlist (unshift?)
		// play first video from playlist
	}
}

function removeVideoFromPlaylist(input) {
	
}

function removeCurrentVideoFromPlaylist() {
	if (player && playlist != null) {
		// Get rid of current video
		currentVideo = null;
		
		if(playlist.length > 0) {
			// get next video
			currentVideo = playlist.shift();
			cueYoutubeVideo(currentVideo);
		}
	}
}

// Assign a video to the youtube player. If no id is found, searches for it first.
function cueYoutubeVideo(video) {
	if (player && video != null) {
		if (video[1] != null && video[1] != "") {
			player.cueVideoById(video[1], 0, "large");
			//showCurrentSong();
		} else {
			// Pause or stop?
			stopVideo();
			queryForVideoId(video[0]);
		}
	}
}
