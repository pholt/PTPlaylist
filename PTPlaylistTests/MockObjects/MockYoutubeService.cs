using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PTPlaylistMVC.Interfaces;

namespace PTPlaylistTests.MockObjects
{
    class MockYoutubeService : IYoutubeService
    {
        public async Task<string> GetSingleVideoId(string query)
        {
            return "mockVideoId";
        }

        public async Task<bool> IsYouTubeVideoPlayable(string videoId)
        {
            return videoId == "true";
        }
    }
}
