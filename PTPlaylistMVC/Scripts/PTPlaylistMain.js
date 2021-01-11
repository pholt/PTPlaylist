// TODO: Database storing searches and videoIds to avoid searching "unnecessarily"?
// TODO: If video not found, show error?
// TODO: Scrolling with spacebar still happening

// ------------------------- GLOBAL DATA STRUCTURES -----------------------------
var player;                     // Object handling youtube video player usage.
var playlist = [];                 // List of {searchTerm, videoId} objects for the player to play.
var currentVideoIndex = -1;     // Index of the currently-cued videoId, set to -1 when nothing is cued.
var $grid;                        // Packery grid.

// ------------------------- DOCUMENT FUNCTIONS -----------------------------
$(function () {
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
        const state = player.getPlayerState();
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
            width: 640,
            height: 390,
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

// Separates inputs and adds them to the playlist.
// Called when the "Add to Playlist" button is pressed.
function search() {
    const input = $('#query').val().replace("-", " "); // Pesky dashes mess up the input.
    const inputDelimiterSelect = document.getElementById("inputDelimeterSelect");
    // Use newline regex if we have the first index, otherwise, go get the value
    const delimiter = inputDelimiterSelect.selectedIndex == 0 ? delimeter = /\n/ : inputDelimiterSelect.options[inputDelimiterSelect.selectedIndex].value;
    const separatedValues = input.split(delimiter); // Get array of values.

    if ($('#shuffleCheck').prop('checked')) {
        shuffleArray(separatedValues);
    }

    const videosToBeAdded = [];
    for (var i = 0; i < separatedValues.length; i++) {
        if (separatedValues[i] != null && separatedValues[i].trim() != "") { // Skip empty strings
            videosToBeAdded.push({
                searchTerm: separatedValues[i],
                videoId: null
            });
        }
    }

    if ($('#addFrontCheck').prop('checked') && currentVideoIndex > 0) {
        const previousSection = playlist.slice(0, currentVideoIndex + 1);
        const laterSection = playlist.slice(currentVideoIndex + 1);
        playlist = previousSection.concat(videosToBeAdded, laterSection);
    } else {
        playlist = playlist.concat(videosToBeAdded);
    }

    showPlaylist();

    if (currentVideoIndex == -1) { // If we haven't been told to play a video ever...
        // Attempt to play a video
        nextVideo();
    }

    $('#query').val(""); // Clear input field so users don't accidentally add the same input twice.
}

// Queries the YouTube API for the video.
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

// Populates current video with id
function handleYoutubeSearchResult(result) {
    if (result != null &&
        result.items != null &&
        result.items[0] != null &&
        result.items[0].id != null) {
        const videoId = result.items[0].id.videoId;
        playlist[currentVideoIndex].videoId = videoId;
        if (currentVideoIndex == -1) {
            currentVideoIndex = 0;
        }
        $($("#playlistGrid").children()[currentVideoIndex]).find(".video-name").attr("data-video-id", videoId);
        setCurrentVideo(currentVideoIndex);
    } else {
        // Not found. Do something?
        nextVideo();
    }
}

// Sets the currentVideo to the video in the playlist with the given index
function setCurrentVideo(index) {
    if (index >= 0 && index < playlist.length) {
        currentVideoIndex = index;
        cueYoutubeVideo(playlist[currentVideoIndex]);
    }
}

// Build and show playlist UI
function showPlaylist() {
    // Clear old playlist
    $("#playlistGrid").html("");

    // Build playlist items
    const template = $("#playlistItemTemplate").find(".playlist-item").clone(true);
    template.removeAttr("hidden");
    playlist.forEach(function (item, index) {
        let videoDataNode = template.find(".video-name");
        videoDataNode.text(item.searchTerm);
        videoDataNode.attr("data-search-term", item.searchTerm);
        videoDataNode.attr("data-video-id", item.videoId);
        $("#playlistGrid").append(template[0].cloneNode(true));
    });

    // Don't really need anything dynamic if there's only one item
    if (playlist.length > 1) {
        // Apply Packery grid
        $grid = $('.grid').packery({
            itemSelector: '.playlist-item',
            columnWidth: 140,
            gutter: 2
        });

        // Apply Draggabilly to make all playlist-items draggable
        $grid.find('.playlist-item').each(function (i, gridItem) {
            var draggie = new Draggabilly(gridItem, {
                axis: 'y',
                handle: '.handle'
            });
            // Bind drag events to Packery
            $grid.packery('bindDraggabillyEvents', draggie);
        });

        // TODO: Bug here blows out playlist data when adding videos
        // $grid.on('layoutComplete', orderItems);
        $grid.on('dragItemPositioned', orderItems);
    }
}

function orderItems() {
    const itemElems = $grid.packery('getItemElements');
    $(itemElems).each(function (i, itemElem) {
        $(itemElem).find(".video-index").text(i + 1);
    });
    setPlaylistFromUI();
}

function setPlaylistFromUI() {
    playlist = [];
    $("#playlistGrid").children().each(function (index, element) {
        let videoInfoNode = $(element).find(".video-name");
        let indexNode = $(element).find(".video-index");
        let playlistIndex = parseInt(indexNode.text()) - 1;
        playlist[playlistIndex] = {
            searchTerm: videoInfoNode.attr("data-search-term"),
            videoId: videoInfoNode.attr("data-video-id")
        };
    });
}

// Adjusts view so user can see the UI representation of the current video
function showCurrentSong() {
    // TODO: Scroll playlist container to show currently-playing video
}

// Shuffles the playlist
function shufflePlaylist() {
    const previousSection = playlist.slice(0, currentVideoIndex + 1);
    const laterSection = playlist.slice(currentVideoIndex + 1);
    shuffleArray(laterSection);
    playlist = previousSection.concat(laterSection);
    showPlaylist();
}

// Resets playlist state to "no videos in playlist and we've never played anything"
function clearPlaylist() {
    playlist = [];
    currentVideoIndex = -1;
    showPlaylist();
}

// Sets the size of the video player
// Minimum height and width are 180 x 180 according to YouTube API usage requirements
function setPlayerSize(width, height) {
    if (width < 180) {
        width = 180;
    }

    if (height < 180) {
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
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }

    if (callback) {
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
function logDictionary(dictionary) {
    for (let key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
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

// Internal function for pausing currently queued video.
function pauseVideo() {
    if (player) {
        player.pauseVideo();
    }
}

function nextVideo() {
    if (player) {
        currentVideoIndex++;

        if (currentVideoIndex >= 0 && currentVideoIndex < playlist.length) {
            cueYoutubeVideo(playlist[currentVideoIndex]);
        }
    }
}

function previousVideo() {
    if (player) {
        currentVideoIndex--;

        if (currentVideoIndex >= 0) {
            cueYoutubeVideo(playlist[currentVideoIndex]);
        } else {
            currentVideoIndex = -1;
            stopVideo();
        }
    }
}

function restartPlaylist() {
    if (player) {
        currentVideoIndex = 0;
        cueYoutubeVideo(playlist[currentVideoIndex]);
    }
}

function removeVideoFromPlaylist(index) {
    if (player && playlist != null && index >= 0 && index < playlist.length) {
        playlist.splice(index);

        if (index < currentVideoIndex) {
            currentVideoIndex--;
        } else if (currentVideoIndex == index) {
            // Plays the next song
            cueYoutubeVideo(playlist[currentVideoIndex]);
        }

    } else {
        console.log("Tried to remove song with index " + index + ", but legal indices are between 0 and " + playlist.length - 1);
    }
}

// Assign a video to the youtube player. If no id is found, searches for it first.
function cueYoutubeVideo(video) {
    if (player && video !== null) {
        if (video.videoId) {
            player.cueVideoById(video.videoId, 0, "large");
        } else {
            stopVideo();
            queryForVideoId(video.searchTerm);
        }
    }
}
