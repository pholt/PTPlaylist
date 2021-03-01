// TODO: Database storing searches and videoIds to avoid searching "unnecessarily"?
// TODO: If video not found, show error?
// TODO: Scrolling with spacebar still happening
// TODO: Add songs "form" should be a popover that can be called back with a button.
// TODO: Playing song in playlist should be highlighted.
// TODO: Support removing individual songs from playlist via playlist UI.
// TODO: Play button on each song in playlist UI to skip to it.
// TODO: Export playlist to clipboard doesn't work.

// ------------------------- GLOBAL DATA STRUCTURES -----------------------------
var player;                        // Object handling youtube video player usage.
var playlist = [];                 // List of {searchTerm, videoId} objects for the player to play.
var currentVideoIndex = -1;        // Index of the currently-cued videoId, set to -1 when nothing is cued.
var packeryGrid;                   // Packery grid.

// ------------------------- DOCUMENT FUNCTIONS -----------------------------
$(function () {
    packeryGrid = $('.grid').packery({
        itemSelector: '.playlist-item',
        gutter: 2
    });

    packeryGrid.on('dragItemPositioned', orderItems);
    document.getElementById("query").readOnly = false;
    $("#copyPlaylistButton").on('click', exportPlaylistToText);
    $("#playlistGrid").on('click', playlistGridDelegate);

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
    if (player) {
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
    if (isIndexInBounds(currentVideoIndex)) {
        if (event.data == 0) {
            nextVideo();
        } else if (event.data == 1 || event.data == 2) {
            showCurrentVideoElement();
        } else if (event.data == 5) {
            playVideo();
        }
    } else {
        player.stopVideo();
        showCurrentVideoElement();
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
        showPlaylist();
    } else {
        playlist = playlist.concat(videosToBeAdded);
        appendToPlaylistUI(videosToBeAdded);
    }

    if (currentVideoIndex === -1 && playlist.length > 0) { // If we haven't been told to play a video ever...
        // Attempt to play a video
        currentVideoIndex = 0;
        setCurrentVideo(currentVideoIndex);
    }

    $('#query').val(""); // Clear input field so users don't accidentally add the same input twice.
}

// Queries the YouTube API for the video.
function queryForVideoId(input) {
    if (input) {
        results = $.getJSON("/api/data", { query: input }, handleYoutubeSearchResult);
    }
}

// Populates current video with id
function handleYoutubeSearchResult(result) {
    result = JSON.parse(result);
    if (result != null &&
        result.items != null &&
        result.items[0] != null &&
        result.items[0].id != null) {
        const videoId = result.items[0].id.videoId;
        if (currentVideoIndex === -1) {
            currentVideoIndex = 0;
        }
        playlist[currentVideoIndex].videoId = videoId;
        // Set videoId in UI element
        const elementInUI = packeryGrid.packery('getItemElements').filter(item => $(item).find(".video-name").attr("data-video-index") === currentVideoIndex + "")[0];
        $(elementInUI).find(".video-name").attr("data-video-id", videoId);
        setCurrentVideo(currentVideoIndex);
    } else {
        // Error!
        console.log("Unexpected result: " + result);
    }
}

// Sets the currentVideo to the video in the playlist with the given index
function setCurrentVideo(index) {
    if (isIndexInBounds(index)) {
        currentVideoIndex = index;
        cueYoutubeVideo(playlist[currentVideoIndex]);
    }
}

// Build and show playlist UI
function showPlaylist() {
    // Rebuild playlist by removing all elements and re-adding from playlist data object.
    packeryGrid.packery('remove', $(".playlist-item"));
    appendToPlaylistUI(playlist);
}

// Add videos to the end of the playlist UI
function appendToPlaylistUI(videos) {
    // Build playlist items
    const template = $("#playlistItemTemplate").find(".playlist-item").clone(true);
    template.removeAttr("hidden");
    videos.forEach(function (item, index) {
        let videoDataNode = template.find(".video-name");
        videoDataNode.text(item.searchTerm);
        videoDataNode.attr("data-search-term", item.searchTerm);
        videoDataNode.attr("data-video-id", item.videoId);
        videoDataNode.attr("data-video-index", index);
        let completeNode = template[0].cloneNode(true);
        packeryGrid.append(completeNode).packery('addItems', completeNode);
    });

    packeryGrid.packery();

    // Apply Draggabilly to make all playlist-items draggable
    packeryGrid.find('.playlist-item').each(function (i, gridItem) {
        let draggie = new Draggabilly(gridItem, {
            axis: 'y',
            handle: '.video-handle'
        });

        // Bind drag events to Packery
        packeryGrid.packery('bindDraggabillyEvents', draggie);
    });
}

// Dragging elements around doesn't change their index position within the container, 
// so apply index manually and update currentIndex.
function orderItems() {
    console.log("Re-indexing items...");
    const itemElems = packeryGrid.packery('getItemElements');
    // Get current UI element before we apply new indices
    const currentVideoElement = getPlaylistElementAtIndex(currentVideoIndex);
    $(itemElems).each(function (index, itemElem) {
        $(itemElem).find(".video-name").attr("data-video-index", index);
    });

    setPlaylistFromUI(currentVideoElement);
}

// Rebuild playlist from changes in the UI.
function setPlaylistFromUI(currentVideoElement) {
    playlist = [];
    $("#playlistGrid").children().each(function (index, element) {
        let videoInfoNode = $(element).find(".video-name");
        let playlistIndex = parseInt(videoInfoNode.attr("data-video-index"));
        playlist[playlistIndex] = {
            searchTerm: videoInfoNode.attr("data-search-term"),
            videoId: videoInfoNode.attr("data-video-id")
        };
    });

    if (currentVideoElement) {
        currentVideoIndex = parseInt($(currentVideoElement).find(".video-name").attr("data-video-index"));
    }
}

// Adjusts view so user can see the UI representation of the current video
function showCurrentVideoElement() {
    // Scroll video into view
    if (isIndexInBounds(currentVideoIndex)) {
        getPlaylistElementAtIndex(currentVideoIndex).scrollIntoView();
    }

    // Highlight current playlist item in UI (and un-highlight non-playing items), and manage play/pause button UI state
    $(".playlist-item").each(function () {
        const element = $(this);
        const elementIndex = parseInt(element.find(".video-name").attr("data-video-index"));
        element.toggleClass("playing", elementIndex === currentVideoIndex);
        const playButtonElement = element.find(".video-play-button-container :first-child");
        if (elementIndex === currentVideoIndex) { 
            playButtonElement.removeClass("play");
            playButtonElement.addClass("pause");
        } else {
            playButtonElement.removeClass("pause");
            playButtonElement.addClass("play");
        }
    });
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
    packeryGrid.packery('remove', $(".playlist-item"));
}

function getPlaylistElementAtIndex(index) {
    if (index === undefined) {
        index = currentVideoIndex;
    }
    return packeryGrid.packery('getItemElements').filter(item => $(item).find(".video-name").attr("data-video-index") === index + "")[0];
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

function exportPlaylistToText() {
    const inputDelimiterSelect = document.getElementById("inputDelimeterSelect");
    const delimiter = inputDelimiterSelect.selectedIndex == 0 ? delimeter = /\n/ : inputDelimiterSelect.options[inputDelimiterSelect.selectedIndex].value;
    navigator.clipboard.writeText(playlist.map(item => item.searchTerm).join(delimiter)).then(
        function () { console.log("Wrote playlist to clipboard."); }, // Success
        function () { console.log("Failed to write playlist to clipboard."); } // Failure
    );
}

// Handles play/pause/remove buttons on playlist items.
// TODO: Probably should refactor individual actions...
function playlistGridDelegate(event) {
    const target = event.target;
    let parentElement = $(target);
    for (let i = 0; i < 3; ++i) { // TODO: This is a hack! 
        if (parentElement.hasClass("playlist-item")) {
            break;
        } else {
            parentElement = parentElement.parent();
        }
    }

    if (!parentElement.hasClass("playlist-item")) {
        return;
    }

    const index = parseInt(parentElement.find(".video-name").attr("data-video-index"));

    if (target.className === "play") {
        if (currentVideoIndex === index) { // This video is already cued and playing
            playVideo();
        } else { // This video is not cued, cue it and play it
            setCurrentVideo(index);
        }
        target.classList.remove("play");
        target.classList.add("pause");
    } else if (target.className === "pause") {
        pauseVideo();
        target.classList.remove("pause");
        target.classList.add("play");
    } else if (target.className === "video-remove-button") {
        removeVideoFromPlaylist(index);
    }
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

// Outputs the contents of a dictionary structure to console.
function logDictionary(dictionary) {
    for (let key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
            console.log(key + "->" + dictionary[key]);
        }
    }
}

function isIndexInBounds(index) {
    return index >= 0 && index < playlist.length;
}

// ------------------------- YOUTUBE VIDEO PLAYER FUNCTIONS -----------------------------

// Internal function for stopping player video.
function stopVideo() {
    if (player) {
        currentVideoIndex = -1;
        player.stopVideo();
    }
}

// Internal function for playing currently queued video.
function playVideo() {
    if (player) {
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

        if (isIndexInBounds(currentVideoIndex)) {
            cueYoutubeVideo(playlist[currentVideoIndex]);
            showCurrentVideoElement();
        }
    }
}

function previousVideo() {
    if (player) {
        --currentVideoIndex;

        if (isIndexInBounds(currentVideoIndex)) {
            cueYoutubeVideo(playlist[currentVideoIndex]);
            showCurrentVideoElement();
        } else {
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
    if (player && playlist.length > 0 && isIndexInBounds(index)) {
        // Remove from playlist UI
        const elementToRemove = getPlaylistElementAtIndex(index);
        packeryGrid.packery('remove', $(elementToRemove)).packery('shiftLayout');

        const playNextVideo = index === currentVideoIndex;
        orderItems(); // This will set currentVideoIndex to the correct value
        if (playNextVideo) {
            setCurrentVideo(currentVideoIndex);
        }
    } else {
        console.log("Tried to remove video with index " + index + ", but legal indices are between 0 and " + (playlist.length - 1));
    }
}

// Assign a video to the youtube player. If no id is found, searches for it first.
function cueYoutubeVideo(video) {
    if (player && video !== null) {
        if (video.videoId) {
            player.cueVideoById(video.videoId, 0, "large");
            showCurrentVideoElement();
        } else {
            stopVideo();
            queryForVideoId(video.searchTerm);
        }
    }
}

// ------------------------- TESTING FUNCTIONS -----------------------------

// Testing function to create mock playlist.
// Adds n items (default 1) to the playlist. Prepends a number to the search term text to make items easier to track.
function mock(times = 1) {
    const mockPlaylistItems = [
        {
            searchTerm: "Donkey Kong Country 2 - In A Snow-Bound Land SNES -extended",
            videoId: "xo9NgEG-7Tc"
        },
        {
            searchTerm: "U.R.F. Theme Song 2015 (League of Legends) Welcome to Planet U.R.F.",
            videoId: "qYIiy03eGE0"
        },
        {
            searchTerm: "Undertale OST: 053 - Stronger Monsters",
            videoId: "HnmHqWU0z5M"
        }
    ];

    playlist = [];

    for (let i = 0; i < times; ++i) {
        let mod3 = i % 3;
        let itemBase = mockPlaylistItems[mod3];
        playlist.push({
            searchTerm: i + " " + itemBase.searchTerm,
            videoId: itemBase.videoId
        });
    }

    showPlaylist();
}
