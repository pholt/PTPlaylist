using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace PTPlaylistMVC.Controllers
{
    [Route("api/data")]
    public class DataController : ApiController
    {
        private static readonly string API_KEY = System.Web.Configuration.WebConfigurationManager.AppSettings["API_KEY"];
        private static readonly HttpClient client = new HttpClient();

        // GET api/data/{query}
        public async Task<string> GetAsync(string query)
        {
            // This query fetches a single result from the YouTubeV3 API.
            string urlBase = "https://www.googleapis.com/youtube/v3/search?key={0}&q={1}&part=snippet&maxResults=1&safeSearch=none&type=video&videoEmbeddable=true";
            string formattedUrl = String.Format(urlBase, API_KEY, HttpUtility.UrlEncode(query));

            try
            {
                string response = await client.GetStringAsync(formattedUrl);
                return response;
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }
    }
}