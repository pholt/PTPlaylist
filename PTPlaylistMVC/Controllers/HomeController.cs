using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PTPlaylistMVC.Controllers
{
    public class HomeController : Controller
    {
        const string API_KEY = "AIzaSyDsAmVRl5Gh6erfNjNQ-DBpeKa-5ukIcxc";

        public ActionResult Index()
        {
            return View();
        }
    }
}