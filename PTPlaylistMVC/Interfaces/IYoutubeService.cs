using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace PTPlaylistMVC.Interfaces
{
    public interface IYoutubeService
    {
        Task<string> GetSingleVideoId(string query);
        Task<bool> IsYouTubeVideoPlayable(string videoId);
    }
}